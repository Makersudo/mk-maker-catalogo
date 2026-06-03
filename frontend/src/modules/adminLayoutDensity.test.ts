import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

describe("admin dense layout", () => {
  it("keeps the dashboard health card compact instead of stretching with the metrics grid", () => {
    const source = readFileSync(new URL("./dashboard/components/CatalogMetricsModule.tsx", import.meta.url), "utf8");

    assert.equal(source.includes("xl:grid-cols-[1.15fr_0.85fr]"), true);
    assert.equal(source.includes("self-start"), true);
    assert.equal(source.includes("Com custo"), true);
  });

  it("keeps the admin shell as the single vertical scroll container", () => {
    const source = readFileSync(new URL("./layout/views/AdminLayout.tsx", import.meta.url), "utf8");

    assert.equal(source.includes("h-dvh overflow-hidden"), true);
    assert.equal(source.includes("min-w-0 flex-1 flex flex-col overflow-hidden"), true);
    assert.equal(source.includes("min-h-0 flex-1 overflow-x-hidden overflow-y-auto"), true);
  });

  it("lets the products table keep natural page height without an internal vertical scrollbar", () => {
    const source = readFileSync(new URL("./products/views/ProductsListView.tsx", import.meta.url), "utf8");

    assert.equal(source.includes("max-w-[1800px]"), true);
    assert.equal(source.includes("Operacao da lista"), true);
    assert.equal(source.includes("max-h-[calc(100vh-390px)]"), false);
    assert.equal(source.includes("overflow-auto custom-scrollbar"), false);
    assert.equal(source.includes("sticky top-0 z-10"), false);
    assert.equal(source.includes("overflow-x-auto custom-scrollbar"), true);
    assert.equal(source.includes("object-contain"), true);
    assert.equal(source.includes("whitespace-nowrap"), true);
    assert.equal(source.includes("md:pb-20"), false);
  });

  it("does not show the disconnected global product search on the products route", () => {
    const source = readFileSync(new URL("./layout/components/AdminHeader.tsx", import.meta.url), "utf8");

    assert.equal(source.includes("useLocation"), true);
    assert.equal(source.includes("isProductsRoute"), true);
    assert.equal(source.includes("!isProductsRoute &&"), true);
  });

  it("organizes the product modal into focused tabs and keeps product mockups uncropped", () => {
    const source = readFileSync(new URL("./products/components/ProductFormModal.tsx", import.meta.url), "utf8");

    assert.equal(source.includes("ProductFormTab"), true);
    assert.equal(source.includes("formTabs"), true);
    assert.equal(source.includes("Fotos"), true);
    assert.equal(source.includes("Vitrine"), true);
    assert.equal(source.includes("object-contain"), true);
  });
});
