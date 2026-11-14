import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hasTweet } from "./tweets.ts";

describe("hasTweet", () => {
  it("finds a tweet written as X's embed code", () => {
    const html = [
      "<p>本文</p>",
      '<blockquote class="twitter-tweet" data-lang="ja"><p lang="ja" dir="ltr">今日はもう寝ます</p>— Takuya Yamaguchi (@yamat47) <a href="https://twitter.com/yamat47/status/1531964393088745473">2022年6月1日</a></blockquote>',
    ].join("\n");

    assert.equal(hasTweet(html), true);
  });

  it("finds one whose class is not the first attribute", () => {
    assert.equal(hasTweet('<blockquote data-lang="ja" class="twitter-tweet">…</blockquote>'), true);
  });

  it("finds none in a post with an ordinary quote and a link to a tweet", () => {
    const html = [
      "<blockquote><p>引用した文章</p></blockquote>",
      '<p><a href="https://twitter.com/yamat47/status/1531964393088745473">ツイート</a></p>',
    ].join("\n");

    assert.equal(hasTweet(html), false);
  });

  it("finds none in a post that shows the embed code as code", () => {
    const html =
      '<pre><code>&lt;blockquote class="twitter-tweet"&gt;…&lt;/blockquote&gt;</code></pre>';

    assert.equal(hasTweet(html), false);
  });
});
