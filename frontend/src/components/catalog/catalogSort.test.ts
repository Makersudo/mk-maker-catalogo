import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Product } from "../../types";
import { sortCatalogProducts } from "./catalogSort";

function product(input: Partial<Product> & Pick<Product, "id" | "name">): Product {
  return {
    description: "",
    price: 10,
    imageUrl: "",
    category: "Pele",
    relevanceScore: 0,
    ...input,
  };
}

describe("sortCatalogProducts", () => {
  it("keeps active campaign products in focus before ordinary relevance", () => {
    const sorted = sortCatalogProducts(
      [
        product({ id: "ordinary", name: "Produto comum", relevanceScore: 9999 }),
        product({
          id: "campaign-second",
          name: "Campanha 2",
          relevanceScore: 1,
          campaign: {
            id: "campaign",
            name: "Campanha",
            badgeLabel: "OFERTA",
            discountType: "none",
            discountValue: 0,
            originalPrice: 10,
            finalPrice: 10,
            priority: 1,
            sortOrder: 2,
            type: "promotion",
            isHighlight: true,
          },
        }),
        product({
          id: "campaign-first",
          name: "Campanha 1",
          relevanceScore: 1,
          campaign: {
            id: "campaign",
            name: "Campanha",
            badgeLabel: "OFERTA",
            discountType: "none",
            discountValue: 0,
            originalPrice: 10,
            finalPrice: 10,
            priority: 1,
            sortOrder: 0,
            type: "promotion",
            isHighlight: true,
          },
        }),
      ],
      "relevance",
    );

    assert.deepEqual(sorted.map((item) => item.id), ["campaign-first", "campaign-second", "ordinary"]);
  });
});
