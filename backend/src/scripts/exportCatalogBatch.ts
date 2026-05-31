import fs from 'fs/promises';
import path from 'path';
import { csvValue, getCategoryName, getOutputDir, getProductsByAudience, parseAudience } from './catalogCli.js';

async function main() {
  const audience = parseAudience('feminino');
  const outputDir = getOutputDir(path.join('catalog-workspace', audience));
  const products = getProductsByAudience(audience);

  await fs.mkdir(outputDir, { recursive: true });

  const productRows = products.map((product) => ({
    slug: product.slug,
    title: product.title,
    description: product.description,
    category: getCategoryName(product.categorySlug),
    subcategory: getCategoryName(product.subcategorySlug),
    audience: product.audience,
    productType: product.productType,
    variation: product.variation,
    brandLabel: product.brandLabel,
    features: product.features,
    imagePrompt: product.imagePrompt,
    catalogStatus: product.catalogStatus,
    isActive: product.isActive,
    price: product.price,
    stockQuantity: product.stockQuantity,
  }));

  const manifest = {
    audience,
    generatedAt: new Date().toISOString(),
    instructions: [
      'Preencha imagePath com um arquivo local ou imageUrl com uma URL publica para cada produto aprovado.',
      'Mantenha approved=false enquanto a imagem nao foi revisada.',
      'O script apply-images nunca ativa produtos; ele apenas vincula imagem e move catalog_status para ready.',
    ],
    images: products.map((product) => ({
      slug: product.slug,
      title: product.title,
      brandLabel: product.brandLabel,
      imagePath: '',
      imageUrl: '',
      approved: false,
      notes: '',
    })),
  };

  const csvHeader = ['slug', 'title', 'brandLabel', 'category', 'subcategory', 'audience', 'variation', 'price', 'catalogStatus', 'isActive', 'hasImage', 'approved', 'notes'];
  const csvRows = products.map((product) => [
    product.slug,
    product.title,
    product.brandLabel,
    getCategoryName(product.categorySlug),
    getCategoryName(product.subcategorySlug),
    product.audience,
    product.variation,
    product.price,
    product.catalogStatus,
    product.isActive,
    false,
    false,
    '',
  ].map(csvValue).join(','));

  const prompts = products.map((product, index) => [
    `## ${index + 1}. ${product.title}`,
    '',
    `Slug: \`${product.slug}\``,
    `Rotulo: ${product.brandLabel}`,
    `Categoria: ${getCategoryName(product.categorySlug)} / ${getCategoryName(product.subcategorySlug)}`,
    `Variacao: ${product.variation}`,
    '',
    'Prompt:',
    product.imagePrompt,
    '',
    'Arquivo recomendado:',
    `frontend/public/catalog/${audience}/${product.slug}.webp`,
    '',
  ].join('\n')).join('\n');

  await fs.writeFile(path.join(outputDir, 'products.json'), `${JSON.stringify(productRows, null, 2)}\n`);
  await fs.writeFile(path.join(outputDir, 'image-manifest.template.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  await fs.writeFile(path.join(outputDir, 'activation-checklist.csv'), `${csvHeader.join(',')}\n${csvRows.join('\n')}\n`);
  await fs.writeFile(path.join(outputDir, 'image-prompts.md'), `# Prompts de imagem - ${audience}\n\n${prompts}`);

  process.stdout.write(`Exportado: ${products.length} produtos em ${outputDir}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
