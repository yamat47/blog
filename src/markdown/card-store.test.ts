import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";
import { pathToFileURL } from "node:url";
import { createCardStore } from "./card-store.ts";

const page = (title: string) => `<meta property="og:title" content="${title}">`;

describe("createCardStore", () => {
  let dir: string;
  let file: URL;
  let warnings: string[];
  let fetched: string[];

  // A store whose pages come from `pages` instead of the network. A URL missing from it is a
  // site that is down.
  const store = (pages: Record<string, string>) =>
    createCardStore({
      file,
      fetchPage: (url) => {
        fetched.push(url);
        const html = pages[url];
        return html === undefined
          ? Promise.reject(new Error("the server answered 503"))
          : Promise.resolve({ html, url });
      },
      warn: (message) => warnings.push(message),
    });

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "card-store-"));
    file = pathToFileURL(join(dir, "data", "link-cards.json"));
    warnings = [];
    fetched = [];
  });

  afterEach(() => {
    rmSync(dir, { recursive: true });
  });

  it("fetches a page it does not know and writes it to the file", async () => {
    const card = await store({ "https://b.example/": page("B") }).lookup("https://b.example/");
    assert.deepEqual(card, { title: "B" });
    assert.deepEqual(JSON.parse(readFileSync(file, "utf8")), {
      "https://b.example/": { title: "B" },
    });
  });

  it("answers from the file without fetching", async () => {
    await store({ "https://b.example/": page("B") }).lookup("https://b.example/");
    fetched = [];
    // The page has changed since; the stored card is what the site keeps showing.
    const card = await store({ "https://b.example/": page("B, later") }).lookup(
      "https://b.example/",
    );
    assert.deepEqual(card, { title: "B" });
    assert.deepEqual(fetched, []);
  });

  it("keeps the file sorted by URL, whatever order the pages were asked in", async () => {
    const cards = store({ "https://b.example/": page("B"), "https://a.example/": page("A") });
    await cards.lookup("https://b.example/");
    await cards.lookup("https://a.example/");
    assert.deepEqual(Object.keys(JSON.parse(readFileSync(file, "utf8"))), [
      "https://a.example/",
      "https://b.example/",
    ]);
  });

  it("fetches a page once when it is asked for twice at the same time", async () => {
    const cards = store({ "https://b.example/": page("B") });
    await Promise.all([cards.lookup("https://b.example/"), cards.lookup("https://b.example/")]);
    assert.deepEqual(fetched, ["https://b.example/"]);
  });

  it("has no card for a page that cannot be fetched, warns, and stores nothing", async () => {
    const cards = store({});
    assert.equal(await cards.lookup("https://down.example/"), undefined);
    assert.equal(await cards.lookup("https://down.example/"), undefined);
    assert.deepEqual(fetched, ["https://down.example/"]);
    assert.match(warnings.join("\n"), /https:\/\/down\.example\/ .*the server answered 503/);
    assert.throws(() => readFileSync(file, "utf8"), /ENOENT/);
  });

  it("has no card for a page without a title", async () => {
    const cards = store({ "https://b.example/": "<p>本文だけ</p>" });
    assert.equal(await cards.lookup("https://b.example/"), undefined);
    assert.match(warnings.join("\n"), /the page has no title/);
  });

  it("answers with an entry written to the file by hand after an earlier failure, and keeps it", async () => {
    const cards = store({ "https://b.example/": page("B") });
    assert.equal(await cards.lookup("https://refuses.example/"), undefined);
    mkdirSync(new URL(".", file), { recursive: true });
    writeFileSync(file, JSON.stringify({ "https://refuses.example/": { title: "手で書いた" } }));

    assert.deepEqual(await cards.lookup("https://refuses.example/"), { title: "手で書いた" });
    await cards.lookup("https://b.example/");
    assert.deepEqual(Object.keys(JSON.parse(readFileSync(file, "utf8"))), [
      "https://b.example/",
      "https://refuses.example/",
    ]);
  });

  it("fetches a page again once its entry is deleted from the file", async () => {
    const cards = store({ "https://b.example/": page("B") });
    await cards.lookup("https://b.example/");
    writeFileSync(file, "{}");
    assert.deepEqual(await cards.lookup("https://b.example/"), { title: "B" });
    assert.deepEqual(fetched, ["https://b.example/", "https://b.example/"]);
  });

  it("names the file when it is not a table of cards", async () => {
    await store({ "https://b.example/": page("B") }).lookup("https://b.example/");
    for (const content of [
      '{ "https://b.example/": { "description": "no title" } }',
      "<<<<<<< HEAD",
    ]) {
      writeFileSync(file, content);
      assert.throws(
        () => store({}).lookup("https://b.example/"),
        /link-cards\.json is not a table of link cards/,
      );
    }
  });
});
