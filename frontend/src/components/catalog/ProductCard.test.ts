import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

describe("ProductCard campaign label layout", () => {
  it("keeps campaign labels out of the mobile product image area", () => {
    const source = readFileSync(new URL("./ProductCard.tsx", import.meta.url), "utf8");

    assert.equal(/hidden[^"]*md:flex/.test(source), true);
    assert.equal(source.includes("md:hidden"), true);
  });

  it("keeps public buying flows usable on mobile web", () => {
    const card = readFileSync(new URL("./ProductCard.tsx", import.meta.url), "utf8");
    const detail = readFileSync(new URL("./ProductDetail.tsx", import.meta.url), "utf8");
    const cart = readFileSync(new URL("../cart/CartDrawer.tsx", import.meta.url), "utf8");

    assert.equal(card.includes("mobile-card-photo"), true);
    assert.equal(detail.includes("mobile-product-actions"), true);
    assert.equal(detail.includes("pb-[calc(1rem+env(safe-area-inset-bottom))]"), true);
    assert.equal(cart.includes("h-dvh"), true);
    assert.equal(cart.includes("max-sm:rounded-t-3xl"), true);
    assert.equal(cart.includes("pb-[calc(1.5rem+env(safe-area-inset-bottom))]"), true);
  });
});
