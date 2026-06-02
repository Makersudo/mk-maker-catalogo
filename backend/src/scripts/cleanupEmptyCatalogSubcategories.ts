import { createClient } from '@supabase/supabase-js';
import { env, assertSupabaseConfigured } from '../config/env.js';
import { getArg, hasFlag } from './catalogCli.js';

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
};

async function main() {
  const rootSlug = getArg('root', '');
  const apply = hasFlag('apply');
  assertSupabaseConfigured();

  const supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let rootQuery = supabase
    .from('categories')
    .select('id,name,slug')
    .is('parent_id', null)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (rootSlug) rootQuery = rootQuery.eq('slug', rootSlug);

  const { data: roots, error: rootError } = await rootQuery;
  if (rootError) throw rootError;
  if (!roots?.length) throw new Error(rootSlug ? `Categoria raiz ${rootSlug} nao encontrada.` : 'Nenhuma categoria raiz encontrada.');

  const empty: CategoryRow[] = [];
  const blocked: string[] = [];

  for (const root of roots as CategoryRow[]) {
    const { data: subcategories, error: categoriesError } = await supabase
      .from('categories')
      .select('id,name,slug')
      .eq('parent_id', root.id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (categoriesError) throw categoriesError;

    for (const category of (subcategories ?? []) as CategoryRow[]) {
      const [childrenResult, productResult] = await Promise.all([
        supabase.from('categories').select('id', { count: 'exact', head: true }).eq('parent_id', category.id),
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('subcategory_id', category.id),
      ]);

      const failed = [childrenResult, productResult].find((result) => result.error);
      if (failed?.error) throw failed.error;

      const childCount = childrenResult.count ?? 0;
      const productCount = productResult.count ?? 0;

      if (childCount === 0 && productCount === 0) {
        empty.push(category);
        continue;
      }

      blocked.push(`${root.slug}/${category.slug} [filhas=${childCount}, produtos=${productCount}]`);
    }
  }

  process.stdout.write(`Categorias raiz analisadas: ${(roots as CategoryRow[]).map((root) => root.slug).join(', ')}\n`);
  process.stdout.write(`Subcategorias vazias para remover: ${empty.map((category) => category.slug).join(', ') || 'nenhuma'}\n`);
  process.stdout.write(`Mantidas: ${blocked.join(', ') || 'nenhuma'}\n`);

  if (!apply) {
    process.stdout.write('Dry run: nada foi removido. Use --apply para excluir as vazias.\n');
    return;
  }

  if (empty.length === 0) {
    process.stdout.write('Nenhuma subcategoria vazia para remover.\n');
    return;
  }

  const ids = empty.map((category) => category.id);
  const { error: deleteError } = await supabase.from('categories').delete().in('id', ids);
  if (deleteError) throw deleteError;

  process.stdout.write(`Subcategorias removidas: ${empty.map((category) => category.slug).join(', ')}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
