import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

describe("admin login layout", () => {
  it("uses the MK Maker visual identity instead of the old generic purple login", () => {
    const source = readFileSync(new URL("./views/LoginView.tsx", import.meta.url), "utf8");

    assert.equal(source.includes("/assets/mk-maker-logo-symbol-transparent.png"), true);
    assert.equal(source.includes("Central administrativa MK Maker"), true);
    assert.equal(source.includes("lg:grid-cols-[minmax(0,1fr)_480px]"), true);
    assert.equal(source.includes("LoginStepPill"), true);
    assert.equal(source.includes("AuthField"), true);
    assert.equal(source.includes("rounded-[1.75rem] border border-neutral-200 bg-white px-6 py-5"), false);
    assert.equal(source.includes("Painel de operacao"), false);
    assert.equal(source.includes("Controle seu catalogo com clareza"), false);
    assert.equal(source.includes("visualStyle"), false);
    assert.equal(source.includes("bg-purple-"), false);
    assert.equal(source.includes("text-purple-"), false);
    assert.equal(source.includes("shadow-purple"), false);
  });
});
