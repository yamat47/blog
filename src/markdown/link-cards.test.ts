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

  // The card's markup is the design system's, so a card is read here by what the blog gives it:
  // where it leads, and the texts it shows, in order.
  const linkOf = (card: string | undefined) => /^<a [^>]*href="([^"]*)"/.exec(card ?? "")?.[1];
  const textsOf = (card: string | undefined) => (card ?? "").split(/<[^>]*>/).filter(Boolean);

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
    const [above, card, below, ...rest] = (
      await render("前の段落\n\nhttps://example.com/guide\n\n次の段落")
    ).split("\n");
    assert.deepEqual([above, below, rest], ["<p>前の段落</p>", "<p>次の段落</p>", []]);
    assert.equal(linkOf(card), "https://example.com/guide");
    // What the linked page says of itself is written as text, never as markup.
    assert.deepEqual(textsOf(card), [
      "ガイド &lt;script&gt;alert(1)&lt;/script&gt;",
      "説明 &amp; 補足",
      "Example",
    ]);
    assert.match(card ?? "", /<img [^>]*src="https:\/\/cdn\.example\.com\/og\.png\?a=1&amp;b=2"/);
  });

  it("keeps a card out of the search index", async () => {
    assert.match(await render("https://example.com/guide"), /^<a data-pagefind-ignore="all" /);
  });

  it("names the site by its host and leaves out what the page does not have", async () => {
    const card = await render("https://example.com/plain");
    assert.deepEqual(textsOf(card), ["画像のないページ", "example.com"]);
    assert.doesNotMatch(card, /<img/);
  });

  it("names the site by its host when the page gives its own title as the site's name", async () => {
    assert.deepEqual(textsOf(await render("https://example.com/echo")), [
      "公式サイト",
      "example.com",
    ]);
  });

  it("shows the URL as the title of a page nothing is known about", async () => {
    const card = await render("https://down.example/page");
    assert.equal(linkOf(card), "https://down.example/page");
    assert.deepEqual(textsOf(card), ["https://down.example/page", "down.example"]);
  });

  it("turns a link to a post alone on its line into a card of that post", async () => {
    const card = await render("[前に書いた記事](../2022-06-02-turning-29/index.md)");
    assert.equal(linkOf(card), "/entry/2022/06/02/002443");
    assert.deepEqual(textsOf(card), ["29歳になりました", "blog.yamat47.me · 2022.06.02"]);
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
    assert.doesNotMatch(html, /data-pagefind-ignore/);
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
