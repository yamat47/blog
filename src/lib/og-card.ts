import { join, resolve } from "node:path";
import sharp from "sharp";

/** The size of a card: the 1.91:1 that X, Slack and Facebook show a shared link's image at. */
export const OG_CARD_SIZE = { width: 1200, height: 630 } as const;

/** The card a shared link shows in place of the page: a title, and under it where it is from. */
export interface OgCard {
  /** The large text: a post's title. */
  title: string;
  /** The small text at the bottom: the site's name. */
  footer: string;
  /** The language of the two texts, such as `ja`, which decides where a line may break. */
  lang: string;
  /** Colors as `#rrggbb`. */
  colors: { surface: string; ink: string; inkMuted: string };
}

// The card is an image, so its sizes are pixels of that image and live here, not in the design
// system. Its colors are the caller's, who reads them from the design system's tokens.
const BAND_HEIGHT = 16;
const MARGIN = 80;
const TITLE_SIZE = 64;
const FOOTER_SIZE = 32;
const TITLE_TOP = BAND_HEIGHT + 64;
const FOOTER_BOTTOM = OG_CARD_SIZE.height - 64;
// The least space between the title and the footer.
const GAP = 40;
const TEXT_WIDTH = OG_CARD_SIZE.width - MARGIN * 2;

// The font is a file in the repository (fonts/, whose README says where it is from), because
// neither the development container nor CI has a Japanese font. The paths start at the repository's root, which is where the build and
// the tests run; a path beside this module would point into dist/ once the build has bundled it.
const FONTS_DIR = resolve("fonts");
const FONT_FILE = join(FONTS_DIR, "NotoSansJP-Bold.otf");
const FONT_FAMILY = "Noto Sans JP Bold";

interface TextOptions {
  size: number;
  color: string;
  lang: string;
  /** The text is shrunk to fit when it would be taller than this at `size`. */
  maxHeight?: number;
}

function escapeMarkup(text: string): string {
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

/** `text` as an image with a clear background, wrapped to the card's width. */
async function drawText(text: string, { size, color, lang, maxHeight }: TextOptions) {
  // The text is Pango markup, where a title's own < and & would be read as markup.
  const markup = `<span foreground="${color}" lang="${lang}">${escapeMarkup(text)}</span>`;
  const options = {
    text: markup,
    font: `${FONT_FAMILY} ${size}`,
    fontfile: FONT_FILE,
    width: TEXT_WIDTH,
    rgba: true,
    wrap: "word-char",
  } as const;

  // At 72 dots an inch a point is a pixel, so `size` is the height of a character in pixels.
  const drawn = await sharp({ text: { ...options, dpi: 72 } })
    .png()
    .toBuffer({ resolveWithObject: true });
  if (maxHeight === undefined || drawn.info.height <= maxHeight) {
    return drawn;
  }
  // Given a height, the text is drawn as large as fits in the box.
  return sharp({ text: { ...options, height: maxHeight } })
    .png()
    .toBuffer({ resolveWithObject: true });
}

/** Draws the card as a PNG. */
export async function ogCard({ title, footer, lang, colors }: OgCard): Promise<Buffer> {
  // Without this the text library reads the system's font configuration, which the development
  // container does not have (it says so on every build) and CI does. With it, both know the one
  // font above and nothing else, so a character that font lacks, such as an emoji, is drawn the
  // same in both. It is read when the first text is drawn.
  // biome-ignore lint/complexity/useLiteralKeys: TypeScript wants brackets for a key the type does not name
  process.env["FONTCONFIG_FILE"] = join(FONTS_DIR, "fonts.conf");

  const footerImage = await drawText(footer, {
    size: FOOTER_SIZE,
    color: colors.inkMuted,
    lang,
  });
  const footerTop = FOOTER_BOTTOM - footerImage.info.height;
  const titleImage = await drawText(title, {
    size: TITLE_SIZE,
    color: colors.ink,
    lang,
    maxHeight: footerTop - GAP - TITLE_TOP,
  });

  return sharp({ create: { ...OG_CARD_SIZE, channels: 3, background: colors.surface } })
    .composite([
      {
        input: {
          create: {
            width: OG_CARD_SIZE.width,
            height: BAND_HEIGHT,
            channels: 3,
            background: colors.ink,
          },
        },
        left: 0,
        top: 0,
      },
      { input: titleImage.data, left: MARGIN, top: TITLE_TOP },
      { input: footerImage.data, left: MARGIN, top: footerTop },
    ])
    .png()
    .toBuffer();
}
