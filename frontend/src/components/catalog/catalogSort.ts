import type { Product } from "../../types";

export type CatalogSortOption = "relevance" | "price-asc" | "price-desc";

function campaignTimestamp(value?: string | null) {
  if (!value) return Number.MAX_SAFE_INTEGER;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : Number.MAX_SAFE_INTEGER;
}

function campaignSortOrder(product: Product) {
  const sortOrder = Number(product.campaign?.sortOrder ?? Number.MAX_SAFE_INTEGER);
  return Number.isFinite(sortOrder) ? sortOrder : Number.MAX_SAFE_INTEGER;
}

function compareByCampaignFocus(left: Product, right: Product) {
  const leftCampaign = Boolean(left.campaign?.isHighlight ?? left.campaign);
  const rightCampaign = Boolean(right.campaign?.isHighlight ?? right.campaign);
  const campaignDiff = Number(rightCampaign) - Number(leftCampaign);
  if (campaignDiff !== 0) return campaignDiff;

  if (!leftCampaign || !rightCampaign) return 0;

  const priorityDiff = Number(right.campaign?.priority ?? 0) - Number(left.campaign?.priority ?? 0);
  if (priorityDiff !== 0) return priorityDiff;

  const orderDiff = campaignSortOrder(left) - campaignSortOrder(right);
  if (orderDiff !== 0) return orderDiff;

  const endsAtDiff = campaignTimestamp(left.campaign?.endsAt) - campaignTimestamp(right.campaign?.endsAt);
  if (endsAtDiff !== 0) return endsAtDiff;

  return left.name.localeCompare(right.name, "pt-BR");
}

export function sortCatalogProducts(products: Product[], sortOption: CatalogSortOption) {
  const sortedProducts = [...products];

  const compareByRelevance = (left: Product, right: Product) => {
    const campaignDiff = compareByCampaignFocus(left, right);
    if (campaignDiff !== 0) return campaignDiff;

    const scoreDiff = (right.relevanceScore ?? 0) - (left.relevanceScore ?? 0);
    if (scoreDiff !== 0) return scoreDiff;

    const featuredDiff = Number(Boolean(right.isFeatured)) - Number(Boolean(left.isFeatured));
    if (featuredDiff !== 0) return featuredDiff;

    const newDiff = Number(Boolean(right.isNew)) - Number(Boolean(left.isNew));
    if (newDiff !== 0) return newDiff;

    const createdAtDiff =
      new Date(right.createdAt ?? 0).getTime() - new Date(left.createdAt ?? 0).getTime();
    if (createdAtDiff !== 0) return createdAtDiff;

    return left.name.localeCompare(right.name, "pt-BR");
  };

  if (sortOption === "price-asc") {
    return sortedProducts.sort((left, right) => {
      const campaignDiff = compareByCampaignFocus(left, right);
      if (campaignDiff !== 0) return campaignDiff;

      const priceDiff = left.price - right.price;
      return priceDiff !== 0 ? priceDiff : compareByRelevance(left, right);
    });
  }

  if (sortOption === "price-desc") {
    return sortedProducts.sort((left, right) => {
      const campaignDiff = compareByCampaignFocus(left, right);
      if (campaignDiff !== 0) return campaignDiff;

      const priceDiff = right.price - left.price;
      return priceDiff !== 0 ? priceDiff : compareByRelevance(left, right);
    });
  }

  return sortedProducts.sort(compareByRelevance);
}
