import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { postId } from "./post-id.ts";

describe("postId", () => {
  it("is the folder name when the post has no slug", () => {
    assert.equal(
      postId("looking-back-2026", { title: "2026年を振り返ってみる" }),
      "looking-back-2026",
    );
  });

  it("is the slug when the post has one, whatever the folder is called", () => {
    assert.equal(
      postId("2022-11-11-leaving-crassone", { slug: "2022/11/11/204028" }),
      "2022/11/11/204028",
    );
  });

  it("rejects a folder name with characters a URL would not show as written", () => {
    for (const folder of ["Looking-Back", "looking back", "looking_back", "振り返り", "-draft"]) {
      assert.throws(() => postId(folder, {}), /folder name is its URL/, folder);
    }
  });

  it("rejects a slug that YAML did not read as a path", () => {
    // Unquoted, YAML reads 20260101 as a number.
    for (const slug of [20260101, "", "/2026/01/01/130022", "2026/01/01/130022/", "Entry/One"]) {
      assert.throws(() => postId("a-post", { slug }), /slug must be a quoted path/, String(slug));
    }
  });
});
