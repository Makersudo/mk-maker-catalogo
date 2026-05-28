import { Router } from 'express';
import { getSupabaseAdmin } from '../../lib/supabase.js';
import { ApiError, handleError, ok, optionalString, requireNumber, requireString } from '../../lib/http.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { invalidatePublicCatalogCache } from '../catalog/service.js';
import { generateOrderCode } from './orderCode.js';
import { createOrderWithItemsAndInventory } from './createOrder.js';

export const orderRouter = Router();

interface NormalizedOrderItem {
  product_id: string;
  product_variant_id?: string | null;
  product_name: string;
  variant_label?: string | null;
  variant_options?: Array<{ name: string; value: string }>;
  unit_price: number;
  quantity: number;
  subtotal: number;
}

function formatWhatsAppMessage(order: any, items: any[]) {
  let message = '*NOVO PEDIDO - MK MAKER*\\n\\n';
  message += `*TOKEN DO PEDIDO:* ${order.order_code}\\n`;
  message += `Tipo: ${order.fulfillment_type === 'pickup' ? 'Retirada na loja' : 'Entrega'}\\n`;
  message += `Pagamento: ${order.payment_method === 'cash' ? 'Dinheiro' : order.payment_method === 'card' ? 'Cartao' : 'Pix'}\\n\\n`;
  message += '*DADOS DO CLIENTE*\\n';
  message += `Nome: ${order.customer_name}\\n`;
  message += `WhatsApp: ${order.customer_phone || 'Nao informado'}\\n`;
  if (order.fulfillment_type === 'delivery') {
    if (order.reference_point === 'Entrega a combinar pelo WhatsApp') {
      message += 'Entrega: a combinar pelo WhatsApp\\n';
    } else {
      message += `Endereco: ${order.address}, ${order.number}${order.complement ? ` - ${order.complement}` : ''}\\n`;
      message += `Bairro: ${order.neighborhood}\\n`;
      message += `Cidade/UF: ${order.city || order.region}${order.state ? `/${order.state}` : ''}\\n`;
      message += `CEP: ${order.cep}\\n`;
    }
    if (order.reference_point) message += `Referencia: ${order.reference_point}\\n`;
  }
  message += '\\n';
  message += 'Ola, tenho interesse nos produtos abaixo que vi no catalogo:\\n\\n';

  items.forEach((item) => {
    const variant = item.variant_label ? ` (${item.variant_label})` : '';
    message += `- ${item.quantity}x ${item.product_name}${variant} - R$ ${Number(item.subtotal).toFixed(2)}\\n`;
  });

  message += `\\n*TOTAL DO PEDIDO: R$ ${Number(order.total_amount).toFixed(2)}*\\n\\n`;
  message += 'Aguardando a confirmacao e instrucoes de pagamento.';
  return message;
}

async function getPublicSetting(key: string): Promise<string> {
  const { data, error } = await getSupabaseAdmin().from('settings').select('value').eq('key', key).maybeSingle();
  if (error) throw error;
  return data?.value ?? '';
}

