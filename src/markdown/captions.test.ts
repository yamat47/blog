import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createSatteriMarkdownProcessor } from "@astrojs/markdown-satteri";
import { captions } from "./captions.ts";

// Through the processor Astro renders posts with, so what is asserted is the HTML a post ends up
// with.
describe("captions", () => {
  // The processor leaves an image as a note for Astro, which later writes the processed image's
  // attributes in its place. The note is spelled out here as the attributes it carries, so that a
  // test reads like the page and does not depend on how the note is laid out.
  const withImagesSpelledOut = (html: string) =>
    html.replace(/<img __ASTRO_IMAGE_="([^"]*)">/g, (_, note: string) => {
      const { alt, title, src } = JSON.parse(note.replaceAll("&quot;", '"')) as {
        alt: string;
        title?: string;
        src: string;
      };
      return title === undefined
        ? `<img alt="${alt}" src="${src}">`
        : `<img alt="${alt}" title="${title}" src="${src}">`;
    });

  const render = async (markdown: string) => {
    const processor = await createSatteriMarkdownProcessor({
      mdastPlugins: [captions()],
      syntaxHighlight: false,
    });
    const { code, metadata } = await processor.render(markdown);
    return { html: withImagesSpelledOut(code.trim()), images: metadata.localImagePaths };
  };

  it("puts an image alone in its paragraph into a figure, with its title as the caption", async () => {
    const { html } = await render(
      '前の段落\n\n![花束](./photo.png "花束をいただきました")\n\n次の段落',
    );

    assert.equal(
      html,
      [
        "<p>前の段落</p>",
        '<figure><img alt="花束" src="./photo.png"><figcaption>花束をいただきました</figcaption></figure>',
        "<p>次の段落</p>",
      ].join("\n"),
    );
  });

  it("still hands the image to Astro, which makes the file it is shown from", async () => {
    const { images } = await render('![](./photo.png "花束をいただきました")');

    assert.deepEqual(images, ["./photo.png"]);
  });

  it("writes the caption as text", async () => {
    const { html } = await render('![](./photo.png "<b>花束</b> & 手紙")');

    assert.equal(
      html,
      '<figure><img alt="" src="./photo.png"><figcaption>&lt;b&gt;花束&lt;/b&gt; &amp; 手紙</figcaption></figure>',
    );
  });

  it("captions an image in a list item or a quote too", async () => {
    const figure = '<figure><img alt="" src="./photo.png"><figcaption>花束</figcaption></figure>';

    const list = await render('- ![](./photo.png "花束")');
    const quote = await render('> ![](./photo.png "花束")');

    assert.equal(list.html, `<ul>\n<li>\n${figure}\n</li>\n</ul>`);
    assert.equal(quote.html, `<blockquote>\n${figure}\n</blockquote>`);
  });

  it("leaves an image without a title in its paragraph", async () => {
    const { html } = await render("![花束](./photo.png)");

    assert.equal(html, '<p><img alt="花束" src="./photo.png"></p>');
  });

  it("leaves an image inside a sentence as it is, title included", async () => {
    const { html } = await render('写真は ![花束](./photo.png "花束") です。');

    assert.equal(html, '<p>写真は <img alt="花束" title="花束" src="./photo.png"> です。</p>');
  });

  it("leaves an image that is a link as it is", async () => {
    const { html } = await render('[![花束](./photo.png "花束")](https://example.com/)');

    assert.equal(
      html,
      '<p><a href="https://example.com/"><img alt="花束" title="花束" src="./photo.png"></a></p>',
    );
  });
});
