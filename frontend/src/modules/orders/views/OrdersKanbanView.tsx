import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { CheckCircle2, Clock, Copy, MapPin, MessageCircle, PackageCheck, Phone, Search, Truck, X } from 'lucide-react';
import { AdminOrder, OrderStatus, listOrders, updateOrderStatus } from '../../../services/adminOrderService';

const columns: Array<{ status: OrderStatus; label: string; icon: typeof Clock; tone: string }> = [
  { status: 'new', label: 'Novo', icon: Clock, tone: 'border-blue-200 bg-blue-50 text-blue-700' },
  { status: 'confirmed', label: 'Confirmado', icon: CheckCircle2, tone: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
  { status: 'preparing', label: 'Em separacao', icon: PackageCheck, tone: 'border-amber-200 bg-amber-50 text-amber-700' },
  { status: 'ready_for_pickup', label: 'Pronto retirada', icon: PackageCheck, tone: 'border-purple-200 bg-purple-50 text-purple-700' },
  { status: 'sent', label: 'Saiu entrega', icon: Truck, tone: 'border-indigo-200 bg-indigo-50 text-indigo-700' },
  { status: 'completed', label: 'Finalizado', icon: CheckCircle2, tone: 'border-neutral-200 bg-neutral-50 text-neutral-700' },
  { status: 'cancelled', label: 'Cancelado', icon: X, tone: 'border-rose-200 bg-rose-50 text-rose-700' },
];

const statusOrder = columns.map((column) => column.status);

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));
}

function formatPhone(value?: string | null) {
  return String(value ?? '').replace(/\D/g, '');
}

function nextStatus(status: OrderStatus): OrderStatus | null {
  const index = statusOrder.indexOf(status);
  if (index < 0 || index >= statusOrder.length - 2) return null;
  return statusOrder[index + 1];
}

function whatsappLink(order: AdminOrder) {
  const phone = formatPhone(order.customer_phone);
  if (!phone) return '';
  const message = `Ola ${order.customer_name}, seu pedido ${order.order_code ?? ''} esta em atendimento.`;
  return `https://wa.me/55${phone.replace(/^55/, '')}?text=${encodeURIComponent(message)}`;
}

