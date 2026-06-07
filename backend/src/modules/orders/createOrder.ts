import { applyInventoryAdjustments } from './inventory.js';
import { ApiError } from '../../lib/http.js';

type SupabaseLike = {
  from: (table: string) => any;
};

type InventoryApplier = (supabase: SupabaseLike, items: any[]) => Promise<void>;

interface AtomicCheckoutOptions {
  idempotencyKey?: string | null;
  requestHash?: string | null;
}

export async function createOrderWithItemsAndInventory(
  supabase: SupabaseLike,
  orderPayload: Record<string, unknown>,
  normalizedItems: any[],
  applyInventory: InventoryApplier = applyInventoryAdjustments,
  options: AtomicCheckoutOptions = {}
) {
  if ('rpc' in supabase && typeof (supabase as any).rpc === 'function') {
    const { data, error } = await (supabase as any).rpc('create_catalog_order', {
      p_order: orderPayload,
      p_items: normalizedItems,
      p_idempotency_key: options.idempotencyKey ?? null,
      p_request_hash: options.requestHash ?? null,
    });

    if (error) {
      const message = String(error.message ?? '');
      if (message.includes('Idempotency-Key')) throw new ApiError(409, message);
      if (message.includes('ainda esta em processamento')) throw new ApiError(409, message);
      if (message.includes('Estoque insuficiente')) throw new ApiError(400, message);
      throw error;
    }

    return {
      order: data?.order,
      createdItems: data?.items ?? [],
      replayed: Boolean(data?.replayed),
    };
  }

  const { data: order, error: orderError } = await supabase.from('orders').insert(orderPayload).select('*').single();
  if (orderError) throw orderError;

  try {
    const { data: createdItems, error: itemsError } = await supabase
      .from('order_items')
      .insert(normalizedItems.map((item) => ({ ...item, order_id: order.id })))
      .select('*');

    if (itemsError) throw itemsError;

    await applyInventory(supabase, normalizedItems);
    return { order, createdItems: createdItems ?? [], replayed: false };
  } catch (error) {
    await supabase.from('orders').delete().eq('id', order.id);
    throw error;
  }
}