orderRouter.post('/', async (req, res) => {
  try {
    const customer = req.body.customer ?? req.body;
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    if (items.length === 0) throw new ApiError(400, 'Pedido sem itens.');

    const productIds = items.map((item: any) => requireString(item.productId ?? item.product?.id, 'productId'));
    const { data: products, error: productsError } = await getSupabaseAdmin()
      .from('products')
      .select('id,title,price,is_active,stock_quantity,product_variants(id,label,options,price,stock_quantity,is_active)')
      .in('id', productIds)
      .eq('is_active', true)
      .eq('catalog_status', 'live');

    if (productsError) throw productsError;
    if (!products || products.length !== productIds.length) {
      throw new ApiError(400, 'Um ou mais produtos nao estao disponiveis.');
    }

    const normalizedItems: NormalizedOrderItem[] = items.map((item: any) => {
      const productId = requireString(item.productId ?? item.product?.id, 'productId');
      const product = products.find((entry) => entry.id === productId);
      if (!product) throw new ApiError(400, 'Produto indisponivel.');
      const variantId = optionalString(item.variantId ?? item.variant?.id);
      const variants = Array.isArray((product as any).product_variants) ? (product as any).product_variants : [];
      const selectedVariant = variantId ? variants.find((variant: any) => variant.id === variantId && variant.is_active) : null;
      if (variantId && !selectedVariant) throw new ApiError(400, 'Variacao indisponivel.');
      const quantity = Math.max(1, Math.floor(requireNumber(item.quantity, 'quantity')));
      if (selectedVariant && Number(selectedVariant.stock_quantity ?? 0) < quantity) {
        throw new ApiError(400, `Estoque insuficiente para ${product.title} - ${selectedVariant.label}.`);
      }
      const unitPrice = selectedVariant?.price !== null && selectedVariant?.price !== undefined
        ? Number(selectedVariant.price)
        : Number(product.price);
      const subtotal = unitPrice * quantity;

      return {
        product_id: product.id,
        product_variant_id: selectedVariant?.id ?? null,
        product_name: product.title,
        variant_label: selectedVariant?.label ?? null,
        variant_options: Array.isArray(selectedVariant?.options) ? selectedVariant.options : [],
        unit_price: unitPrice,
        quantity,
        subtotal,
      };
    });

    const total = normalizedItems.reduce((sum: number, item: NormalizedOrderItem) => sum + item.subtotal, 0);
    const fulfillmentType = customer.fulfillmentType === 'pickup' || customer.fulfillment_type === 'pickup' ? 'pickup' : 'delivery';
    const deliveryToBeArranged = Boolean(customer.deliveryToBeArranged ?? customer.delivery_to_be_arranged);
    const paymentMethod = ['cash', 'pix', 'card'].includes(customer.paymentMethod ?? customer.payment_method)
      ? customer.paymentMethod ?? customer.payment_method
      : 'pix';
    const customerName = requireString(customer.fullName ?? customer.customer_name, 'fullName');
    const customerPhone = requireString(customer.phone ?? customer.customer_phone, 'phone');

    if (fulfillmentType === 'delivery' && !deliveryToBeArranged) {
      requireString(customer.cep, 'cep');
      requireString(customer.address, 'address');
      requireString(customer.number, 'number');
      requireString(customer.neighborhood, 'neighborhood');
      requireString(customer.city ?? customer.region, 'city');
    }

    const orderPayload = {
      order_code: generateOrderCode(),
      customer_name: customerName,
      customer_phone: customerPhone,
      fulfillment_type: fulfillmentType,
      payment_method: paymentMethod,
      cep: deliveryToBeArranged ? '00000000' : optionalString(customer.cep),
      address: deliveryToBeArranged ? 'A combinar pelo WhatsApp' : optionalString(customer.address),
      number: deliveryToBeArranged ? 'S/N' : optionalString(customer.number),
      complement: optionalString(customer.complement),
      neighborhood: deliveryToBeArranged ? 'A combinar' : optionalString(customer.neighborhood),
      region: deliveryToBeArranged ? 'A combinar' : optionalString(customer.region ?? customer.city),
      city: deliveryToBeArranged ? 'A combinar' : optionalString(customer.city),
      state: optionalString(customer.state),
      reference_point: deliveryToBeArranged ? 'Entrega a combinar pelo WhatsApp' : optionalString(customer.referencePoint ?? customer.reference_point),
      total_amount: total,
      status: 'new',
    };

    const supabase = getSupabaseAdmin();
    const { order, createdItems } = await createOrderWithItemsAndInventory(supabase, orderPayload, normalizedItems);
    invalidatePublicCatalogCache();

    const phone = await getPublicSetting('whatsapp_phone');
    const whatsappUrl = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(formatWhatsAppMessage(order, createdItems ?? []))}`
      : '';

    return ok(res, { order, items: createdItems ?? [], whatsappUrl }, 201);
  } catch (error) {
    return handleError(res, error);
  }
});

orderRouter.get('/', requireAuth, async (_req, res) => {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return ok(res, data ?? []);
  } catch (error) {
    return handleError(res, error);
  }
});

orderRouter.patch('/:id/status', requireAuth, async (req, res) => {
  try {
    const statusMap: Record<string, string> = {
      new: 'new',
      confirmed: 'confirmed',
      paid: 'paid',
      sent: 'sent',
      cancelled: 'cancelled',
      'Aguardando WhatsApp': 'new',
      Confirmado: 'confirmed',
      'Em separacao': 'confirmed',
      'Saiu para entrega': 'sent',
      Entregue: 'paid',
      Cancelado: 'cancelled',
    };
    const nextStatus = statusMap[String(req.body.status)];
    if (!nextStatus) throw new ApiError(400, 'Status de pedido invalido.');

    const { data, error } = await getSupabaseAdmin()
      .from('orders')
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select('*, order_items(*)')
      .single();

    if (error) throw error;
    return ok(res, data);
  } catch (error) {
    return handleError(res, error);
  }
});