export function OrdersKanbanView() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const searchRef = useRef(search);

  useEffect(() => {
    searchRef.current = search;
  }, [search]);

  const fetchOrders = async (searchValue = searchRef.current) => {
    setIsLoading(true);
    setError('');
    try {
      setOrders(await listOrders({ search: searchValue }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nao foi possivel carregar os pedidos.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders('');
    const timer = window.setInterval(() => fetchOrders(searchRef.current), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const groupedOrders = useMemo(() => {
    return columns.reduce<Record<OrderStatus, AdminOrder[]>>((acc, column) => {
      acc[column.status] = orders.filter((order) => order.status === column.status);
      return acc;
    }, {} as Record<OrderStatus, AdminOrder[]>);
  }, [orders]);

  const moveOrder = async (order: AdminOrder, status: OrderStatus) => {
    const updated = await updateOrderStatus(order.id, status);
    setOrders((current) => current.map((item) => item.id === updated.id ? updated : item));
    setSelectedOrder((current) => current?.id === updated.id ? updated : current);
  };

  return (
    <div className="mx-auto flex max-w-[1800px] flex-col gap-6 pb-20">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-neutral-900 md:text-3xl">Pedidos</h1>
          <p className="mt-1 text-sm text-neutral-500">Kanban dos pedidos finalizados no catalogo, com ticket, cliente e produtos.</p>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            fetchOrders();
          }}
          className="flex w-full flex-col gap-2 sm:flex-row xl:w-[520px]"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por ticket, telefone ou nome..."
              className="admin-input pl-9"
            />
          </div>
          <button className="rounded-xl bg-[#8f5e59] px-5 py-2.5 text-sm font-black uppercase tracking-wide text-white">
            Buscar
          </button>
        </form>
      </header>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</div>}

      <section className="grid min-h-[70vh] gap-4 overflow-x-auto pb-2 xl:grid-cols-7">
        {columns.map((column) => {
          const ColumnIcon = column.icon;
          const columnOrders = groupedOrders[column.status] ?? [];

          return (
            <div key={column.status} className="min-w-[280px] rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
              <div className={`mb-3 flex items-center justify-between rounded-xl border px-3 py-2 ${column.tone}`}>
                <div className="flex items-center gap-2">
                  <ColumnIcon className="h-4 w-4" />
                  <h2 className="text-xs font-black uppercase tracking-widest">{column.label}</h2>
                </div>
                <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-black">{columnOrders.length}</span>
              </div>

              <div className="flex flex-col gap-3">
                {isLoading && column.status === 'new' && <p className="p-4 text-sm text-neutral-500">Carregando pedidos...</p>}
                {!isLoading && columnOrders.length === 0 && (
                  <div className="rounded-xl border border-dashed border-neutral-200 bg-white p-4 text-center text-xs text-neutral-400">
                    Sem pedidos
                  </div>
                )}
                {columnOrders.map((order) => (
                  <button
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className="rounded-2xl border border-neutral-200 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#c98f86] hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#9d6a63]">Ticket</p>
                        <h3 className="mt-1 text-sm font-black text-neutral-900">{order.order_code || 'Sem ticket'}</h3>
                      </div>
                      <span className="rounded-full bg-neutral-100 px-2 py-1 text-[10px] font-bold text-neutral-500">
                        {order.fulfillment_type === 'pickup' ? 'Retirada' : 'Entrega'}
                      </span>
                    </div>
                    <p className="mt-3 line-clamp-1 text-sm font-bold text-neutral-800">{order.customer_name}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-neutral-500">
                      <Phone className="h-3.5 w-3.5" />
                      {order.customer_phone || 'Telefone nao informado'}
                    </p>
                    <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3">
                      <span className="text-xs font-bold text-neutral-500">{order.order_items?.length ?? 0} itens</span>
                      <strong className="text-sm text-[#8f5e59]">{formatCurrency(Number(order.total_amount))}</strong>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onMove={moveOrder}
        />
      )}
    </div>
  );
}

function OrderDetailsModal({
  order,
  onClose,
  onMove,
}: {
  order: AdminOrder;
  onClose: () => void;
  onMove: (order: AdminOrder, status: OrderStatus) => Promise<void>;
}) {
  const [isUpdating, setIsUpdating] = useState(false);
  const next = nextStatus(order.status);
  const link = whatsappLink(order);

  const copyTicket = async () => {
    await navigator.clipboard.writeText(order.order_code || '');
  };

  const move = async (status: OrderStatus) => {
    setIsUpdating(true);
    try {
      await onMove(order, status);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-neutral-900/55 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-neutral-100 px-6 py-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#9d6a63]">Ticket do pedido</p>
            <h2 className="mt-1 text-2xl font-black text-neutral-900">{order.order_code || 'Sem ticket'}</h2>
            <p className="mt-1 text-sm text-neutral-500">Criado em {new Date(order.created_at).toLocaleString('pt-BR')}</p>
          </div>
          <button onClick={onClose} className="rounded-xl border border-neutral-200 p-2 text-neutral-500 hover:bg-neutral-50">
            <X className="h-5 w-5" />
          </button>
        </header>

        <main className="grid gap-6 overflow-y-auto p-6 lg:grid-cols-[1fr_1.1fr]">
          <section className="space-y-4">
            <InfoBlock title="Cliente">
              <p className="text-lg font-black text-neutral-900">{order.customer_name}</p>
              <p className="mt-1 text-sm text-neutral-600">{order.customer_phone || 'Telefone nao informado'}</p>
            </InfoBlock>

            <InfoBlock title={order.fulfillment_type === 'pickup' ? 'Retirada' : 'Entrega'}>
              {order.fulfillment_type === 'pickup' ? (
                <p className="text-sm text-neutral-600">Cliente retirara o pedido informando o ticket.</p>
              ) : (
                <div className="space-y-1 text-sm text-neutral-600">
                  <p className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 text-[#9d6a63]" /> {order.address}, {order.number}{order.complement ? ` - ${order.complement}` : ''}</p>
                  <p>{order.neighborhood} - {order.city || order.region}{order.state ? `/${order.state}` : ''}</p>
                  <p>CEP: {order.cep || 'Nao informado'}</p>
                  {order.reference_point && <p>Referencia: {order.reference_point}</p>}
                </div>
              )}
            </InfoBlock>

            <InfoBlock title="Pagamento">
              <p className="text-sm font-bold text-neutral-700">
                {order.payment_method === 'cash' ? 'Dinheiro' : order.payment_method === 'card' ? 'Cartao' : 'Pix'}
              </p>
            </InfoBlock>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button onClick={copyTicket} className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 px-4 py-3 text-sm font-black uppercase tracking-wide text-neutral-700 hover:bg-neutral-50">
                <Copy className="h-4 w-4" /> Copiar ticket
              </button>
              {link && (
                <a href={link} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black uppercase tracking-wide text-emerald-700">
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
              )}
            </div>
          </section>

          <section className="space-y-4">
            <InfoBlock title="Produtos do carrinho">
              <div className="divide-y divide-neutral-100">
                {(order.order_items ?? []).map((item) => (
                  <div key={item.id} className="flex justify-between gap-4 py-3">
                    <div>
                      <p className="text-sm font-black text-neutral-900">{item.quantity}x {item.product_name}</p>
                      {item.variant_label && <p className="text-xs text-neutral-500">{item.variant_label}</p>}
                      <p className="mt-1 text-xs text-neutral-500">Unitario {formatCurrency(Number(item.unit_price))}</p>
                    </div>
                    <strong className="text-sm text-[#8f5e59]">{formatCurrency(Number(item.subtotal))}</strong>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between rounded-xl bg-[#fbf4f3] px-4 py-3">
                <span className="text-xs font-black uppercase tracking-widest text-[#9d6a63]">Total</span>
                <strong className="text-xl text-[#7c4f4a]">{formatCurrency(Number(order.total_amount))}</strong>
              </div>
            </InfoBlock>

            <InfoBlock title="Historico">
              {(order.order_status_events ?? []).length === 0 ? (
                <p className="text-sm text-neutral-500">Sem historico de movimentacao.</p>
              ) : (
                <div className="space-y-2">
                  {(order.order_status_events ?? []).map((event) => (
                    <div key={event.id} className="rounded-xl bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
                      <strong>{event.next_status}</strong> - {new Date(event.created_at).toLocaleString('pt-BR')}
                    </div>
                  ))}
                </div>
              )}
            </InfoBlock>
          </section>
        </main>

        <footer className="flex flex-col gap-2 border-t border-neutral-100 px-6 py-4 sm:flex-row sm:justify-end">
          <button onClick={() => move('cancelled')} disabled={isUpdating || order.status === 'cancelled'} className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-black uppercase tracking-wide text-rose-700 disabled:opacity-50">
            Cancelar
          </button>
          {next && (
            <button onClick={() => move(next)} disabled={isUpdating} className="rounded-xl bg-gradient-to-r from-[#6f4844] to-[#c98f86] px-5 py-3 text-sm font-black uppercase tracking-wide text-white disabled:opacity-60">
              Avancar etapa
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}

function InfoBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-[10px] font-black uppercase tracking-widest text-neutral-400">{title}</h3>
      {children}
    </div>
  );
}
