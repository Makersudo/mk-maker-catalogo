export const ORDER_STATUSES = [
  'new',
  'confirmed',
  'preparing',
  'ready_for_pickup',
  'sent',
  'completed',
  'cancelled',
] as const;

export type OrderStatus = typeof ORDER_STATUSES[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'Novo',
  confirmed: 'Confirmado',
  preparing: 'Em separacao',
  ready_for_pickup: 'Pronto para retirada',
  sent: 'Saiu para entrega',
  completed: 'Finalizado',
  cancelled: 'Cancelado',
};

const STATUS_ALIASES: Record<string, OrderStatus> = {
  new: 'new',
  novo: 'new',
  'aguardando whatsapp': 'new',
  confirmed: 'confirmed',
  confirmado: 'confirmed',
  paid: 'completed',
  entregue: 'completed',
  completed: 'completed',
  finalizado: 'completed',
  preparing: 'preparing',
  'em separacao': 'preparing',
  'em separação': 'preparing',
  ready_for_pickup: 'ready_for_pickup',
  'pronto para retirada': 'ready_for_pickup',
  sent: 'sent',
  'saiu para entrega': 'sent',
  cancelled: 'cancelled',
  cancelado: 'cancelled',
};

function normalizeText(value: unknown) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function onlyDigits(value: unknown) {
  return String(value ?? '').replace(/\D/g, '');
}

export function normalizeOrderStatus(value: unknown): OrderStatus | null {
  const normalized = normalizeText(value);
  return STATUS_ALIASES[normalized] ?? null;
}

export function isTerminalOrderStatus(status: OrderStatus) {
  return status === 'completed' || status === 'cancelled';
}

export function matchesOrderSearch(
  order: { order_code?: string | null; customer_name?: string | null; customer_phone?: string | null },
  search: string
) {
  const term = normalizeText(search);
  if (!term) return true;

  const digitTerm = onlyDigits(search);
  const code = normalizeText(order.order_code);
  const name = normalizeText(order.customer_name);
  const phone = onlyDigits(order.customer_phone);

  return (
    code.includes(term) ||
    name.includes(term) ||
    (digitTerm.length > 0 && phone.includes(digitTerm))
  );
}
