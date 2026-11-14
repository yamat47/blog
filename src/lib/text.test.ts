import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { decodeEntities, oneLine } from "./text.ts";

describe("decodeEntities", () => {
  it("writes a named and a numbered reference as the character", () => {
    assert.equal(
      decodeEntities("A &lt;b&gt; &amp; &quot;B&quot; &#39;C&#x27; &#12354;&nbsp;D &mdash; E"),
      "A <b> & \"B\" 'C' あ D — E",
    );
  });

  it("leaves a name it does not know and a number that is no character as written", () => {
    assert.equal(
      decodeEntities("&unknown; &#1114112; &#x110000;"),
      "&unknown; &#1114112; &#x110000;",
    );
  });
});

describe("oneLine", () => {
  it("puts a text of several lines on one", () => {
    assert.equal(oneLine("  一行目\n\n二行目\t三行目 ", 120), "一行目 二行目 三行目");
  });

  it("cuts a long text to the length asked for, the ellipsis included", () => {
    assert.equal(oneLine("あいうえおかきくけこ", 6), "あいうえお…");
    assert.equal(oneLine("あいうえお", 5), "あいうえお");
  });

  it("does not leave a space in front of the ellipsis or cut an emoji in half", () => {
    assert.equal(oneLine("ab cd", 4), "ab…");
    assert.equal(oneLine("🍤🍤🍤🍤", 3), "🍤🍤…");
  });
});
