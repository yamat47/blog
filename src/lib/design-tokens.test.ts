import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { tokenValue } from "./design-tokens.ts";

const CSS = `
:root {
  --color-ink: #1f2328;
  --color-ink-muted:   #59636e;
  --astro-code-token-comment: #000000;
  --font-sans: system-ui, "Noto Sans JP", sans-serif;
}
`;

describe("tokenValue", () => {
  it("reads the value of a token", () => {
    assert.equal(tokenValue(CSS, "--color-ink-muted"), "#59636e");
    assert.equal(tokenValue(CSS, "--font-sans"), 'system-ui, "Noto Sans JP", sans-serif');
  });

  it("reads the token of that exact name, not one whose name starts or ends with it", () => {
    assert.equal(tokenValue(CSS, "--color-ink"), "#1f2328");
    assert.throws(() => tokenValue(CSS, "--token-comment"), /no --token-comment/);
  });

  it("fails for a token the stylesheet does not have", () => {
    assert.throws(() => tokenValue(CSS, "--color-surface"), /no --color-surface/);
  });
});
