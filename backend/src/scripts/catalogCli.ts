import path from 'path';
import { catalogCategorySeeds, masterCatalogProducts, type Audience } from '../catalog/masterCatalog.js';

export type CatalogAudience = Audience | 'all';

export function getArg(name: string, fallback = '') {
  const prefix = `--${name}=`;
  const match = process.argv.find((arg) => arg.startsWith(prefix));
  return match ? match.slice(prefix.length).trim() : fallback;
}

export function hasFlag(name: string) {
  return process.argv.includes(`--${name}`);
}

export function parseAudience(fallback: CatalogAudience = 'beleza'): CatalogAudience {
  const value = getArg('audience', fallback);
  if (value === 'all' || value === 'beleza') {
    return value;
  }
  throw new Error(`Linha de catalogo invalida: ${value}. Use beleza ou all.`);
}

export function getOutputDir(defaultDir: string) {
  return path.resolve(process.cwd(), getArg('out', defaultDir));
}

export function getProductsByAudience(audience: CatalogAudience) {
  if (audience === 'all') return masterCatalogProducts;
  return masterCatalogProducts.filter((product) => product.audience === audience);
}

export function getCategoryName(slug: string) {
  return catalogCategorySeeds.find((category) => category.slug === slug)?.name ?? slug;
}

export function csvValue(value: unknown) {
  const text = Array.isArray(value) ? value.join('; ') : String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}

export function assertUnique(values: string[], label: string) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }

  if (duplicates.size > 0) {
    throw new Error(`${label} duplicado(s): ${Array.from(duplicates).join(', ')}`);
  }
}
