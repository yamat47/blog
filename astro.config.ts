import { satteri } from "@astrojs/markdown-satteri";
import { defineConfig } from "astro/config";
import { createCardStore } from "./src/markdown/card-store.ts";
import { fetchPage } from "./src/markdown/fetch-page.ts";
import { linkCards } from "./src/markdown/link-cards.ts";
import { postLinks } from "./src/markdown/post-links.ts";

const postsDir = new URL("./posts/", import.meta.url);
const cards = createCardStore({
  file: new URL("./data/link-cards.json", import.meta.url),
  fetchPage,
  warn: (message) => console.warn(message),
});

export default defineConfig({
  site: "https://blog.yamat47.me",

  // The posts written on Hatena Blog keep their URLs, which have no trailing slash
  // (/entry/2026/01/01/130022). Built as entry/2026/01/01/130022.html, GitHub Pages serves a post
  // at exactly that URL; built as a directory with index.html, it would redirect to the URL with
  // a slash, and bookmarks and counts keyed by the old URL would point at a redirect.
  trailingSlash: "never",
  build: { format: "file" },

  markdown: {
    processor: satteri({
      // A post shows what its author typed: "..." stays three dots and quotes stay straight, as
      // they were on Hatena Blog.
      features: { smartPunctuation: false },
      // Cards first: a link to a post that stands alone becomes a card, and the links that are
      // left get their URL from postLinks.
      mdastPlugins: [linkCards({ postsDir, cards }), postLinks(postsDir)],
    }),

    // The highlighter writes var(--astro-code-*) instead of colors of its own, so code blocks take
    // theirs from src/styles/tokens.css like everything else.
    shikiConfig: { theme: "css-variables" },
  },
});
