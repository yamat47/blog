import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, it } from "node:test";
import { pathToFileURL } from "node:url";
import { createSatteriMarkdownProcessor } from "@astrojs/markdown-satteri";
import { isRelativeLink, linkedPostPath, postLinks } from "./post-links.ts";

// Three posts on disk: one without a slug, one moved from Hatena Blog, and the one the links are
// written in.
let root: string;
let context: { from: URL; postsDir: URL };

before(() => {
  root = mkdtempSync(join(tmpdir(), "post-links-"));
  const post = (folder: string, frontmatter: string) => {
    mkdirSync(join(root, "posts", folder), { recursive: true });
    writeFileSync(join(root, "posts", folder, "index.md"), `---\n${frontmatter}\n---\n\n本文\n`);
  };
  post("new-post", "title: 新しい記事");
  post("2022-06-02-turning-29", 'title: 29歳になりました\nslug: "2022/06/02/002443"');
  post("linking-post", "title: リンクする記事");
  context = {
    from: pathToFileURL(join(root, "posts", "linking-post", "index.md")),
    postsDir: pathToFileURL(`${join(root, "posts")}/`),
  };
});

after(() => {
  rmSync(root, { recursive: true });
});

describe("isRelativeLink", () => {
  it("is false for a URL, a path from the site's root and a fragment", () => {
    for (const href of [
      "https://example.com/a.md",
      "mailto:me@example.com",
      "/entry/a",
      "#section",
    ]) {
      assert.equal(isRelativeLink(href), false, href);
    }
  });

  it("is true for a path resolved against the file the link is in", () => {
    for (const href of ["../other-post/index.md", "./slides.pdf", "index.md#section"]) {
      assert.equal(isRelativeLink(href), true, href);
    }
  });
});

describe("linkedPostPath", () => {
  it("is /entry/<folder> for a post without a slug", () => {
    assert.equal(linkedPostPath("../new-post/index.md", context), "/entry/new-post");
  });

  it("is /entry/<slug> for a post moved from Hatena Blog", () => {
    assert.equal(
      linkedPostPath("../2022-06-02-turning-29/index.md", context),
      "/entry/2022/06/02/002443",
    );
  });

  it("keeps the fragment", () => {
    assert.equal(
      linkedPostPath("../new-post/index.md#heading", context),
      "/entry/new-post#heading",
    );
  });

  it("fails for a post that does not exist", () => {
    assert.throws(
      () => linkedPostPath("../no-such-post/index.md", context),
      /linking-post\/index\.md: "\.\.\/no-such-post\/index\.md" leads to a post that does not exist/,
    );
  });

  it("fails for a relative link that is not a post's file", () => {
    for (const href of [
      "../new-post/",
      "../new-post/photo.jpg",
      "./slides.pdf",
      "../../README.md",
    ]) {
      assert.throws(() => linkedPostPath(href, context), /does not lead to a post/, href);
    }
  });
});

// Through the processor Astro renders posts with, so a release of it that visits links or passes
// the file differently fails here.
describe("postLinks", () => {
  const render = async (
    markdown: string,
    options: { fileURL?: URL } = { fileURL: context.from },
  ) => {
    const processor = await createSatteriMarkdownProcessor({
      mdastPlugins: [postLinks(context.postsDir)],
      syntaxHighlight: false,
    });
    const { code } = await processor.render(markdown, options);
    return code;
  };

  it("turns a link to a post's file into the post's URL", async () => {
    const html = await render("[29歳](../2022-06-02-turning-29/index.md)");
    assert.match(html, /<a href="\/entry\/2022\/06\/02\/002443">29歳<\/a>/);
  });

  it("turns a reference-style link to a post's file into the post's URL", async () => {
    const html = await render("[新しい記事][new]\n\n[new]: ../new-post/index.md");
    assert.match(html, /<a href="\/entry\/new-post">新しい記事<\/a>/);
  });

  it("leaves a link to another site as written", async () => {
    const html = await render("[例](https://example.com/guide.md)");
    assert.match(html, /<a href="https:\/\/example\.com\/guide\.md">例<\/a>/);
  });

  it("leaves the definition of a reference-style image alone", async () => {
    const html = await render("![写真][photo]\n\n[photo]: ./photo.jpg");
    assert.match(html, /<img[^>]*alt="写真"/);
  });

  it("fails for a link to a post that does not exist", async () => {
    await assert.rejects(render("[ない](../no-such-post/index.md)"), /does not exist/);
  });

  it("fails for a relative link when the Markdown has no file", async () => {
    await assert.rejects(
      render("[新しい記事](../new-post/index.md)", {}),
      /no file to resolve the relative link/,
    );
  });
});
