import fs from 'fs/promises';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { env, assertSupabaseConfigured } from '../config/env.js';
import { uploadProductImageDataUrl } from '../modules/storage/upload.js';
import { getArg, hasFlag } from './catalogCli.js';

interface ImageManifestItem {
  slug: string;
  title?: string;
  imagePath?: string;
  imageUrl?: string;
  approved?: boolean;
  notes?: string;
}

interface ImageManifest {
  audience?: string;
  images: ImageManifestItem[];
}

function getWorkspaceRoot() {
  return path.basename(process.cwd()) === 'backend' ? path.resolve(process.cwd(), '..') : process.cwd();
}

function getMimeType(filePath: string) {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === '.png') return 'image/png';
  if (extension === '.webp') return 'image/webp';
  return 'image/jpeg';
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function describeError(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message?: unknown }).message);
  }
  return String(error);
}

async function withRetry<T>(label: string, operation: () => Promise<T>, maxAttempts = 4): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts) break;

      const delayMs = 1000 * attempt * attempt;
      process.stdout.write(
        `Falha temporaria em ${label}; tentativa ${attempt}/${maxAttempts}. Retentando em ${delayMs}ms: ${describeError(error)}\n`
      );
      await sleep(delayMs);
    }
  }

  throw lastError;
}

async function fileToDataUrl(filePath: string) {
  const absolutePath = path.resolve(getWorkspaceRoot(), filePath);
  const buffer = await fs.readFile(absolutePath);
  return `data:${getMimeType(absolutePath)};base64,${buffer.toString('base64')}`;
}

async function main() {
  const workspaceRoot = getWorkspaceRoot();
  const manifestPath = getArg('manifest', path.join('backend', 'catalog-workspace', 'feminino', 'image-manifest.json'));
  const apply = hasFlag('apply');
  const raw = await fs.readFile(path.resolve(workspaceRoot, manifestPath), 'utf8');
  const manifest = JSON.parse(raw.replace(/^\uFEFF/, '')) as ImageManifest;
  const approved = manifest.images.filter((item) => item.approved && (item.imagePath || item.imageUrl));

  if (approved.length === 0) {
    throw new Error('Nenhuma imagem aprovada no manifest.');
  }

  if (!apply) {
    process.stdout.write(`Dry run: ${approved.length} imagens seriam vinculadas. Use --apply para gravar no Supabase.\n`);
    return;
  }

  assertSupabaseConfigured();
  const supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  for (const item of approved) {
    await withRetry(item.slug, async () => {
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id,title')
        .eq('slug', item.slug)
        .single();

      if (productError || !product) {
        throw new Error(`Produto nao encontrado para slug ${item.slug}: ${productError?.message ?? 'sem retorno'}`);
      }

      const source = item.imageUrl || await fileToDataUrl(item.imagePath!);
      const uploaded = await uploadProductImageDataUrl(source, item.slug);

      const { error: deleteError } = await supabase.from('product_images').delete().eq('product_id', product.id);
      if (deleteError) throw deleteError;

      const { error: imageError } = await supabase.from('product_images').insert({
        product_id: product.id,
        url: uploaded.url,
        path: uploaded.path,
        name: product.title,
        sort_order: 0,
      });
      if (imageError) throw imageError;

      const { error: updateError } = await supabase
        .from('products')
        .update({ catalog_status: 'ready', updated_at: new Date().toISOString() })
        .eq('id', product.id);
      if (updateError) throw updateError;
    });

    process.stdout.write(`Imagem vinculada e produto marcado como ready: ${item.slug}\n`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
