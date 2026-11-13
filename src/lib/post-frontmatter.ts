import { z } from "astro/zod";

/** What the frontmatter of a post must have. `slug` is read apart from it, by `postId`. */
export const postFrontmatter = z.object({
  title: z.string(),
  // A quoted string with an offset ("2026-01-01T13:00:22+09:00"). A time without one would be
  // read as UTC, nine hours off in Japan, and put a late-night post on the next day. Unquoted,
  // YAML turns it into a Date before this schema can see whether it had an offset.
  publishedAt: z.iso.datetime({ offset: true }).pipe(z.coerce.date()),
});
