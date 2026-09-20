export function buildPriceChartingSearchUrl(title) {
  const trimmedTitle = title?.trim();
  if (!trimmedTitle) return null;

  return `https://www.pricecharting.com/search-products?q=${encodeURIComponent(trimmedTitle)}&type=prices`;
}

export const CONDITION_PRICE_HINTS = {
  CIB: "Complete / CIB price",
  "Disc Only": "Loose / Game only price",
  New: "New / Sealed price",
};
