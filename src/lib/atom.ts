/** A post as the feed carries it. */
export interface FeedEntry {
  /** The post's URL, which is also what tells a feed reader one post from another. */
  url: string;
  title: string;
  publishedAt: Date;
  /** The post's body as HTML, ready for a reader outside the site (see {@link htmlForFeed}). */
  html: string;
}

export interface Feed {
  title: string;
  subtitle: string;
  author: string;
  lang: string;
  /** The site's top page. */
  siteUrl: string;
  /** Where the feed itself is published. */
  feedUrl: string;
  /** Newest first. */
  entries: readonly FeedEntry[];
}

// A character XML 1.0 does not allow in a document. One pasted into a post would otherwise make the
// whole feed unreadable to a strict parser.
const XML_FORBIDDEN_CHARACTER = /[^\t\n\r\u0020-\uD7FF\uE000-\uFFFD\u{10000}-\u{10FFFF}]/gu;

function escapeXml(text: string): string {
  return text
    .replace(XML_FORBIDDEN_CHARACTER, "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/**
 * The feed as an Atom document (RFC 4287).
 *
 * A post has no time of last change, so a post's `updated` is when it was published and the
 * feed's is that of its newest post. The document then depends on the posts alone, not on when it
 * was built. A feed without a post says it was last updated at the start of 1970.
 */
export function atomFeed(feed: Feed): string {
  const updated = feed.entries[0]?.publishedAt ?? new Date(0);
  const entries = feed.entries.map((entry) => {
    const published = entry.publishedAt.toISOString();
    return [
      "  <entry>",
      `    <title>${escapeXml(entry.title)}</title>`,
      `    <link href="${escapeXml(entry.url)}"/>`,
      `    <id>${escapeXml(entry.url)}</id>`,
      `    <published>${published}</published>`,
      `    <updated>${published}</updated>`,
      `    <content type="html">${escapeXml(entry.html)}</content>`,
      "  </entry>",
    ].join("\n");
  });

  return [
    '<?xml version="1.0" encoding="utf-8"?>',
    `<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="${escapeXml(feed.lang)}">`,
    `  <title>${escapeXml(feed.title)}</title>`,
    `  <subtitle>${escapeXml(feed.subtitle)}</subtitle>`,
    `  <link href="${escapeXml(feed.siteUrl)}"/>`,
    `  <link rel="self" type="application/atom+xml" href="${escapeXml(feed.feedUrl)}"/>`,
    `  <id>${escapeXml(feed.siteUrl)}</id>`,
    `  <updated>${updated.toISOString()}</updated>`,
    "  <author>",
    `    <name>${escapeXml(feed.author)}</name>`,
    "  </author>",
    ...entries,
    "</feed>",
    "",
  ].join("\n");
}

// A start tag, whatever its attributes hold. Text never has a bare "<" in it, so nothing else in a
// post's HTML matches.
const START_TAG = /<[a-zA-Z](?:"[^"]*"|'[^']*'|[^"'>])*>/g;

/**
 * A post's HTML as a feed reader can show it: the reader is not on the site, so a URL that starts
 * at the site's root (an image, a link to another post) gets the site's address in front.
 *
 * Only tags are changed. A post that shows such HTML as code keeps it as written.
 */
export function htmlForFeed(html: string, siteUrl: string): string {
  const origin = new URL(siteUrl).origin;
  return html.replace(START_TAG, (tag) =>
    tag.replace(/(\s(?:href|src))="\/(?!\/)/g, `$1="${origin}/`),
  );
}
