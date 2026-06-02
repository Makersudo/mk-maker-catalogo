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
  { match: ["avon"], image: `${SAMPLE_BASE}/sample-brand-avon.png` },
  { match: ["dior"], image: `${SAMPLE_BASE}/sample-brand-dior-beauty.png` },
  { match: ["fenty"], image: `${SAMPLE_BASE}/sample-brand-fenty-beauty.png` },
  { match: ["lancome", "lanc"], image: `${SAMPLE_BASE}/sample-brand-lancome.png` },
  { match: ["mac", "m a c"], image: `${SAMPLE_BASE}/sample-brand-mac-cosmetics.png` },
];

const sampleByType = [
  {
    match: ["pincel", "pinceis", "esponja", "escovinha", "aplicador"],
    image: `${SAMPLE_BASE}/sample-pincel-base.png`,
  },
  {
    match: ["esmalte", "unha", "manicure", "acetona", "lixa", "alicate", "top coat", "oleo secante"],
    image: `${SAMPLE_BASE}/sample-esmalte-nude.png`,
  },
  {
    match: ["paleta", "sombra", "pigmento"],
    image: `${SAMPLE_BASE}/sample-paleta-sombras.png`,
  },
  {
    match: ["primer", "bruma", "fixador", "protetor solar"],
    image: `${SAMPLE_BASE}/sample-primer-facial.png`,
  },
  {
    match: ["base", "corretivo", "bb cream", "po ", "po compacto", "blush", "bronzer", "contorno", "iluminador"],
    image: `${SAMPLE_BASE}/sample-base-liquida.png`,
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
