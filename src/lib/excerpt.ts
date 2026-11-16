import { LINK_CARD_MARK } from "../markdown/link-card.ts";
import { decodeEntities, oneLine } from "./text.ts";

// What does not read as the post's own sentences: a heading, which has no full stop and would run
// into the paragraph after it, code, a card about another page, and what a browser does not show.
const NOT_PROSE = new RegExp(
  `<(h[1-6]|pre|script|style)\\b[\\s\\S]*?</\\1>|<a\\b[^>]*\\s${LINK_CARD_MARK}[\\s\\S]*?</a>`,
  "g",
);
const LINE_BREAK = /<br\b[^>]*>/g;
const TAG = /<!--[\s\S]*?-->|<\/?[a-zA-Z](?:"[^"]*"|'[^']*'|[^"'>])*>/g;

/**
 * The start of a post as plain text, at most `maxLength` characters, from its rendered HTML.
 * A text that is cut ends with an ellipsis.
 */
export function excerpt(html: string, maxLength: number): string {
  const text = html.replace(NOT_PROSE, " ").replace(LINE_BREAK, " ").replace(TAG, "");
  return oneLine(decodeEntities(text), maxLength);
}
