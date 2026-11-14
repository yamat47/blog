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

/** A node of the Markdown tree that the processor renders as the HTML element `data` describes. */
export interface CardNode {
  type: string;
  data: { hName: string; hProperties: Record<string, string> };
  children: (CardNode | { type: "text"; value: string })[];
}

function element(
  type: string,
  hName: string,
  hProperties: Record<string, string>,
  children: CardNode["children"] = [],
): CardNode {
  return { type, data: { hName, hProperties }, children };
}

function span(className: string, text: string): CardNode {
  return element(className, "span", { class: className }, [{ type: "text", value: text }]);
}

/**
 * The Markdown tree node of a card: a link holding the title, the description, the site and the
 * thumbnail. Texts are tree nodes, not HTML, so the processor escapes them.
 *
 * The thumbnail is loaded from the other site, which can drop it any day. An image that fails to
 * load removes itself, and the card is laid out as one without a thumbnail. No referrer is sent,
 * so the other site does not learn which post a reader has open.
 */
export function linkCardNode(card: LinkCard): CardNode {
  const body = [span("link-card-title", card.title)];
  if (card.description !== undefined) {
    body.push(span("link-card-description", card.description));
  }
  body.push(
    span("link-card-site", card.date === undefined ? card.site : `${card.site} · ${card.date}`),
  );

  const children = [element("link-card-body", "span", { class: "link-card-body" }, body)];
  if (card.image !== undefined) {
    children.push(
      element("link-card-image", "img", {
        class: "link-card-image",
        src: card.image,
        alt: "",
        loading: "lazy",
        decoding: "async",
        referrerpolicy: "no-referrer",
        onerror: "this.remove()",
      }),
    );
  }
  return element("link-card", "a", { class: "link-card", href: card.href }, children);
}
