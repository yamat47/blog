import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { atomFeed, type Feed, htmlForFeed } from "./atom.ts";

const SITE_FEED: Omit<Feed, "entries"> = {
  title: "blog.example.com",
  subtitle: "Notes & more",
  author: "someone",
  lang: "ja",
  siteUrl: "https://blog.example.com/",
  feedUrl: "https://blog.example.com/feed.xml",
};

describe("atomFeed", () => {
  it("writes the site and each post as an Atom document", () => {
    const feed = atomFeed({
      ...SITE_FEED,
      entries: [
        {
          url: "https://blog.example.com/entry/second",
          title: "二つ目の記事",
          // 13:00 in Japan.
          publishedAt: new Date("2026-01-01T13:00:22+09:00"),
          html: "<p>本文</p>",
        },
        {
          url: "https://blog.example.com/entry/first",
          title: "一つ目の記事",
          publishedAt: new Date("2025-12-31T09:00:00+09:00"),
          html: "<p>はじめに</p>",
        },
      ],
    });

    assert.equal(
      feed,
      `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="ja">
  <title>blog.example.com</title>
  <subtitle>Notes &amp; more</subtitle>
  <link href="https://blog.example.com/"/>
  <link rel="self" type="application/atom+xml" href="https://blog.example.com/feed.xml"/>
  <id>https://blog.example.com/</id>
  <updated>2026-01-01T04:00:22.000Z</updated>
  <author>
    <name>someone</name>
  </author>
  <entry>
    <title>二つ目の記事</title>
    <link href="https://blog.example.com/entry/second"/>
    <id>https://blog.example.com/entry/second</id>
    <published>2026-01-01T04:00:22.000Z</published>
    <updated>2026-01-01T04:00:22.000Z</updated>
    <content type="html">&lt;p&gt;本文&lt;/p&gt;</content>
  </entry>
  <entry>
    <title>一つ目の記事</title>
    <link href="https://blog.example.com/entry/first"/>
    <id>https://blog.example.com/entry/first</id>
    <published>2025-12-31T00:00:00.000Z</published>
    <updated>2025-12-31T00:00:00.000Z</updated>
    <content type="html">&lt;p&gt;はじめに&lt;/p&gt;</content>
  </entry>
</feed>
`,
    );
  });

  it("writes a title and a body with markup in them as text", () => {
    const feed = atomFeed({
      ...SITE_FEED,
      entries: [
        {
          url: "https://blog.example.com/entry/tags",
          title: 'A <b> & "B"',
          publishedAt: new Date("2026-01-01T13:00:22+09:00"),
          html: '<a href="https://example.com/?a=1&amp;b=2">リンク</a>',
        },
      ],
    });

    assert.ok(feed.includes("<title>A &lt;b&gt; &amp; &quot;B&quot;</title>"));
    assert.ok(
      feed.includes(
        '<content type="html">&lt;a href=&quot;https://example.com/?a=1&amp;amp;b=2&quot;&gt;リンク&lt;/a&gt;</content>',
      ),
    );
  });

  it("drops a character XML does not allow, which would make the feed unreadable", () => {
    const feed = atomFeed({
      ...SITE_FEED,
      entries: [
        {
          url: "https://blog.example.com/entry/pasted",
          title: "貼り付けた\u0008文字",
          publishedAt: new Date("2026-01-01T13:00:22+09:00"),
          html: "<p>絵文字 🍤 はそのまま\u000B</p>",
        },
      ],
    });

    assert.ok(feed.includes("<title>貼り付けた文字</title>"));
    assert.ok(feed.includes("&lt;p&gt;絵文字 🍤 はそのまま&lt;/p&gt;"));
  });

  it("keeps the last character XML allows below the emoji and drops the two after it", () => {
    const feed = atomFeed({
      ...SITE_FEED,
      entries: [
        {
          url: "https://blog.example.com/entry/edge",
          title: "端\uFFFD\uFFFE\uFFFF",
          publishedAt: new Date("2026-01-01T13:00:22+09:00"),
          html: "",
        },
      ],
    });

    assert.ok(feed.includes("<title>端\uFFFD</title>"));
  });
  it("says a feed without a post was last updated at the start of 1970", () => {
    const feed = atomFeed({ ...SITE_FEED, entries: [] });

    assert.ok(feed.includes("<updated>1970-01-01T00:00:00.000Z</updated>"));
    assert.ok(!feed.includes("<entry>"));
  });
});

describe("htmlForFeed", () => {
  const forFeed = (html: string) => htmlForFeed(html, "https://blog.example.com");

  it("puts the site's address in front of an image and a link that start at the site's root", () => {
    assert.equal(
      forFeed(
        '<p><img src="/_astro/photo.abc.webp" alt=""><a href="/entry/first#top">前回</a></p>',
      ),
      '<p><img src="https://blog.example.com/_astro/photo.abc.webp" alt=""><a href="https://blog.example.com/entry/first#top">前回</a></p>',
    );
  });

  it("leaves a URL of another site, one without a scheme, and a link within the post", () => {
    const html =
      '<a href="https://example.com/">外</a><img src="//cdn.example.com/a.png"><a href="#section">節</a>';

    assert.equal(forFeed(html), html);
  });

  it("leaves HTML that a post shows as code, however its quotes are written", () => {
    const html =
      '<pre><code>&lt;a href="/entry/first" onerror="x()"&gt; &lt;a href=&quot;/entry/first&quot;&gt;</code></pre>';

    assert.equal(forFeed(html), html);
  });

  it("changes a tag whose earlier attribute has a > in it", () => {
    assert.equal(
      forFeed('<a title="a > b" href="/entry/first">前回</a>'),
      '<a title="a > b" href="https://blog.example.com/entry/first">前回</a>',
    );
  });

  it("takes the script off a link card's thumbnail", () => {
    assert.equal(
      forFeed(
        '<img class="link-card-image" src="https://cdn.example.com/og.png" alt="" onerror="this.remove()">',
      ),
      '<img class="link-card-image" src="https://cdn.example.com/og.png" alt="">',
    );
  });
});
