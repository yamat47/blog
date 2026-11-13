import { decodePage } from "./page-metadata.ts";

/** A page as fetched: its text, and its URL after any redirect. */
export interface FetchedPage {
  html: string;
  url: string;
}

const TIMEOUT_MS = 10_000;
// The tags a card needs are in the head, so the download stops after the start of a long page.
const MAX_BYTES = 1024 * 1024;

/** The first `limit` bytes of the body, without waiting for or keeping the rest. */
async function readStart(response: Response, limit: number): Promise<Uint8Array> {
  const bytes = new Uint8Array(limit);
  let length = 0;
  if (response.body !== null) {
    const reader = response.body.getReader();
    while (length < limit) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      const chunk = value.subarray(0, limit - length);
      bytes.set(chunk, length);
      length += chunk.length;
    }
    await reader.cancel();
  }
  return bytes.subarray(0, length);
}

/**
 * Fetches the start of the HTML page at `url`. Rejects when the server does not answer with an
 * HTML page within ten seconds.
 */
export async function fetchPage(url: string): Promise<FetchedPage> {
  const response = await fetch(url, {
    headers: {
      // Some sites answer a client without a browser-like name with an error page.
      "user-agent": "Mozilla/5.0 (compatible; link-card/1.0)",
      accept: "text/html,application/xhtml+xml",
      "accept-language": "ja,en;q=0.8",
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const contentType = response.headers.get("content-type");
  // A bare URL can as well point at a video or an archive, which is not worth a byte.
  const problem = !response.ok
    ? `the server answered ${response.status}`
    : contentType === null || !/html/i.test(contentType)
      ? `it is not an HTML page (${contentType ?? "no content type"})`
      : undefined;
  if (problem !== undefined) {
    // The body is not wanted; cancelling it frees the connection.
    await response.body?.cancel();
    throw new Error(problem);
  }
  return { html: decodePage(await readStart(response, MAX_BYTES), contentType), url: response.url };
}
