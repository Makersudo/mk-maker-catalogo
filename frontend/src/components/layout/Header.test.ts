import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

describe("public header surface", () => {
  it("uses floating controls instead of a full white catalog bar", () => {
    const source = readFileSync(new URL("./Header.tsx", import.meta.url), "utf8");

    assert.equal(source.includes("fixed inset-x-0 top-0"), true);
    assert.equal(source.includes("pointer-events-none fixed"), true);
    assert.equal(source.includes("mk-header-surface"), false);
    assert.equal(source.includes("bg-white/94"), true);
  });
});
