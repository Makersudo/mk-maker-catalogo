import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

describe("AdminSidebar menu", () => {
  it("does not expose legacy highlights or media entries", () => {
    const source = readFileSync(new URL("./AdminSidebar.tsx", import.meta.url), "utf8");

    assert.equal(source.includes("/admin/media"), false);
    assert.equal(source.includes("/admin/highlights"), false);
    assert.equal(/M.dia e Imagens/.test(source), false);
    assert.equal(source.includes("Destaques"), false);
  });
});
