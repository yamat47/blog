import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { decodePage, parsePageMetadata } from "./page-metadata.ts";

const PAGE = "https://example.com/articles/one";

describe("parsePageMetadata", () => {
  it("reads the Open Graph tags", () => {
    const html = `<head>
      <title>ページのタイトル | サイト</title>
      <meta property="og:title" content="記事のタイトル">
      <meta property="og:description" content="記事の説明">
      <meta property="og:image" content="https://cdn.example.com/og.png">
      <meta property="og:site_name" content="サイト">
    </head>`;
    assert.deepEqual(parsePageMetadata(html, PAGE), {
      title: "記事のタイトル",
      description: "記事の説明",
      image: "https://cdn.example.com/og.png",
      site: "サイト",
    });
  });

  it("falls back to the title tag and the description meta of a page without Open Graph tags", () => {
    const html = `<title>
        昔のページ
      </title><meta name="description" content="説明です">`;
    assert.deepEqual(parsePageMetadata(html, PAGE), {
      title: "昔のページ",
      description: "説明です",
      image: undefined,
      site: undefined,
    });
  });

  it("reads a tag whatever the order, case and quoting of its attributes", () => {
    const html = `<META CONTENT='順不同' PROPERTY="OG:TITLE" /><meta content=bare name=description>`;
    const { title, description } = parsePageMetadata(html, PAGE);
    assert.equal(title, "順不同");
    assert.equal(description, "bare");
  });

  it("decodes entities and joins lines", () => {
    const html = `<meta property="og:title" content="A &amp; B &#x3042;&#12356; &quot;C&quot;
      D">`;
    assert.equal(parsePageMetadata(html, PAGE).title, 'A & B あい "C" D');
  });

  it("resolves an image path against the page's URL", () => {
    const html = `<meta property="og:image" content="/images/og.png?v=1&amp;w=2">`;
    assert.equal(parsePageMetadata(html, PAGE).image, "https://example.com/images/og.png?v=1&w=2");
  });

  it("asks for an image on http over https, which is all a page on https loads", () => {
    const html = `<meta property="og:image" content="http://example.com/og.jpg">`;
    assert.equal(parsePageMetadata(html, PAGE).image, "https://example.com/og.jpg");
  });

  it("drops an image that is not on http or https", () => {
    const html = `<meta property="og:image" content="data:image/png;base64,AAAA">`;
    assert.equal(parsePageMetadata(html, PAGE).image, undefined);
  });

  it("cuts a description longer than a card can show", () => {
    const html = `<meta property="og:description" content="${"あ".repeat(500)}">`;
    const { description } = parsePageMetadata(html, PAGE);
    assert.equal(description?.length, 300);
    assert.ok(description?.endsWith("…"));
  });

  it("cuts between characters, not inside one", () => {
    const html = `<meta property="og:description" content="${"あ".repeat(298)}😀😀😀">`;
    assert.equal(parsePageMetadata(html, PAGE).description, `${"あ".repeat(298)}😀…`);
  });

  it("falls back past a tag that is present but empty", () => {
    const html = `<title>タイトルタグ</title>
      <meta property="og:title" content="   ">
      <meta property="og:description" content="">
      <meta name="description" content="説明メタ">
      <meta property="og:image" content="">
      <meta name="twitter:image" content="https://example.com/twitter.png">`;
    assert.deepEqual(parsePageMetadata(html, PAGE), {
      title: "タイトルタグ",
      description: "説明メタ",
      image: "https://example.com/twitter.png",
      site: undefined,
    });
  });

  it("reads a value that has a > in it", () => {
    const html = `<meta property="og:title" content="A > B"><meta name="description" content="次">`;
    assert.deepEqual(
      [parsePageMetadata(html, PAGE).title, parsePageMetadata(html, PAGE).description],
      ["A > B", "次"],
    );
  });

  it("leaves a numeric entity that is no character as written", () => {
    const html = `<meta property="og:title" content="A &#x110000; &#99999999; B">`;
    assert.equal(parsePageMetadata(html, PAGE).title, "A &#x110000; &#99999999; B");
  });

  it("has no title for a page that says nothing about itself", () => {
    assert.equal(parsePageMetadata("<p>本文だけ</p>", PAGE).title, undefined);
  });
});

describe("decodePage", () => {
  // 「日本語」 in Shift_JIS.
  const SHIFT_JIS = [0x93, 0xfa, 0x96, 0x7b, 0x8c, 0xea];
  const bytes = (prefix: string, tail: number[] = []) =>
    new Uint8Array([...new TextEncoder().encode(prefix), ...tail]);

  it("uses the encoding the server names", () => {
    assert.equal(
      decodePage(bytes("<title>", SHIFT_JIS), "text/html; charset=Shift_JIS"),
      "<title>日本語",
    );
  });

  it("uses the encoding the page names when the server names none", () => {
    assert.equal(
      decodePage(bytes('<meta charset="shift_jis"><title>', SHIFT_JIS), "text/html"),
      '<meta charset="shift_jis"><title>日本語',
    );
  });

  it("reads the page as UTF-8 when nothing names an encoding, or names one that does not exist", () => {
    assert.equal(decodePage(bytes("<title>日本語"), null), "<title>日本語");
    assert.equal(decodePage(bytes("<title>日本語"), "text/html; charset=x-nope"), "<title>日本語");
  });
});
