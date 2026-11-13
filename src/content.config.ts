import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

// One folder per post: posts/<name>/index.md with its images beside it. The folder name is the
// post's id and the last part of its URL (/entry/<name>). A post moved from Hatena Blog sets
// `slug` in its frontmatter to its old path (2026/01/01/130022), which the loader takes as the id
// instead, so the folder can have a readable name and the URL stays what it was.
const posts = defineCollection({
  loader: glob({ base: "./posts", pattern: "*/index.md" }),
  schema: z.object({
    title: z.string(),
    // A quoted string with an offset ("2026-01-01T13:00:22+09:00"). A time without one would be
    // read as UTC, nine hours off in Japan, and put a late-night post on the next day. Unquoted,
    // YAML turns it into a Date before this schema can see whether it had an offset.
    publishedAt: z.iso.datetime({ offset: true }).pipe(z.coerce.date()),
  }),
});

export const collections = { posts };
