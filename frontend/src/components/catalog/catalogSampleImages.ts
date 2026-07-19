type CatalogSampleProduct = {
  title?: string | null;
  name?: string | null;
  description?: string | null;
  category?: string | null;
  categoryName?: string | null;
  subcategoryName?: string | null;
  brandLabel?: string | null;
};

const SAMPLE_BASE = "/catalog/samples";

const sampleByBrand = [
  { match: ["avon"], image: `${SAMPLE_BASE}/sample-brand-avon.webp` },
  { match: ["dior"], image: `${SAMPLE_BASE}/sample-brand-dior-beauty.webp` },
  { match: ["fenty"], image: `${SAMPLE_BASE}/sample-brand-fenty-beauty.webp` },
  { match: ["lancome", "lanc"], image: `${SAMPLE_BASE}/sample-brand-lancome.webp` },
  { match: ["mac", "m a c"], image: `${SAMPLE_BASE}/sample-brand-mac-cosmetics.webp` },
];

const sampleByType = [
  {
    match: ["pincel", "pinceis", "esponja", "escovinha", "aplicador"],
    image: `${SAMPLE_BASE}/sample-pincel-base.webp`,
  },
  {
    match: ["esmalte", "unha", "manicure", "acetona", "lixa", "alicate", "top coat", "oleo secante"],
    image: `${SAMPLE_BASE}/sample-esmalte-nude.webp`,
  },
  {
    match: ["paleta", "sombra", "pigmento"],
    image: `${SAMPLE_BASE}/sample-paleta-sombras.webp`,
  },
  {
    match: ["primer", "bruma", "fixador", "protetor solar"],
    image: `${SAMPLE_BASE}/sample-primer-facial.webp`,
  },
  {
    match: ["base", "corretivo", "bb cream", "po ", "po compacto", "blush", "bronzer", "contorno", "iluminador"],
    image: `${SAMPLE_BASE}/sample-base-liquida.webp`,
  },
];

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[ÂÃ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function containsAny(source: string, terms: string[]) {
  return terms.some((term) => source.includes(term));
}

export function getCatalogSampleImage(product: CatalogSampleProduct) {
  const searchable = normalizeText(
    [
      product.title,
      product.name,
      product.description,
      product.category,
      product.categoryName,
      product.subcategoryName,
    ]
      .filter(Boolean)
      .join(" ")
  );
  const brand = normalizeText(product.brandLabel ?? "");

  const typeMatch = sampleByType.find((sample) => containsAny(searchable, sample.match));
  if (typeMatch) return typeMatch.image;

  const brandMatch = sampleByBrand.find((sample) => containsAny(brand, sample.match));
  if (brandMatch) return brandMatch.image;

  return `${SAMPLE_BASE}/sample-brand-avon.png`;
}
