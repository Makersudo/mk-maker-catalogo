import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

describe("ProductCard campaign label layout", () => {
  it("keeps campaign labels out of the mobile product image area", () => {
    const source = readFileSync(new URL("./ProductCard.tsx", import.meta.url), "utf8");

    assert.equal(/hidden[^"]*md:flex/.test(source), true);
    assert.equal(source.includes("md:hidden"), true);
  });
});
