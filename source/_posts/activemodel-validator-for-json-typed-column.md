---
title: ActiveModelのバリデータでJSON型のカラムを検証する
date: 2020-09-23 23:25:55
categories:
  - [Development]
tags:
  - [Ruby on Rails]
  - [ActiveModel]
  - [Validation]
  - [JSON]
---

**この内容は [Zenn.dev でも公開しています。](https://zenn.dev/yamat47/articles/c86e320e31b907958cd4)**

JSON 型のカラムって使っていますか？
----

Rails ではいつからか JSON 型なカラムを扱うことができるようになりました。
テーブルの関連する情報だけどわざわざ別のテーブルをつくるほどのものでもない...といった情報を扱うときに使っている方も多いのではないでしょうか？

ただこの JSON 型のカラム、データの検証をするのが少し難しいです。
関連付けられているようなデータを扱えるとはいっても所詮は JSON。
僕らが慣れ親しんだ `ActiveModel` のレールに沿ってバリデーションをかけられるようなものではありません...。

素直に考えるとこういう検証方法になるはず
----

JSON は [JSON Schema](https://json-schema.org/) によって定められた書式を用いて形式を定めることができます。
定められる形式とは例えば「`name` と `title` をキーに持つハッシュ（のようなもの）」「数値が入った配列」といったものです。
素直に考えれば、Rails のバリデーションにおいても許容する JSON の形式を予め定義しておき、その形式に沿っているか検証すればよさそうです。

この手法でいく場合、例えば以下の Gem を使って実装している人が多いのではないでしょうか。

* [ruby-json-schema/json-schema](https://github.com/ruby-json-schema/json-schema), [davishmcclurg/json_schemer](https://github.com/davishmcclurg/json_schemer): JSON の値の検証方法を提供する Gem。
* [mirego/activerecord_json_validator](https://github.com/mirego/activerecord_json_validator): JSON の形式の検証をするカスタムバリデータを提供する Gem。

しかしこれは Rails が用意している検証方法とは全く異なる、Rails のレールから外れた検証方法です。
なるべくシンプルに、でも `ActiveModel` のバリデーションを使って検証をしようというのがこの記事のテーマです。

動作環境
----

これから出てくるコードは以下のバージョンで検証をしました。

* Ruby: 2.7.1
* Rails: 6.0.3.3

ただどのコードも最近出てきた新しい機能を使っているわけではないので、ある程度昔のバージョンまではそのまま動くかと思います。
（当然ですがどんどんバージョン上げていきましょうね、[kamipo さんもこう仰ってますし！](https://twitter.com/kamipo/status/1272651740941152256?s=21)）

場面設定
----

「ユーザーのプロフィール情報をそれぞれ別カラムにするのではなくまとめて JSON 型で定義する」という設定でコードを書いていきます。
何もしないとどんどん `users` テーブルが巨大化していってしまうのを JSON 型にすることでちょっとでも遅らせよう、といった意図です。

マイグレーションファイルがこちら。
JSON に含まれる値の制約条件も簡単にまとめています。

**`db/migrate/20200919051438_create_users.rb`**

```ruby
# profileカラムにJSON型を指定。
#
# 含める情報:
#   nickname: 4文字以上12文字以下の文字列
#   editor: 'vim' OR 'emacs'
#   website: URL形式の文字列
#
class CreateUsers < ActiveRecord::Migration[6.0]
  def change
    create_table :users do |t|
      t.json :profile, null: false
    end
  end
end
```

意図したバリデーションがかかっているかどうか判定するために RSpec でテストを書いておきます。
テスト対象をわかりやすくするために [tomykaira/rspec-parameterized](https://github.com/tomykaira/rspec-parameterized) を使っています。

**`spec/models/user_spec.rb`**

```ruby
require 'rails_helper'

RSpec.describe User do
  describe 'profileのバリデーション' do
    context 'profileが不正な値のとき' do
      where(:profile) do
        [
          nil,
          {},
          { nickname: nil, editor: 'vim', website: 'https://github.com/yamat47' }, # nicknameがnil
          { nickname: 'yamat47', editor: nil, website: 'https://github.com/yamat47' }, # editorがnil
          { nickname: 'yamat47', editor: 'vim', website: nil }, # websiteがnil
          { nickname: 'dog', editor: 'vim', website: 'https://github.com/yamat47' }, # nicknameが短い
          { nickname: 'superlongnickname', editor: 'vim', website: 'https://github.com/yamat47' }, # nicknameが長い
          { nickname: 'yamat47', editor: 'Visual Studio Code', website: 'https://github.com/yamat47' }, # editorが候補の中にない
          { nickname: 'yamat47', editor: 'vim', website: 'htps://github.com/yamat47' }, # websiteの形式に沿っていない（htpsで始まっている）
        ]
      end

      with_them do
        it { expect(User.new(profile: profile)).to be_invalid }
      end
    end

    context 'profileが正しい値のとき' do
      where(:profile) do
        [
          { nickname: 'yamat47', editor: 'vim', website: 'https://github.com/yamat47' },
          { nickname: 'yamat47', editor: 'emacs', website: 'https://github.com/yamat47' }
        ]
      end

      with_them do
        it { expect(User.new(profile: profile)).to be_valid }
      end
    end

    context 'profileに余計なパラメータが付いているとき' do
      it 'initializeをすると例外が発生する' do
        expect { User.new(nickname: 'yamat47', editor: 'vim', website: 'https://github.com/yamat47', birthday: Date.current) }.to raise_error ActiveModel::UnknownAttributeError
      end
    end
  end
end

```

ピュアな `ActiveRecord` のバリデーションの限界
----

素の `ActiveRecord` だと JSON の中身までは検証できず、できても値の存在確認くらいになってしまいます。

**`app/models/user.rb`**

```ruby
class User < ApplicationRecord
  validates :profile, presence: true
end
```

この時点でもすでに `nil` や `{}` が渡されたときには不正な値として弾くことができます。
しかしそれ以上の細かい検証ができないため、例えば必要な情報が足りていなくても保存することができてしまいます。

先ほど書いたテストもほとんどが失敗してしまいます。

```
$ bundle exec rspec spec/models/user_spec.rb
..FFFFFFF...

Failures:

  1) User profileのバリデーション profileが不正な値のとき profile: {:nickname=>nil, :editor=>"vim", :website=>"https://github.com/yamat47"} is expected to be invalid
     Failure/Error: it { expect(User.new(profile: profile)).to be_invalid }
       expected `#<User id: nil, profile: {"nickname"=>nil, "editor"=>"vim", "website"=>"https://github.com/yamat47"}>.invalid?` to return true, got false
     # ./spec/models/user_spec.rb:21:in `block (5 levels) in <top (required)>'

  2) User profileのバリデーション profileが不正な値のとき profile: {:nickname=>"yamat47", :editor=>nil, :website=>"https://github.com/yamat47"} is expected to be invalid
     Failure/Error: it { expect(User.new(profile: profile)).to be_invalid }
       expected `#<User id: nil, profile: {"nickname"=>"yamat47", "editor"=>nil, "website"=>"https://github.com/yamat47"}>.invalid?` to return true, got false
     # ./spec/models/user_spec.rb:21:in `block (5 levels) in <top (required)>'

  3) User profileのバリデーション profileが不正な値のとき profile: {:nickname=>"yamat47", :editor=>"vim", :website=>nil} is expected to be invalid
     Failure/Error: it { expect(User.new(profile: profile)).to be_invalid }
       expected `#<User id: nil, profile: {"nickname"=>"yamat47", "editor"=>"vim", "website"=>nil}>.invalid?` to return true, got false
     # ./spec/models/user_spec.rb:21:in `block (5 levels) in <top (required)>'

  4) User profileのバリデーション profileが不正な値のとき profile: {:nickname=>"dog", :editor=>"vim", :website=>"https://github.com/yamat47"} is expected to be invalid
     Failure/Error: it { expect(User.new(profile: profile)).to be_invalid }
       expected `#<User id: nil, profile: {"nickname"=>"dog", "editor"=>"vim", "website"=>"https://github.com/yamat47"}>.invalid?` to return true, got false
     # ./spec/models/user_spec.rb:21:in `block (5 levels) in <top (required)>'

  5) User profileのバリデーション profileが不正な値のとき profile: {:nickname=>"superlongnickname", :editor=>"vim", :website=>"https://github.com/yamat47"} is expected to be invalid
     Failure/Error: it { expect(User.new(profile: profile)).to be_invalid }
       expected `#<User id: nil, profile: {"nickname"=>"superlongnickname", "editor"=>"vim", "website"=>"https://github.com/yamat47"}>.invalid?` to return true, got false
     # ./spec/models/user_spec.rb:21:in `block (5 levels) in <top (required)>'

  6) User profileのバリデーション profileが不正な値のとき profile: {:nickname=>"yamat47", :editor=>"Visual Studio Code", :website=>"https://github.com/yamat47"} is expected to be invalid
     Failure/Error: it { expect(User.new(profile: profile)).to be_invalid }
       expected `#<User id: nil, profile: {"nickname"=>"yamat47", "editor"=>"Visual Studio Code", "website"=>"https://github.com/yamat47"}>.invalid?` to return true, got false
     # ./spec/models/user_spec.rb:21:in `block (5 levels) in <top (required)>'

  7) User profileのバリデーション profileが不正な値のとき profile: {:nickname=>"yamat47", :editor=>"vim", :website=>"htps://github.com/yamat47"} is expected to be invalid
     Failure/Error: it { expect(User.new(profile: profile)).to be_invalid }
       expected `#<User id: nil, profile: {"nickname"=>"yamat47", "editor"=>"vim", "website"=>"htps://github.com/yamat47"}>.invalid?` to return true, got false
     # ./spec/models/user_spec.rb:21:in `block (5 levels) in <top (required)>'

