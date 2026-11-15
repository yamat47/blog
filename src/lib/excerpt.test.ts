import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { excerpt } from "./excerpt.ts";

describe("excerpt", () => {
  it("joins the paragraphs of a post into one line of text, without its headings", () => {
    const html = [
      "<p>転職して一ヶ月。</p>",
      '<h4 id="批判">批判について</h4>',
      '<p>最近<strong>ぐるぐる</strong>考えていたことを<a href="https://example.com/">まとめた</a>。<br>続きです。</p>',
    ].join("\n");

    assert.equal(
      excerpt(html, 120),
      "転職して一ヶ月。 最近ぐるぐる考えていたことをまとめた。 続きです。",
    );
  });

  it("cuts a long post to the length asked for, the ellipsis included", () => {
    assert.equal(excerpt("<p>あいうえお</p>\n<p>かきくけこ</p>", 8), "あいうえお か…");
  });

  it("leaves out an image, a code block, a link card and what a browser does not show", () => {
    const html = [
      '<p><img __ASTRO_IMAGE_="{&quot;src&quot;:&quot;./photo.jpg&quot;}"></p>',
      "<p>はじめに</p>",
      '<pre class="astro-code"><code><span class="line">const a = 1;</span></code></pre>',
      '<a class="link-card" href="https://example.com/" data-pagefind-ignore="all"><span class="link-card-body"><span class="link-card-title">よそのページ</span></span></a>',
      "<script>window.x = 1;</script>",
      "<style>p { color: red; }</style>",
      "<p>おわりに</p>",
    ].join("\n");

    assert.equal(excerpt(html, 120), "はじめに おわりに");
  });

  it("keeps a caption and a tweet as X's embed code writes it", () => {
    const html = [
      "<figure><img><figcaption>花束の写真</figcaption></figure>",
      '<blockquote class="twitter-tweet"><p lang="ja" dir="ltr">今日はもう寝ます</p>&mdash; Takuya Yamaguchi (@yamat47) <a href="https://twitter.com/yamat47/status/1">2022年6月1日</a></blockquote>',
    ].join("\n");

    assert.equal(
      excerpt(html, 120),
      "花束の写真 今日はもう寝ます— Takuya Yamaguchi (@yamat47) 2022年6月1日",
    );
  });

  it("writes a character the HTML had to escape as the character itself", () => {
    assert.equal(excerpt("<p>A &lt;b&gt; &amp; &quot;B&quot;</p>", 120), 'A <b> & "B"');
  });

  it("is empty for a post without words", () => {
    assert.equal(excerpt('<p><img src="/_astro/photo.webp" alt=""></p>', 120), "");
  });
});
