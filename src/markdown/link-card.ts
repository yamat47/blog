import { LinkCard as Card } from "@yamat47/pylon";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

/** What a link card shows. Everything but `href` comes from the linked page, so none of it is trusted. */
export interface LinkCard {
  href: string;
  title: string;
  description?: string | undefined;
  /** The URL of a thumbnail on the linked page's own site. */
  image?: string | undefined;
  /** The name of the site, or its host name when the page does not give one. */
  site: string;
  /** The day the linked page was published, as YYYY-MM-DD. */
  date?: string | undefined;
}

/**
 * The mark on a card's link as it stands in a post's HTML, which keeps the card out of the search
 * index and by which a card is found again there.
 */
export const LINK_CARD_MARK = 'data-pagefind-ignore="all"';

/** A node of the Markdown tree that the processor writes into the page as the HTML it holds. */
export interface CardNode {
  type: "html";
  value: string;
}

/**
 * The Markdown tree node of a card: the design system's link card, rendered to HTML here, when
 * the post is built. React writes every text it is given as text, so what the linked page says
 * of itself cannot become markup.
 *
 * The card is kept out of the search index (`LINK_CARD_MARK`): its words are the linked page's,
 * and indexed they would make the post a result for what another page says.
 */
export function linkCardNode(card: LinkCard): CardNode {
  const element = createElement(Card, {
    ...card,
    linkAttributes: { "data-pagefind-ignore": "all" },
  });
  return { type: "html", value: renderToStaticMarkup(element) };
}
