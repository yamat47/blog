import tokens from "@yamat47/pylon/tokens.json";
import { SITE } from "../site";
import { ogCard } from "./og-card";

/**
 * The color a design token holds on the light surface, which is what the card is drawn on. The
 * card is drawn by a library that knows no CSS, so the color is read from the design system's
 * tokens as data, and a token that is missing or not written as `#rrggbb` is an error that names
 * it: a card drawn with a color made up here would stop following the design without anyone
 * noticing.
 */
function colorToken(name: string): string {
  const value = tokens.color.tokens.find((token) => token.name === name)?.value.light;
  if (value === undefined) {
    throw new Error(`the design tokens have no ${name}`);
  }
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
      surface: colorToken("color-surface"),
      ink: colorToken("color-ink"),
      inkMuted: colorToken("color-ink-muted"),
    },
  });
  return new Response(new Uint8Array(png), { headers: { "content-type": "image/png" } });
}
