import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://blog.yamat47.me",

  // The posts written on Hatena Blog keep their URLs, which have no trailing slash
  // (/entry/2026/01/01/130022). Built as entry/2026/01/01/130022.html, GitHub Pages serves a post
  // at exactly that URL; built as a directory with index.html, it would redirect to the URL with
  // a slash, and bookmarks and counts keyed by the old URL would point at a redirect.
  trailingSlash: "never",
  build: { format: "file" },

  // The highlighter writes var(--astro-code-*) instead of colors of its own, so code blocks take
  // theirs from src/styles/tokens.css like everything else.
  markdown: { shikiConfig: { theme: "css-variables" } },
});
