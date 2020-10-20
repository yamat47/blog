---
title: Capistranoで動的な値をセットするときはProcを渡そう
date: 2020-10-20 23:35:41
categories:
  - [Development]
tags:
  - [Ruby on Rails]
  - [Capistrano]
---

**この内容は [Zenn.dev でも公開しています。](https://zenn.dev/yamat47/articles/027d9974bfccc6f63ece)**

Rails のデプロイで使われることの多い Capistrano、こんな感じで設定ファイルを書きますよね：

```ruby
# If the environment differs from the stage name
set :rails_env, 'staging'

# Defaults to :db role
set :migration_role, :db

# Defaults to the primary :db server
set :migration_servers, -> { primary(fetch(:migration_role)) }
```

（[capistrano/rails](https://github.com/capistrano/rails) から引用しました）

このサンプルコードにも含まれていますが `#set` にはシンボルや文字列だけでなく Proc を渡すこともできます。
Procを渡したときはそうでないときと少し違う挙動になるので気を付けよう、という話です。

`#set` に Proc 以外を渡したときの挙動
----

```ruby
set :rails_env, 'staging'
set :migration_role, :db
```

ここでセットした値は `#fetch` を呼ぶことで他の部分でもアクセスすることができます。
そのときに返ってくる値は `#set` に渡した値そのもの（`'staging'`、`:db`）です。

`#set` に Proc を渡したときの挙動
----

```ruby
set :migration_servers, -> { primary(fetch(:migration_role)) }
```

ここでは `:migration_servers` というキーに `-> { primary(fetch(:migration_role)) }` という Proc が値としてセットされています。

**この Proc はすぐに評価されるわけではなく、キーが `#fetch` されたときに初めて評価されます。**
そのため `:migration_role` に値をセットするのが後になっても参照されて動作します。

```ruby
set :migration_servers, -> { primary(fetch(:migration_role)) }
set :migration_role, :db

fetch(:migration_servers) # このタイミングで初めて Proc が評価されて値がセットされる
```

評価されるタイミングが遅くなるのは Proc だからです。
↓ の例のように文字列 & 式展開をした場合は先ほど `'staging'` を渡したときと同様にすぐに値がセットされてしまいます。

```ruby
set :migration_servers, "#{primary(fetch(:migration_role))}" # migration_roleはまだセットされていない = nilとして扱われる
set :migration_role, :db

fetch(:migration_servers) # set :migration_serversしたときの値が返ってくる
```

動的な値をセットするときは Proc を渡そう
---

上の例のように、他にセットした値を使って動的に値を作る場合は Proc を渡すと安全です。
値がセットされる順番に変に依存したコードにならないで済むためです。

例えば [capistrano/rbenv](https://github.com/capistrano/rbenv) の README にはこのような例が載っています。

```ruby
set :rbenv_prefix, "RBENV_ROOT=#{fetch(:rbenv_path)} RBENV_VERSION=#{fetch(:rbenv_ruby)} #{fetch(:rbenv_path)}/bin/rbenv exec"
```

ここでは `rbenv_path` や `rbenv_ruby` を使って rbenv を実行するときのコマンドを定義しています。
README に載っている定義通りに値をセットすれば問題なく動作しますが...
何かの拍子（設定ファイルの一部を切り出したなど）に `rbenv_ruby` がセットされるタイミングが `rbenv_prefix` よりも遅くなってしまった途端に動かなくなってしまいます。

こうした不具合を避けるために、順番に依存しないコードにしたい場合は次のようなコードにしましょう。

```ruby
set :rbenv_prefix, -> { "RBENV_ROOT=#{fetch(:rbenv_path)} RBENV_VERSION=#{fetch(:rbenv_ruby)} #{fetch(:rbenv_path)}/bin/rbenv exec" }
```

（おまけ）Capistrano のコードを追ってみる
----

Capistrano の `#set` は [`Capistrano::Configuration::Variables`](https://github.com/capistrano/capistrano/blob/master/lib/capistrano/configuration/variables.rb#L37-L43) に定義されています。
要はハッシュである `values` の `key` に渡された `value` をセットしているだけです。

```ruby
def set(key, value=nil, &block)
  @trusted_keys << key if trusted? && !@trusted_keys.include?(key)
  remember_location(key)
  values[key] = block || value
  trace_set(key)
  values[key]
end
```

`#fetch` の定義は [こちら](https://github.com/capistrano/capistrano/blob/master/lib/capistrano/configuration/variables.rb#L45-L48) 。
Internal use only な `#peek` というメソッドへと処理が移譲されています。

```ruby
def fetch(key, default=nil, &block)
  fetched_keys << key unless fetched_keys.include?(key)
  peek(key, default, &block)
end
```

そして `#peek` の定義は [こちら](https://github.com/capistrano/capistrano/blob/master/lib/capistrano/configuration/variables.rb#L50-L57) 。
`value` が `#callable_without_parameters?` な値のときは `#call` を呼んで、その値をセットしています。

```ruby
# Internal use only.
def peek(key, default=nil, &block)
  value = fetch_for(key, default, &block)
  while callable_without_parameters?(value)
    value = (values[key] = value.call)
  end
  value
end
```

すなわち

* `#set` でセットされた値が `#callable_without_parameters?` なときは `#fetch` されたときに `#call` された値が返る
* `#set` でセットされた値が `#callable_without_parameters?` ではないときはその値をそのまま返す

という挙動になります。

ちなみに `#callable_without_parameters?` は[「`#call` メソッドを実装している && 引数が0個」という判定をしています。](https://github.com/capistrano/capistrano/blob/d3699679b01392e26f5ba214b01bd5ee4729c3ec/lib/capistrano/proc_helpers.rb#L5-L11)
（`Method#arity` なんてこのコードリーディングをしていたときに初めてみました... 👀 ）

自作の Class を作って `#call` メソッドを実装すれば `#callable_without_parameters?` に当てはまります。
しかしこの用途ではほとんどの場合 Proc を使うだろうことを踏まえて、冒頭から Proc に限った話にしていました。
