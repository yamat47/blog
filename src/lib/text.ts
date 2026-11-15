const NAMED_ENTITIES: Readonly<Record<string, string>> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  // X's embed code for a tweet has one in front of the author's name.
  mdash: "—",
};

const LAST_CODE_POINT = 0x10ffff;

/** `text` with its character references written as the characters they stand for. */
export function decodeEntities(text: string): string {
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

/**
 * `text` on one line, at most `maxLength` characters long. A text that is cut ends with an
 * ellipsis, which counts as one of the characters.
 */
export function oneLine(text: string, maxLength: number): string {
  const line = text.replace(/\s+/g, " ").trim();
  // Counted and cut by code point: cutting by UTF-16 unit could leave half of an emoji.
  const characters = [...line];
  if (characters.length <= maxLength) {
    return line;
  }
  return `${characters
    .slice(0, maxLength - 1)
    .join("")
    .trimEnd()}…`;
}