Finished in 0.02937 seconds (files took 1.21 seconds to load)
12 examples, 7 failures

Failed examples:

rspec './spec/models/user_spec.rb[1:1:1:3:1]' # User profileのバリデーション profileが不正な値のとき profile: {:nickname=>nil, :editor=>"vim", :website=>"https://github.com/yamat47"} is expected to be invalid
rspec './spec/models/user_spec.rb[1:1:1:4:1]' # User profileのバリデーション profileが不正な値のとき profile: {:nickname=>"yamat47", :editor=>nil, :website=>"https://github.com/yamat47"} is expected to be invalid
rspec './spec/models/user_spec.rb[1:1:1:5:1]' # User profileのバリデーション profileが不正な値のとき profile: {:nickname=>"yamat47", :editor=>"vim", :website=>nil} is expected to be invalid
rspec './spec/models/user_spec.rb[1:1:1:6:1]' # User profileのバリデーション profileが不正な値のとき profile: {:nickname=>"dog", :editor=>"vim", :website=>"https://github.com/yamat47"} is expected to be invalid
rspec './spec/models/user_spec.rb[1:1:1:7:1]' # User profileのバリデーション profileが不正な値のとき profile: {:nickname=>"superlongnickname", :editor=>"vim", :website=>"https://github.com/yamat47"} is expected to be invalid
rspec './spec/models/user_spec.rb[1:1:1:8:1]' # User profileのバリデーション profileが不正な値のとき profile: {:nickname=>"yamat47", :editor=>"Visual Studio Code", :website=>"https://github.com/yamat47"} is expected to be invalid
rspec './spec/models/user_spec.rb[1:1:1:9:1]' # User profileのバリデーション profileが不正な値のとき profile: {:nickname=>"yamat47", :editor=>"vim", :website=>"htps://github.com/yamat47"} is expected to be invalid
```

バリデーションのときだけ `ActiveModel` に変換をする
-----

この問題を解決するために、バリデーションのときだけ JSON 型カラムの値を `ActiveModel` のインスタンスに変換するという手法を取りました。
具体的には次のように行います。

**`app/models/user.rb`**

```ruby
class User < ApplicationRecord
  validates :profile, presence: true

  validates_with User::ProfileValidator, if: ->(user) { user.profile.present? }
