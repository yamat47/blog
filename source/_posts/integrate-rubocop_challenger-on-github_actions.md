---
title: RuboCop ChallengerをGitHub Actionsで動かす
date: 2020-12-29 0:53:41
categories:
  - [Development]
tags:
  - [Ruby on Rails]
  - [RuboCop]
  - [RuboCop Challenger]
---

**この内容は [Zenn.dev でも公開しています。](https://zenn.dev/yamat47/articles/219e14ebcf31a1d13ff4)**

RuboCop Challenger って知っていますか？
----

RuboCop Challenger という Gem があります。
これは `.rubocop_todo.yml` を再生成しつつ、自動修正が可能な cop の中から一つを選んで修正をする PR を作るところまで自動で行う CLI コマンドを提供しています。

* [ryz310/rubocop_challenger: Make a clean your rubocop_todo.yml with CI](https://github.com/ryz310/rubocop_challenger)
* [まだ .rubocop_todo.yml で消耗してるの？ - Feedforce Developer Blog](https://developer.feedforce.jp/entry/2018/12/05/140000)

このコマンドは CI ツールと組み合わせるととても強力です。
RuboCopを導入したときにできた巨大な `.rubocop_todo.yml` を少しずつ小さくしていくための手間を以下のように軽減することができます。

* CI ツールのスケジューラーを使い、定期的に新しい PR を作ってもらう
* [Review Assign Action](https://github.com/marketplace/actions/review-assign-action) などを組み合わせて自動でレビュワーをアサインする
* アサインされたレビュワーは PR の内容を確認してマージをする

RuboCop Challenger を GitHub Actions で使う
----

作者さんの記事や README では CircleCI を使っての実装方法が紹介されていましたが、最近であれば GitHub Actions を使うのがポピュラーでしょうか？
基本的には同じ流れで CI を設定すれば動きますが、若干変わる部分もあるので実装方法をメモしておきます。

```yaml
name: "RuboCop Challenge"

on:
  schedule:
    cron: '30 23 * * 1,2,3' # この設定の場合、火水木のAM8:30に自動でPRが作られます。

jobs:
  create-pr:
    name: Create Pull Request
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Ruby 2.6
        uses: ruby/setup-ruby@v1
        with:
          ruby-version: 2.6
      - name: Install bundler
        run: gem install bundler
      - name: Install gems
        run: bundle install --jobs 4 --retry 3
      - name: Set git configuration
        run: git config remote.origin.url "git@github.com:some-org/great-product.git" # プロジェクトごとに変わる値です。
      - name: Create RuboCop challenge pull request
        env:
          GITHUB_ACCESS_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: bundle exec rubocop_challenger go --base=develop --email=rubocop-challenger@example.com --name="Rubocop Challenger"
```

GitHub Actions の基本的な使い方はこの記事では解説しません。
[公式のドキュメント](https://docs.github.com/ja/free-pro-team@latest/actions) に詳しくまとまっているので、そちらを参考にしてください。

その前提で、いくつか README に載っている CircleCI の設定と異なっている部分をまとめます。

* GitHub の Private Access Token を取得する必要はありません。GitHub Actions の場合は `secrets.GITHUB_TOKEN` でトークンを取得することができます。
* 環境変数のセットは設定ファイルで行います。CircleCIのようにブラウザから設定画面を開く必要はありません。
* "Set git configuration" のステップで行っているように `remote.origin.url` を改めて設定する必要がありました。
* （GitHub Actions だからというではないですが）PR の target のブランチを指定するために `--base=develop` をオプションに追加しました。

人間は人間にしかできないことに精を出そう
----

機械に任せられることは任せてしまって、僕らは僕らにしかできないコードレビューに集中しましょう。
そして全部の todo を解消してなお時間が余ったら、桃鉄をやったりジムに通ったりして楽しいプライベートを過ごしましょう。
