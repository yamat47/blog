import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { SatteriProcessorOptions } from "@astrojs/markdown-satteri";
import { parseFrontmatter } from "astro/markdown";
import { postId } from "../lib/post-id.ts";

// The plugin type is taken from the processor's options because satteri, which declares it, is
// not a direct dependency. An entry of the option can also be a function that makes a plugin, and
// a function has a name too, so those are taken out again.
type MdastPluginEntry = NonNullable<SatteriProcessorOptions["mdastPlugins"]>[number];
type MdastPlugin = Exclude<
  Extract<MdastPluginEntry, { name: string }>,
  (...args: never[]) => unknown
>;

const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i;
const MARKDOWN_FILE = /\.md(?:[?#]|$)/;

interface LinkContext {
  /** The Markdown file the link is written in. */
  from: URL;
  /** The folder that holds one folder per post. Ends with a slash. */
  postsDir: URL;
}

/** Whether `href` is resolved against the file it is written in: not a URL, a path from the site's root, or a fragment. */
export function isRelativeLink(href: string): boolean {
  return !(HAS_SCHEME.test(href) || href.startsWith("/") || href.startsWith("#"));
}

/**
 * The URL path of the post that the relative link `href` points at.
 *
 * A post links to another post by its file (../other-post/index.md), so the link works where the
 * Markdown is read as a file, and the target's URL is looked up here instead of being typed.
 * Nothing else a relative link could point at is published, so one that does not lead to a post's
 * file is an error, and so is one that leads to a post that does not exist.
 */
export function linkedPostPath(href: string, { from, postsDir }: LinkContext): string {
  const target = new URL(href, from);
  const folder = target.pathname.startsWith(postsDir.pathname)
    ? /^([^/]+)\/index\.md$/.exec(target.pathname.slice(postsDir.pathname.length))?.[1]
    : undefined;
  if (folder === undefined) {
    throw new Error(
      `${fileURLToPath(from)}: "${href}" does not lead to a post. Link to the post's file, as in ../other-post/index.md`,
    );
  }

  const file = new URL(target);
  file.hash = "";
  let source: string;
  try {
    source = readFileSync(file, "utf8");
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      throw new Error(`${fileURLToPath(from)}: "${href}" leads to a post that does not exist`);
    }
    throw error;
  }

  const id = postId(decodeURIComponent(folder), parseFrontmatter(source).frontmatter);
  return `/entry/${id}${target.hash}`;
}

/**
 * Rewrites every link to a post's file into that post's URL, and fails on a link that leads nowhere.
 *
 * The check runs while the post that holds the link is rendered. Astro keeps a post's rendered
 * HTML while its own file is unchanged, and from that cache a post would keep a link whose target
 * was renamed or removed. That is why the build renders every post (`astro build --force` in
 * package.json).
 */
export function postLinks(postsDir: URL): MdastPlugin {
  const resolve = (href: string, from: URL | undefined): string | undefined => {
    if (!isRelativeLink(href)) {
      return undefined;
    }
    if (from === undefined) {
      throw new Error(`post-links: no file to resolve the relative link "${href}" against`);
    }
    return linkedPostPath(href, { from, postsDir });
  };

  return {
    name: "post-links",
    link(node, ctx) {
      const path = resolve(node.url, ctx.fileURL);
      if (path !== undefined) {
        ctx.setField(node, "url", path);
      }
    },
    // The target of a reference-style link: [text][ref] with "[ref]: ../other-post/index.md" below.
    // A definition can just as well be the source of an image (![alt][ref]), and nothing here
    // says which, so only one that names a Markdown file is taken for a link to a post.
    definition(node, ctx) {
      if (!MARKDOWN_FILE.test(node.url)) {
        return;
      }
      const path = resolve(node.url, ctx.fileURL);
      if (path !== undefined) {
        ctx.setField(node, "url", path);
      }
    },
  };
}
