const FOLDER_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SLUG = /^[a-z0-9]+(?:[-/][a-z0-9]+)*$/;

/**
 * The id of the post in `folder`: the part of its URL after /entry/.
 *
 * It is the `slug` in the post's frontmatter when there is one, which is how a post moved from
 * Hatena Blog keeps its old path, and the folder name otherwise. Either is used exactly as written.
 * A name with other characters is an error rather than something to tidy up: a rewritten name
 * would publish the post at a URL nobody typed, and a published URL never changes.
 */
export function postId(folder: string, frontmatter: Readonly<Record<string, unknown>>): string {
  const { slug } = frontmatter;
  if (slug === undefined) {
    if (!FOLDER_NAME.test(folder)) {
      throw new Error(
        `posts/${folder}: a post's folder name is its URL, so it can only have lowercase letters, digits and hyphens`,
      );
    }
    return folder;
  }
  if (typeof slug !== "string" || !SLUG.test(slug)) {
    throw new Error(
      `posts/${folder}: slug must be a quoted path of lowercase letters, digits, hyphens and slashes, such as "2026/01/01/130022"`,
    );
  }
  return slug;
}
