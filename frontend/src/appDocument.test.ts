import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

describe("app document branding", () => {
  it("uses the MK Maker logo favicon and subtitle in the browser tab", () => {
    const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");

    assert.equal(html.includes('<link rel="icon" type="image/png" href="/assets/mk-maker-logo-symbol-transparent.png" />'), true);
    assert.equal(html.includes("<title>MK Maker | Makeup & Beauty</title>"), true);
  });
});
