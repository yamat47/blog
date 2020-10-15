---
title: 開発中の Rails アプリケーションに後から Active Storage を追加したくなったときの話
date: 2020-06-02 00:28:09
categories:
  - [Development]
tags:
  - [Ruby on Rails]
  - [ActiveStorage]
---

`rails new` したときにはいらないと思っていた Rails の機能を後から追加したくなること、皆さんはありませんか？ 最近作っているアプリでそんなことがあったので対処法をまとめておきます。

前提
----

API モードで作り始めた Rails アプリケーションで試していますが、API モードでなくても成り立つ話だと思います。

バージョンは公開時点で最新の 6.0.3.1 です（バージョンアップ大切）。

経緯
----

Active Storage の使い方は Rails ガイドなり先人の記事に詳しくまとまっているので省略します。

[Active Storage の概要 - Railsガイド](https://railsguides.jp/active_storage_overview.html)

これに沿って作っていこうとしたところ、その一番最初の手順である `rails active_storage:install` の実行に失敗しました。task がないって言われた...。

```
┏╸..t/football-game-reporter-api · ⎇ add-game-catch-image ‹✔›
┗╸❯❯❯ bundle exec rails active_storage:install
rails aborted!
Don't know how to build task 'active_storage:install' (See the list of available tasks with `rails --tasks`)
bin/rails:4:in `<main>'
(See full trace by running task with --trace)
```

一覧を出してみると確かにない...。

```
┏╸..t/football-game-reporter-api · ⎇ add-game-catch-image ‹✔›
┗╸❯❯❯ bundle exec rails --tasks
rails about                          # List versions of all Rails frameworks and the environment
rails app:template                   # Applies the template supplied by LOCATION=(/path/to/template) or URL
rails app:update                     # Update configs and some other initially generated files (or use just update:configs or update:bin)
rails db:create                      # Creates the database from DATABASE_URL or config/database.yml for the current RAILS_ENV (use db:create:all t...
rails db:drop                        # Drops the database from DATABASE_URL or config/database.yml for the current RAILS_ENV (use db:drop:all to dr...
rails db:environment:set             # Set the environment value for the database
rails db:fixtures:load               # Loads fixtures into the current environment's database
rails db:migrate                     # Migrate the database (options: VERSION=x, VERBOSE=false, SCOPE=blog)
rails db:migrate:status              # Display status of migrations
rails db:prepare                     # Runs setup if database does not exist, or runs migrations if it does
rails db:rollback                    # Rolls the schema back to the previous version (specify steps w/ STEP=n)
rails db:schema:cache:clear          # Clears a db/schema_cache.yml file
rails db:schema:cache:dump           # Creates a db/schema_cache.yml file
rails db:schema:dump                 # Creates a db/schema.rb file that is portable against any DB supported by Active Record
rails db:schema:load                 # Loads a schema.rb file into the database
rails db:seed                        # Loads the seed data from db/seeds.rb
rails db:seed:replant                # Truncates tables of each database for current environment and loads the seeds
rails db:setup                       # Creates the database, loads the schema, and initializes with the seed data (use db:reset to also drop the da...
rails db:structure:dump              # Dumps the database structure to db/structure.sql
rails db:structure:load              # Recreates the databases from the structure.sql file
rails db:version                     # Retrieves the current schema version number
rails log:clear                      # Truncates all/specified *.log files in log/ to zero bytes (specify which logs with LOGS=test,development)
rails middleware                     # Prints out your Rack middleware stack
rails restart                        # Restart app by touching tmp/restart.txt
rails secret                         # Generate a cryptographically secure secret key (this is typically used to generate a secret for cookie sessi...
rails spec                           # Run all specs in spec directory (excluding plugin specs)
rails spec:models                    # Run the code examples in spec/models
rails spec:validators                # Run the code examples in spec/validators
rails stats                          # Report code statistics (KLOCs, etc) from the application or engine
rails time:zones[country_or_offset]  # List all time zones, list by two-letter country code (`rails time:zones[US]`), or list by UTC offset (`rails...
rails tmp:clear                      # Clear cache, socket and screenshot files from tmp/ (narrow w/ tmp:cache:clear, tmp:sockets:clear, tmp:screen...
rails tmp:create                     # Creates tmp directories for cache, sockets, and pids
rails yarn:install                   # Install all JavaScript dependencies as specified via Yarn
rails zeitwerk:check                 # Checks project structure for Zeitwerk compatibility
```

対処法
----

Rails 本家の README に書いてある通り `require "active_storage/engine"` すれば十分でした。

> NOTE: If the task cannot be found, verify that require "active_storage/engine" is present in config/application.rb.

[rails/activestorage at master · rails/rails](https://github.com/rails/rails/tree/master/activestorage)

試してみると無事に task が追加されています。

```
┏╸..t/football-game-reporter-api · ⎇ add-game-catch-image ‹✚1›
┗╸❯❯❯ git diff
diff --git a/config/application.rb b/config/application.rb
index b47c87a..dec7181 100644
--- a/config/application.rb
+++ b/config/application.rb
@@ -5,7 +5,7 @@ require "rails"
 require "active_model/railtie"
 require "active_job/railtie"
 require "active_record/railtie"
-# require "active_storage/engine"
+require "active_storage/engine"
 require "action_controller/railtie"
 # require "action_mailer/railtie"
 # require "action_mailbox/engine"

┏╸..t/football-game-reporter-api · ⎇ add-game-catch-image ‹✚1›
┗╸❯❯❯ bundle exec rails --tasks
rails about                          # List versions of all Rails frameworks and the environment
rails active_storage:install         # Copy over the migration needed to the application
（以下略）
```

これで Active Storage を実行する準備が整いました。

原因
----

おそらく `rails new` したときに `--skip-active-storage` をしていたのでこの行がコメントアウトされており、それを元に戻し損ねていたのが原因です。

本家の README を読めば一瞬でわかりますね、反省。あとは使えるはずの機能が使えないあたりで require が足りていないことくらいには気付きたかったです、もっと反省。
