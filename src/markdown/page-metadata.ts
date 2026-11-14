/** What a page says about itself in its `<head>`. Every field is missing when the page does not say. */
export interface PageMetadata {
  title?: string | undefined;
  description?: string | undefined;
  /** An absolute https URL. */
  image?: string | undefined;
  site?: string | undefined;
}

const NAMED_ENTITIES: Readonly<Record<string, string>> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

// A description is shown in two or three lines; a page that puts its whole body there would
// otherwise fill the cache file.
const MAX_TEXT_LENGTH = 300;

const LAST_CODE_POINT = 0x10ffff;

function decodeEntities(text: string): string {
  return text.replace(/&(?:#(\d+)|#x([0-9a-f]+)|([a-z]+));/gi, (entity, decimal, hex, name) => {
    if (name !== undefined) {
      return NAMED_ENTITIES[String(name).toLowerCase()] ?? entity;
    }
    const codePoint =
      decimal === undefined ? Number.parseInt(hex, 16) : Number.parseInt(decimal, 10);
    // A number that is no character stays as written; String.fromCodePoint would throw on it.
    return codePoint <= LAST_CODE_POINT ? String.fromCodePoint(codePoint) : entity;
  });
}

function clean(text: string | undefined): string | undefined {
  if (text === undefined) {
    return undefined;
  }
  const cleaned = decodeEntities(text).replace(/\s+/g, " ").trim();
  if (cleaned === "") {
    return undefined;
  }
  // Counted and cut by character: cutting by UTF-16 unit could leave half of an emoji.
  const characters = [...cleaned];
  return characters.length > MAX_TEXT_LENGTH
    ? `${characters.slice(0, MAX_TEXT_LENGTH - 1).join("")}…`
    : cleaned;
}

/** The first of `candidates` that has text in it. A tag that is present but empty does not count. */
function firstText(...candidates: (string | undefined)[]): string | undefined {
  for (const candidate of candidates) {
    const text = clean(candidate);
    if (text !== undefined) {
      return text;
    }
  }
  return undefined;
}

/** The first `content` of each `<meta>`, keyed by its lowercased `property` or `name`. */
function metaContents(html: string): Map<string, string> {
  const contents = new Map<string, string>();
  // A quoted value may hold a ">", so the tag ends at the first one outside quotes.
  for (const [tag] of html.matchAll(/<meta\b(?:[^>"']|"[^"]*"|'[^']*')*>/gi)) {
    const attributes = new Map<string, string>();
    for (const [, name, double, single, bare] of tag.matchAll(
      /([^\s"'=<>/]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g,
    )) {
      if (name !== undefined) {
        attributes.set(name.toLowerCase(), double ?? single ?? bare ?? "");
      }
    }
    const key = (attributes.get("property") ?? attributes.get("name"))?.toLowerCase();
    const content = attributes.get("content");
    if (key !== undefined && content !== undefined && !contents.has(key)) {
      contents.set(key, content);
    }
  }
  return contents;
}

/**
 * The URL of a page's image as an https URL, or `undefined` when it is not a web address.
 *
 * An image on http is not loaded by a page on https, which this site is, so it is asked for on
 * https. A server without it there fails the request, and the card drops the image.
 */
function imageUrl(url: string | undefined, base: string): string | undefined {
  const reference = url === undefined ? "" : decodeEntities(url).trim();
  // An empty reference would resolve to the page itself.
  if (reference === "") {
    return undefined;
  }
  let resolved: URL;
  try {
    resolved = new URL(reference, base);
  } catch {
    return undefined;
  }
  if (resolved.protocol === "http:") {
    resolved.protocol = "https:";
  }
  return resolved.protocol === "https:" ? resolved.href : undefined;
}

/**
 * Reads the Open Graph tags of `html`, the page at `pageUrl`, falling back to what a page without
 * them still has: Twitter's tags, the description meta and the `<title>`.
 *
 * It reads `<meta>` tags with a pattern instead of parsing the document. The tags it wants are
 * flat and near the top, and a page that breaks the pattern only loses its card's details.
 */
export function parsePageMetadata(html: string, pageUrl: string): PageMetadata {
  const meta = metaContents(html);
  const titleTag = /<title\b[^>]*>([^<]*)<\/title>/i.exec(html)?.[1];
  return {
    title: firstText(meta.get("og:title"), meta.get("twitter:title"), titleTag),
    description: firstText(
      meta.get("og:description"),
      meta.get("twitter:description"),
      meta.get("description"),
    ),
    image: imageUrl(meta.get("og:image"), pageUrl) ?? imageUrl(meta.get("twitter:image"), pageUrl),
    site: firstText(meta.get("og:site_name")),
  };
}

/**
 * The text of a page from its bytes. The encoding is the one the server names in Content-Type, or
 * else the one the page names near its top, or else UTF-8: older Japanese sites still serve
 * Shift_JIS or EUC-JP, and their titles are unreadable when taken for UTF-8.
 */
export function decodePage(bytes: Uint8Array, contentType: string | null): string {
  const head = new TextDecoder("latin1").decode(bytes.subarray(0, 4096));
  const charset =
    /charset\s*=\s*["']?([\w-]+)/i.exec(contentType ?? "")?.[1] ??
    /<meta\b[^>]*charset\s*=\s*["']?([\w-]+)/i.exec(head)?.[1] ??
    "utf-8";
  try {
    return new TextDecoder(charset).decode(bytes);
  } catch (error) {
    // An encoding name TextDecoder does not know.
    if (error instanceof RangeError) {
      return new TextDecoder("utf-8").decode(bytes);
    }
    throw error;
  }
}
