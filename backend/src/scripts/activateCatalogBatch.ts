import { createClient } from '@supabase/supabase-js';
import { env, assertSupabaseConfigured } from '../config/env.js';
import { hasFlag, parseAudience } from './catalogCli.js';

async function main() {
  const audience = parseAudience('beleza');
  if (audience === 'all') throw new Error('Ativacao em lote exige linha de catalogo especifica.');

  const apply = hasFlag('apply');
  assertSupabaseConfigured();

  const supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: products, error } = await supabase
    .from('products')
    .select('id,slug,title,price,catalog_status,is_active,product_images(id,url)')
    .eq('audience', audience)
    .eq('catalog_status', 'ready');

  if (error) throw error;

  const candidates = (products ?? []).filter((product: any) => {
    const hasImage = Array.isArray(product.product_images) && product.product_images.length > 0;
    return Number(product.price) > 0 && hasImage;
  });

  const blocked = (products ?? []).filter((product: any) => !candidates.some((candidate: any) => candidate.id === product.id));

  process.stdout.write([
    `Linha: ${audience}`,
    `Produtos ready encontrados: ${products?.length ?? 0}`,
    `Candidatos seguros para ativar: ${candidates.length}`,
    `Bloqueados por preco/imagem/status: ${blocked.length}`,
  ].join('\n'));
  process.stdout.write('\n');

  if (!apply) {
    process.stdout.write('Dry run: nenhum produto foi ativado. Use --apply para gravar.\n');
    return;
  }

  if (candidates.length === 0) {
    process.stdout.write('Nenhum produto seguro para ativacao.\n');
    return;
  }

  const ids = candidates.map((product: any) => product.id);
  const { error: updateError } = await supabase
    .from('products')
    .update({ is_active: true, catalog_status: 'live', updated_at: new Date().toISOString() })
    .in('id', ids);

  if (updateError) throw updateError;
  process.stdout.write(`Ativados: ${candidates.length} produtos.\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
