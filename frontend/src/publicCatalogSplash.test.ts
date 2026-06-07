import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getCriticalPublicMedia, selectInitialCatalogImageUrls } from "./publicCatalogSplash";

describe("public catalog splash image selection", () => {
  it("prioritizes campaign products and removes duplicate image URLs", () => {
    const urls = selectInitialCatalogImageUrls([
      { images: ["regular-a.png"], campaign: null },
      { images: ["campaign-a.png"], campaign: { id: "campaign-1" } },
      { images: ["campaign-a.png"], campaign: { id: "campaign-2" } },
      { images: ["regular-b.png"], campaign: null },
    ], 3);

    assert.deepEqual(urls, ["campaign-a.png", "regular-a.png", "regular-b.png"]);
  });

  it("ignores products without images and respects the preload limit", () => {
    const urls = selectInitialCatalogImageUrls([
      { images: [] },
      { images: ["a.png"] },
      { images: ["b.png"] },
      { images: ["c.png"] },
    ], 2);

    assert.deepEqual(urls, ["a.png", "b.png"]);
  });
});

describe("public catalog splash critical media", () => {
  it("waits for the hero video when the initial page displays it", () => {
    assert.deepEqual(getCriticalPublicMedia("/inicio"), ["/hero/makeup-products.mp4"]);
  });

  it("does not delay catalog-only routes with home media", () => {
    assert.deepEqual(getCriticalPublicMedia("/catalogo"), []);
    assert.deepEqual(getCriticalPublicMedia("/produto/batom"), []);
  });
});
