import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parseFrontmatter } from "astro/markdown";
import { postId } from "../lib/post-id.ts";
import type { MdastPlugin } from "./mdast-plugin.ts";

const HAS_SCHEME = /^[a-z][a-z0-9+.-]*:/i;
const MARKDOWN_FILE = /\.md(?:[?#]|$)/;

export interface LinkContext {
  /** The Markdown file the link is written in, when the Markdown comes from a file. */
  from: URL | undefined;
  /** The folder that holds one folder per post. Ends with a slash. */
  postsDir: URL;
}

/** A post another post links to. */
export interface LinkedPost {
  /** Its URL path, with the fragment the link had. */
  path: string;
  /** Its frontmatter as written, not yet checked. */
  frontmatter: Record<string, unknown>;
}

/** Whether `href` is resolved against the file it is written in: not a URL, a path from the site's root, or a fragment. */
export function isRelativeLink(href: string): boolean {
  return !(HAS_SCHEME.test(href) || href.startsWith("/") || href.startsWith("#"));
}

/**
 * The post that the relative link `href` points at.
 *
 * A post links to another post by its file (../other-post/index.md), so the link works where the
 * Markdown is read as a file, and the target's URL is looked up here instead of being typed.
 * Nothing else a relative link could point at is published, so one that does not lead to a post's
 * file is an error, and so is one that leads to a post that does not exist.
 */
export function linkedPost(href: string, { from, postsDir }: LinkContext): LinkedPost {
  if (from === undefined) {
    throw new Error(`no file to resolve the relative link "${href}" against`);
  }

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

  const { frontmatter } = parseFrontmatter(source);
  return {
    path: `/entry/${postId(decodeURIComponent(folder), frontmatter)}${target.hash}`,
    frontmatter,
  };
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
  return {
    name: "post-links",
    link(node, ctx) {
      if (isRelativeLink(node.url)) {
        ctx.setField(node, "url", linkedPost(node.url, { from: ctx.fileURL, postsDir }).path);
      }
    },
    // The target of a reference-style link: [text][ref] with "[ref]: ../other-post/index.md" below.
    // A definition can just as well be the source of an image (![alt][ref]), and nothing here
    // says which, so only one that names a Markdown file is taken for a link to a post.
    definition(node, ctx) {
      if (isRelativeLink(node.url) && MARKDOWN_FILE.test(node.url)) {
        ctx.setField(node, "url", linkedPost(node.url, { from: ctx.fileURL, postsDir }).path);
      }
    },
  };
}
