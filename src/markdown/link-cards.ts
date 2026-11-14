import { formatDay } from "../lib/date.ts";
import { postFrontmatter } from "../lib/post-frontmatter.ts";
import { SITE } from "../site.ts";
import type { CardStore } from "./card-store.ts";
import { type LinkCard, linkCardNode } from "./link-card.ts";
import type { MdastPlugin } from "./mdast-plugin.ts";
import { isRelativeLink, linkedPost } from "./post-links.ts";

interface LinkCardsOptions {
  /** The folder that holds one folder per post. Ends with a slash. */
  postsDir: URL;
  cards: CardStore;
}

function hostOf(url: string): string {
  return new URL(url).host;
}

/**
 * Turns a link that stands alone in a paragraph into a card.
 *
 * - A bare URL (https://example.com/page on a line of its own) becomes a card of that page, with
 *   what the card store knows about it. A page the store knows nothing about still gets a card,
 *   showing its URL, so a site that is down never stops a post from being built.
 * - A link to another post's file becomes a card of that post, made from its own frontmatter.
 *
 * A link with a text of its own ([the guide](https://example.com/guide)) stays a link: the author
 * chose its words. So does a URL inside a list or a quote, where a card would break the block up.
 */
export function linkCards({ postsDir, cards }: LinkCardsOptions): MdastPlugin {
  const externalCard = async (url: string): Promise<LinkCard> => {
    const stored = await cards.lookup(url);
    if (stored === undefined) {
      return { href: url, title: url, site: hostOf(url) };
    }
    // Some pages give their own title as the name of the site. The host says more than the
    // title twice.
    const site =
      stored.site === undefined || stored.site === stored.title ? hostOf(url) : stored.site;
    return { href: url, ...stored, site };
  };

  const postCard = (href: string, from: URL | undefined): LinkCard => {
    const post = linkedPost(href, { from, postsDir });
    const { title, publishedAt } = postFrontmatter.parse(post.frontmatter);
    return { href: post.path, title, site: SITE.title, date: formatDay(publishedAt) };
  };

  return {
    name: "link-cards",
    async paragraph(node, ctx) {
      const [link, ...others] = node.children;
      if (link?.type !== "link" || others.length > 0 || ctx.parent(node).type !== "root") {
        return;
      }

      if (isRelativeLink(link.url)) {
        ctx.replaceNode(node, linkCardNode(postCard(link.url, ctx.fileURL)));
        return;
      }

      const [text, ...rest] = link.children;
      const isBareUrl = text?.type === "text" && rest.length === 0 && text.value === link.url;
      if (isBareUrl && /^https?:/i.test(link.url)) {
        ctx.replaceNode(node, linkCardNode(await externalCard(link.url)));
      }
    },
  };
}
