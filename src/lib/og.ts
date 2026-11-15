import { SITE } from "../site";
import tokens from "../styles/tokens.css?raw";
import { tokenValue } from "./design-tokens";
import { ogCard } from "./og-card";

/**
 * The color a design token holds. The card is drawn by a library that knows no CSS, so a token
 * written any other way than `#rrggbb` (a `var()`, a color function) is an error that names it.
 */
function colorToken(name: string): string {
  const value = tokenValue(tokens, name);
  if (!/^#[0-9a-f]{6}$/i.test(value)) {
    throw new Error(`the share card needs ${name} as #rrggbb, and it is ${value}`);
  }
  return value;
}

/** Answers with the card a shared link shows, drawn in the site's colors. */
export async function ogCardResponse(title: string, footer: string): Promise<Response> {
  const png = await ogCard({
    title,
    footer,
    lang: SITE.lang,
    colors: {
      surface: colorToken("--color-surface"),
      ink: colorToken("--color-ink"),
      inkMuted: colorToken("--color-ink-muted"),
    },
  });
  return new Response(new Uint8Array(png), { headers: { "content-type": "image/png" } });
}
