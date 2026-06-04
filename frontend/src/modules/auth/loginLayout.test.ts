import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

describe("admin login layout", () => {
  it("uses the MK Maker visual identity instead of the old generic purple login", () => {
    const source = readFileSync(new URL("./views/LoginView.tsx", import.meta.url), "utf8");

    assert.equal(source.includes("Painel de operacao"), true);
    assert.equal(source.includes("lg:grid-cols-[0.92fr_1.08fr]"), true);
    assert.equal(source.includes("LoginStepPill"), true);
    assert.equal(source.includes("AuthField"), true);
    assert.equal(source.includes("bg-purple-"), false);
    assert.equal(source.includes("text-purple-"), false);
    assert.equal(source.includes("shadow-purple"), false);
  });
});
