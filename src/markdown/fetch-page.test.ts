import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import { after, before, describe, it } from "node:test";
import { fetchPage } from "./fetch-page.ts";

// 「日本語」 in Shift_JIS.
const SHIFT_JIS = Buffer.from([0x93, 0xfa, 0x96, 0x7b, 0x8c, 0xea]);
const TWO_MEGABYTES = 2 * 1024 * 1024;

// Against a server on this machine, so the request, the redirect and the stream are real.
describe("fetchPage", () => {
  let server: Server;
  let origin: string;

  before(async () => {
    server = createServer((request, response) => {
      switch (request.url) {
        case "/page":
          response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
          response.end("<title>ページ</title>");
          break;
        case "/moved":
          response.writeHead(302, { location: "/page" });
          response.end();
          break;
        case "/shift-jis":
          response.writeHead(200, { "content-type": "text/html; charset=Shift_JIS" });
          response.end(Buffer.concat([Buffer.from("<title>"), SHIFT_JIS, Buffer.from("</title>")]));
          break;
        case "/long":
          response.writeHead(200, { "content-type": "text/html" });
          response.end(`<title>長いページ</title>${"x".repeat(TWO_MEGABYTES)}`);
          break;
        case "/image":
          response.writeHead(200, { "content-type": "image/png" });
          response.end("PNG");
          break;
        case "/user-agent":
          response.writeHead(200, { "content-type": "text/html" });
          response.end(request.headers["user-agent"]);
          break;
        case "/untyped":
          response.writeHead(200);
          response.end("<title>種類なし</title>");
          break;
        default:
          response.writeHead(404, { "content-type": "text/html" });
          response.end("<title>Not Found</title>");
      }
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (address === null || typeof address === "string") {
      throw new Error("the test server is not listening on a port");
    }
    origin = `http://127.0.0.1:${address.port}`;
  });

  after(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  });

  it("returns the page's text and URL", async () => {
    assert.deepEqual(await fetchPage(`${origin}/page`), {
      html: "<title>ページ</title>",
      url: `${origin}/page`,
    });
  });

  it("says whose program it is", async () => {
    assert.equal(
      (await fetchPage(`${origin}/user-agent`)).html,
      "Mozilla/5.0 (compatible; link-card/1.0; +https://blog.yamat47.me/)",
    );
  });

  it("returns the URL the page was found at after a redirect", async () => {
    assert.equal((await fetchPage(`${origin}/moved`)).url, `${origin}/page`);
  });

  it("decodes a page in the encoding the server names", async () => {
    assert.equal((await fetchPage(`${origin}/shift-jis`)).html, "<title>日本語</title>");
  });

  it("returns only the start of a page longer than a megabyte", async () => {
    const { html } = await fetchPage(`${origin}/long`);
    assert.ok(html.startsWith("<title>長いページ</title>"));
    assert.ok(html.length <= 1024 * 1024, `${html.length} characters`);
  });

  it("rejects an answer that is not a success", async () => {
    await assert.rejects(fetchPage(`${origin}/missing`), /the server answered 404/);
  });

  it("rejects what is not an HTML page, or does not say what it is", async () => {
    await assert.rejects(fetchPage(`${origin}/image`), /not an HTML page \(image\/png\)/);
    await assert.rejects(fetchPage(`${origin}/untyped`), /not an HTML page \(no content type\)/);
  });
});
