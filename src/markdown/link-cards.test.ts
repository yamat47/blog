import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, it } from "node:test";
import { pathToFileURL } from "node:url";
import { createSatteriMarkdownProcessor } from "@astrojs/markdown-satteri";
import type { StoredCard } from "./card-store.ts";
import { linkCards } from "./link-cards.ts";
import { postLinks } from "./post-links.ts";

// Through the processor Astro renders posts with, and with postLinks after it as in
// astro.config.ts, so what is asserted is the HTML a post ends up with.
describe("linkCards", () => {
  let root: string;
  let postsDir: URL;
  let from: URL;
  let asked: string[];

  const KNOWN: Record<string, StoredCard> = {
    "https://example.com/guide": {
      title: "ガイド <script>alert(1)</script>",
      description: "説明 & 補足",
      image: "https://cdn.example.com/og.png?a=1&b=2",
      site: "Example",
    },
    "https://example.com/plain": { title: "画像のないページ" },
    "https://example.com/echo": { title: "公式サイト", site: "公式サイト" },
  };

  const render = async (markdown: string) => {
    const processor = await createSatteriMarkdownProcessor({
      mdastPlugins: [
        linkCards({
          postsDir,
          cards: {
            lookup: (url) => {
              asked.push(url);
              return Promise.resolve(KNOWN[url]);
            },
          },
        }),
        postLinks(postsDir),
      ],
      syntaxHighlight: false,
    });
    asked = [];
    return (await processor.render(markdown, { fileURL: from })).code.trim();
  };

  before(() => {
    root = mkdtempSync(join(tmpdir(), "link-cards-"));
    const post = (folder: string, frontmatter: string) => {
      mkdirSync(join(root, "posts", folder), { recursive: true });
      writeFileSync(join(root, "posts", folder, "index.md"), `---\n${frontmatter}\n---\n\n本文\n`);
    };
    post(
      "2022-06-02-turning-29",
      // 15:24 UTC on June 1 is already June 2 in Japan.
      'title: 29歳になりました\npublishedAt: "2022-06-01T15:24:43+00:00"\nslug: "2022/06/02/002443"',
    );
    post("linking-post", 'title: リンクする記事\npublishedAt: "2026-01-01T13:00:22+09:00"');
    postsDir = pathToFileURL(`${join(root, "posts")}/`);
    from = pathToFileURL(join(root, "posts", "linking-post", "index.md"));
  });

  after(() => {
    rmSync(root, { recursive: true });
  });

  it("turns a URL alone on its line into a card of that page", async () => {
    assert.equal(
      await render("前の段落\n\nhttps://example.com/guide\n\n次の段落"),
      [
        "<p>前の段落</p>",
        '<a class="link-card" href="https://example.com/guide">' +
          '<span class="link-card-body">' +
          '<span class="link-card-title">ガイド &lt;script&gt;alert(1)&lt;/script&gt;</span>' +
          '<span class="link-card-description">説明 &amp; 補足</span>' +
          '<span class="link-card-site">Example</span>' +
          "</span>" +
          '<img class="link-card-image" src="https://cdn.example.com/og.png?a=1&amp;b=2" alt=""' +
          ' loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.remove()">' +
          "</a>",
        "<p>次の段落</p>",
      ].join("\n"),
    );
  });

  it("names the site by its host and leaves out what the page does not have", async () => {
    assert.equal(
      await render("https://example.com/plain"),
      '<a class="link-card" href="https://example.com/plain">' +
        '<span class="link-card-body">' +
        '<span class="link-card-title">画像のないページ</span>' +
        '<span class="link-card-site">example.com</span>' +
        "</span></a>",
    );
  });

  it("names the site by its host when the page gives its own title as the site's name", async () => {
    assert.match(
      await render("https://example.com/echo"),
      /<span class="link-card-title">公式サイト<\/span><span class="link-card-site">example\.com<\/span>/,
    );
  });

  it("shows the URL as the title of a page nothing is known about", async () => {
    assert.equal(
      await render("https://down.example/page"),
      '<a class="link-card" href="https://down.example/page">' +
        '<span class="link-card-body">' +
        '<span class="link-card-title">https://down.example/page</span>' +
        '<span class="link-card-site">down.example</span>' +
        "</span></a>",
    );
  });

  it("turns a link to a post alone on its line into a card of that post", async () => {
    assert.equal(
      await render("[前に書いた記事](../2022-06-02-turning-29/index.md)"),
      '<a class="link-card" href="/entry/2022/06/02/002443">' +
        '<span class="link-card-body">' +
        '<span class="link-card-title">29歳になりました</span>' +
        '<span class="link-card-site">blog.yamat47.me · 2022-06-02</span>' +
        "</span></a>",
    );
    assert.deepEqual(asked, []);
  });

  it("leaves a link with words of its own as a link", async () => {
    assert.equal(
      await render("[ガイド](https://example.com/guide)"),
      '<p><a href="https://example.com/guide">ガイド</a></p>',
    );
    assert.deepEqual(asked, []);
  });

  it("leaves a URL inside a sentence, a list or a quote as a link", async () => {
    const html = await render(
      "詳しくは https://example.com/guide を参照\n\n- https://example.com/guide\n\n> https://example.com/guide",
    );
    assert.doesNotMatch(html, /link-card/);
    assert.equal(html.match(/<a href="https:\/\/example\.com\/guide">/g)?.length, 3);
    assert.deepEqual(asked, []);
  });

  it("leaves a link to a post inside a sentence as a link to its URL", async () => {
    assert.equal(
      await render("[前に書いた記事](../2022-06-02-turning-29/index.md)の続きです"),
      '<p><a href="/entry/2022/06/02/002443">前に書いた記事</a>の続きです</p>',
    );
  });

  it("fails for a link to a post that does not exist, alone on its line or not", async () => {
    await assert.rejects(render("[ない](../no-such-post/index.md)"), /does not exist/);
    await assert.rejects(render("[ない](../no-such-post/index.md)です"), /does not exist/);
  });
});
