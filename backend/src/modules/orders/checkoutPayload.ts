import { ApiError } from '../../lib/http.js';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_CART_ITEMS = 40;
const MAX_ITEM_QUANTITY = 99;
const MAX_TOTAL_QUANTITY = 200;

const fieldLimits: Record<string, number> = {
  fullName: 120,
  phone: 24,
  cep: 12,
  address: 180,
  number: 30,
  complement: 120,
  neighborhood: 100,
  region: 100,
  city: 100,
  state: 2,
  referencePoint: 180,
};

function limitedString(value: unknown, field: string): string {
  const normalized = typeof value === 'string' ? value.trim() : '';
  const limit = fieldLimits[field] ?? 180;
  if (normalized.length > limit) throw new ApiError(400, `${field} excede o limite permitido.`);
  return normalized;
}

function identifier(value: unknown, field: string): string {
  const normalized = String(value ?? '').trim();
  if (!UUID_PATTERN.test(normalized)) throw new ApiError(400, `${field} invalido.`);
  return normalized;
}

export function parseCheckoutPayload(body: any) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ApiError(400, 'Payload de pedido invalido.');
  }

  const sourceCustomer = body.customer && typeof body.customer === 'object' ? body.customer : body;
  const sourceItems = Array.isArray(body.items) ? body.items : [];
  if (sourceItems.length === 0) throw new ApiError(400, 'Pedido sem itens.');
  if (sourceItems.length > MAX_CART_ITEMS) throw new ApiError(400, 'Carrinho excede o limite de itens.');

  let totalQuantity = 0;
  const items = sourceItems.map((item: any) => {
    const quantity = Number(item?.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_ITEM_QUANTITY) {
      throw new ApiError(400, 'Quantidade invalida.');
    }
    totalQuantity += quantity;
    return {
      productId: identifier(item?.productId ?? item?.product?.id, 'productId'),
      variantId: item?.variantId || item?.variant?.id
        ? identifier(item.variantId ?? item.variant.id, 'variantId')
        : null,
      quantity,
    };
  });

  if (totalQuantity > MAX_TOTAL_QUANTITY) throw new ApiError(400, 'Quantidade total excede o limite permitido.');

  const phone = limitedString(sourceCustomer.phone ?? sourceCustomer.customer_phone, 'phone').replace(/\D/g, '');
  if (phone.length < 10 || phone.length > 15) throw new ApiError(400, 'Telefone invalido.');

  const customer = {
    fullName: limitedString(sourceCustomer.fullName ?? sourceCustomer.customer_name, 'fullName'),
    phone,
    fulfillmentType: sourceCustomer.fulfillmentType ?? sourceCustomer.fulfillment_type,
    paymentMethod: sourceCustomer.paymentMethod ?? sourceCustomer.payment_method,
    deliveryToBeArranged: Boolean(sourceCustomer.deliveryToBeArranged ?? sourceCustomer.delivery_to_be_arranged),
    cep: limitedString(sourceCustomer.cep, 'cep'),
    address: limitedString(sourceCustomer.address, 'address'),
    number: limitedString(sourceCustomer.number, 'number'),
    complement: limitedString(sourceCustomer.complement, 'complement'),
    neighborhood: limitedString(sourceCustomer.neighborhood, 'neighborhood'),
    region: limitedString(sourceCustomer.region, 'region'),
    city: limitedString(sourceCustomer.city, 'city'),
    state: limitedString(sourceCustomer.state, 'state').toUpperCase(),
    referencePoint: limitedString(sourceCustomer.referencePoint ?? sourceCustomer.reference_point, 'referencePoint'),
  };

  return {
    customer,
    items,
    productIds: Array.from(new Set(items.map((item: { productId: string }) => item.productId))),
  };
}
