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

  it("uses the final MK Maker PNG logo as the admin brand anchor", () => {
    const sidebarSource = readFileSync(new URL("./AdminSidebar.tsx", import.meta.url), "utf8");
    const headerSource = readFileSync(new URL("./AdminHeader.tsx", import.meta.url), "utf8");

    assert.equal(sidebarSource.includes("/assets/mk-maker-logo-ultra-realista.png"), true);
    assert.equal(sidebarSource.includes("Central MK Maker"), true);
    assert.equal(sidebarSource.includes("Vitrine pronta"), true);
    assert.equal(headerSource.includes("MK Maker Admin"), true);
    assert.equal(headerSource.includes("Painel operacional"), true);
  });
});
