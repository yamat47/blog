import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { z } from "astro/zod";
import type { FetchedPage } from "./fetch-page.ts";
import { parsePageMetadata } from "./page-metadata.ts";

const storedCard = z.object({
  title: z.string(),
  description: z.string().optional(),
  image: z.url().optional(),
  site: z.string().optional(),
});
const storedCards = z.record(z.string(), storedCard);

/** What is kept about a linked page. */
export type StoredCard = z.infer<typeof storedCard>;

export interface CardStore {
  /** What is known about the page at `url`, or `undefined` when it is not stored and cannot be fetched. */
  lookup(url: string): Promise<StoredCard | undefined>;
}

interface CardStoreOptions {
  /** The JSON file the cards are kept in. It is created on the first fetch. */
  file: URL;
  fetchPage: (url: string) => Promise<FetchedPage>;
  warn: (message: string) => void;
}

/**
 * The cards of linked pages, kept in a file in the repository.
 *
 * A page is fetched once, the first time a post links to it, and the file is written with the
 * result for the author to commit. After that the site builds the same card with no network, even
 * when the page has changed or is gone. A page that cannot be fetched is not an error: its card is
 * left for the caller to show plainly, and it is tried again by the next run.
 *
 * The file is read on every lookup and again right before it is written. The author edits it by
 * hand, to add a page that refuses programs or to delete an entry and have it fetched again, and
 * the dev server lives across those edits: a copy kept in memory would answer with what the file
 * no longer says and write it back.
 */
export function createCardStore({ file, fetchPage, warn }: CardStoreOptions): CardStore {
  const pending = new Map<string, Promise<StoredCard | undefined>>();
  const failed = new Set<string>();

  const load = (): Map<string, StoredCard> => {
    let json: string;
    try {
      json = readFileSync(file, "utf8");
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") {
        return new Map();
      }
      throw error;
    }
    try {
      return new Map(Object.entries(storedCards.parse(JSON.parse(json))));
    } catch (error) {
      throw new Error(`${fileURLToPath(file)} is not a table of link cards`, { cause: error });
    }
  };

  // Sorted by URL, so the order of the file does not depend on which post was rendered first.
  const save = (all: ReadonlyMap<string, StoredCard>): void => {
    const sorted = Object.fromEntries([...all].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
    mkdirSync(new URL(".", file), { recursive: true });
    writeFileSync(file, `${JSON.stringify(sorted, null, 2)}\n`);
  };

  const fetchCard = async (url: string): Promise<StoredCard | undefined> => {
    let card: StoredCard;
    try {
      const page = await fetchPage(url);
      const metadata = parsePageMetadata(page.html, page.url);
      if (metadata.title === undefined) {
        throw new Error("the page has no title");
      }
      // Only what the page has: a key holding undefined would not survive the file, and the card
      // fetched now has to equal the one read back later.
      card = storedCard.parse(
        Object.fromEntries(Object.entries(metadata).filter(([, value]) => value !== undefined)),
      );
    } catch (error) {
      // Remembered, so a page that is down is asked once per run and not on every save of a post.
      failed.add(url);
      warn(
        `link card: ${url} is shown without details: ${error instanceof Error ? error.message : String(error)}`,
      );
      return undefined;
    }
    // Not in the try above: a file that cannot be written is the author's to know about, not a
    // page that could not be fetched.
    save(load().set(url, card));
    return card;
  };

  return {
    lookup(url) {
      const stored = load().get(url);
      if (stored !== undefined) {
        return Promise.resolve(stored);
      }
      if (failed.has(url)) {
        return Promise.resolve(undefined);
      }
      // Two posts that link to the same page share one request.
      let request = pending.get(url);
      if (request === undefined) {
        request = fetchCard(url).finally(() => pending.delete(url));
        pending.set(url, request);
      }
      return request;
    },
  };
}
