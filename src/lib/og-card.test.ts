import assert from "node:assert/strict";
import { describe, it } from "node:test";
import sharp from "sharp";
import { OG_CARD_SIZE, ogCard } from "./og-card.ts";

const COLORS = { surface: "#ffffff", ink: "#1f2328", inkMuted: "#59636e" };
const SURFACE = [255, 255, 255];

function card(title: string): Promise<Buffer> {
  return ogCard({ title, footer: "blog.example.com", lang: "ja", colors: COLORS });
}

interface Region {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** The pixels of a part of the card, three numbers (red, green, blue) for each. */
function pixels(png: Buffer, region: Region): Promise<Buffer> {
  return sharp(png).extract(region).removeAlpha().raw().toBuffer();
}

function isAllSurface(raw: Buffer): boolean {
  return raw.every((value, index) => value === SURFACE[index % 3]);
}

// Where the card keeps clear of text: its right and bottom edges, and where the footer is.
const RIGHT_EDGE = { left: 1120, top: 16, width: 80, height: 614 };
const BOTTOM_EDGE = { left: 0, top: 570, width: 1200, height: 60 };
const FOOTER = { left: 0, top: 500, width: 1200, height: 70 };
const TITLE = { left: 80, top: 80, width: 1040, height: 380 };

describe("ogCard", () => {
  it("draws a PNG of the size a shared link's image is shown at", async () => {
    const metadata = await sharp(await card("2025年を振り返ってみる")).metadata();

    assert.equal(metadata.format, "png");
    assert.equal(metadata.width, OG_CARD_SIZE.width);
    assert.equal(metadata.height, OG_CARD_SIZE.height);
  });

  it("draws the title and the footer, and keeps the edges clear", async () => {
    const png = await card("2025年を振り返ってみる");

    assert.equal(isAllSurface(await pixels(png, TITLE)), false);
    assert.equal(isAllSurface(await pixels(png, FOOTER)), false);
    assert.equal(isAllSurface(await pixels(png, RIGHT_EDGE)), true);
    assert.equal(isAllSurface(await pixels(png, BOTTOM_EDGE)), true);
  });

  it("shrinks a title too long for the card, so that it stays clear of the footer and the edges", async () => {
    const long = await card("開発のストーリー分割・タスク分割をするときに考えていること".repeat(6));
    const short = await card("短い題");

    assert.deepEqual(await pixels(long, FOOTER), await pixels(short, FOOTER));
    assert.equal(isAllSurface(await pixels(long, RIGHT_EDGE)), true);
    assert.equal(isAllSurface(await pixels(long, BOTTOM_EDGE)), true);
  });

  it("draws a title's < and & as the characters they are", async () => {
    // Read as markup, <b> would vanish and leave the same picture as the title without it.
    assert.notDeepEqual(
      await pixels(await card("A <b>B</b> & C"), TITLE),
      await pixels(await card("A B & C"), TITLE),
    );
  });
});
