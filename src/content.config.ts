import { defineCollection } from "astro:content";
import { posix } from "node:path";
import { glob } from "astro/loaders";
import { postFrontmatter } from "./lib/post-frontmatter.ts";
import { postId } from "./lib/post-id.ts";

// One folder per post: posts/<name>/index.md with its images beside it. The post's id is the part
// of its URL after /entry/: the folder name, or the `slug` a post moved from Hatena Blog sets to
// its old path (2026/01/01/130022), so the folder can have a readable name and the URL stays what
// it was. postId decides it here and for the links between posts alike.
const posts = defineCollection({
  loader: glob({
    base: "./posts",
    pattern: "*/index.md",
    generateId: ({ entry, data }) => postId(posix.dirname(entry), data),
  }),
  schema: postFrontmatter,
});

export const collections = { posts };
