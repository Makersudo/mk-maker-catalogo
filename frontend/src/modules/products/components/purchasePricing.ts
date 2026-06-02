export function calculateSuggestedSalePrice(purchaseCost: number, markupPercent: number) {
  if (!Number.isFinite(purchaseCost) || !Number.isFinite(markupPercent)) return 0;
  if (purchaseCost < 0 || markupPercent < 0) return 0;

  return Math.round(purchaseCost * (1 + markupPercent / 100) * 100) / 100;
}