end
```

**`app/validators/user/profile_validator.rb`**

```ruby
class User::ProfileValidator < ActiveModel::Validator
  def validate(record)
    profile = Profile.new(record.profile.symbolize_keys)

    return if profile.valid?

    # profileのバリデーションエラーをUserにマージする。
    #
    # Userに直接定義されているカラムとキーが被らないように
    # 'profile_'付きのキーにしておく。
    profile.errors.each do |attribute, message|
      record.errors.add("profile_#{attribute}", message)
    end
  end

  class Profile
    include ActiveModel::Model
    include ActiveModel::Attributes
    include ActiveModel::Validations

    attribute :nickname, :string
    attribute :editor, :string
    attribute :website, :string

    validates :nickname, length: { in: 4..12 }
    validates :editor, inclusion: { in: %w(vim emacs) }
    validates :website, presence: true, url: { allow_blank: true }
  end
end
```

**`app/validators/url_validator.rb`**

```ruby
# 参考: https://coderwall.com/p/ztig5g/validate-urls-in-rails

class UrlValidator < ActiveModel::EachValidator
  def validate_each(record, attribute, value)
    record.errors[attribute] << (options[:message] || "must be a valid URL") unless url_valid?(value)
  end

  # a URL may be technically well-formed but may
  # not actually be valid, so this checks for both.
  def url_valid?(url)
    url = URI.parse(url) rescue false
    url.kind_of?(URI::HTTP) || url.kind_of?(URI::HTTPS)
  end
end
```

ポイントは以下の通りです:

* `User::ProfileValidator` を作るかどうかは好みの問題ですが、かなり込み入ったロジックになるのでカスタムバリデータを定義するとコードの見通しはよくなります。
* `ActiveModel` のバリデーションの機能をフルに使えるため `UrlValidator` のような自前のバリデータを使って検証をすることもできます。
* エラーの情報は全て `User` にまとめることでエラーメッセージの翻訳をしやすくなります。

この修正により検証用のテストも全て成功するようになりました。

```
$ bundle exec rspec spec/models/user_spec.rb
............

Finished in 0.04782 seconds (files took 1.78 seconds to load)
12 examples, 0 failures
```

まとめ
----

うまく使えたら便利な JSON 型カラムをより Rails のレールに乗っけて扱うための工夫を紹介しました。
正規化を考えるとなかなか使いづらい型かもしれませんが、何も考えずに別のテーブルを追加する前に一度 JSON が使えないか考えてみるのもよいと思っています。

もし JSON 型のバリデーションで他の方法を使っている方がいればぜひ教えていただけると嬉しいです！

また今回使ったコードは [yamat47/rails-json-validation](https://github.com/yamat47/rails-json-validation) にまとめました。
参考にしていただけると嬉しいです。
