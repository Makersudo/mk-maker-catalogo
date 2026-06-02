import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { CalendarClock, Megaphone, Pause, Play, Plus, Save, Search, Trash2, X } from 'lucide-react';
import {
  CampaignPayload,
  CampaignProduct,
  CampaignStatus,
  CampaignType,
  DiscountType,
  MarketingCampaign,
  createCampaign,
  deleteCampaign,
  listCampaigns,
  replaceCampaignProducts,
  updateCampaign,
  updateCampaignStatus,
} from '../../../services/marketingService';
import { useProductStore, Product } from '../../products/store/useProductStore';

const campaignStatusLabels: Record<CampaignStatus, string> = {
  draft: 'Rascunho',
  scheduled: 'Agendada',
  active: 'Ativa',
  paused: 'Pausada',
  expired: 'Expirada',
};

const campaignTypeLabels: Record<CampaignType, string> = {
  promotion: 'Promocao',
  launch: 'Lancamento',
  featured: 'Destaque',
  flash: 'Oferta relampago',
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));
}

function toDatetimeLocal(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function toApiDatetime(value: string) {
  return value ? new Date(value).toISOString() : null;
}

function createEmptyPayload(): CampaignPayload {
  return {
    name: '',
    type: 'promotion',
    status: 'draft',
    isActive: false,
    startsAt: null,
    endsAt: null,
    discountType: 'percent',
    discountValue: 10,
    badgeLabel: 'OFERTA',
    bannerTitle: '',
    bannerSubtitle: '',
    bannerImageUrl: '',
    priority: 0,
  };
}

function campaignToPayload(campaign: MarketingCampaign): CampaignPayload {
  return {
    name: campaign.name,
    slug: campaign.slug,
    type: campaign.type,
    status: campaign.status,
    isActive: campaign.is_active,
    startsAt: campaign.starts_at ?? null,
    endsAt: campaign.ends_at ?? null,
    discountType: campaign.discount_type,
    discountValue: Number(campaign.discount_value ?? 0),
    badgeLabel: campaign.badge_label || 'OFERTA',
    bannerTitle: campaign.banner_title ?? '',
    bannerSubtitle: campaign.banner_subtitle ?? '',
    bannerImageUrl: campaign.banner_image_url ?? '',
    priority: Number(campaign.priority ?? 0),
  };
}

export function MarketingView() {
  const { products, fetchProducts } = useProductStore();
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingCampaign, setEditingCampaign] = useState<MarketingCampaign | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchCampaigns = async () => {
    setIsLoading(true);
    setError('');
    try {
      setCampaigns(await listCampaigns());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nao foi possivel carregar as campanhas.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
    fetchProducts();
  }, [fetchProducts]);

  const metrics = useMemo(() => ({
    active: campaigns.filter((campaign) => campaign.status === 'active').length,
    scheduled: campaigns.filter((campaign) => campaign.status === 'scheduled').length,
    draft: campaigns.filter((campaign) => campaign.status === 'draft').length,
    products: campaigns.reduce((total, campaign) => total + (campaign.marketing_campaign_products?.length ?? 0), 0),
  }), [campaigns]);

  const openCreate = () => {
    setEditingCampaign(null);
    setIsModalOpen(true);
  };

  const openEdit = (campaign: MarketingCampaign) => {
    setEditingCampaign(campaign);
    setIsModalOpen(true);
  };

  const changeStatus = async (campaign: MarketingCampaign, status: CampaignStatus) => {
    const updated = await updateCampaignStatus(campaign.id, status);
    setCampaigns((current) => current.map((item) => item.id === updated.id ? updated : item));
  };

  const removeCampaign = async (campaign: MarketingCampaign) => {
    if (!window.confirm(`Remover a campanha "${campaign.name}"?`)) return;
    await deleteCampaign(campaign.id);
    setCampaigns((current) => current.filter((item) => item.id !== campaign.id));
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 pb-20">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-neutral-900 md:text-3xl">Promocoes e Marketing</h1>
          <p className="mt-1 text-sm text-neutral-500">Crie campanhas com periodo, produtos, desconto e contador no catalogo.</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6f4844] to-[#c98f86] px-5 py-3 text-sm font-black uppercase tracking-wide text-white shadow-md shadow-[#c98f86]/20"
        >
          <Plus className="h-4 w-4" />
          Nova campanha
        </button>
      </header>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Ativas" value={metrics.active} />
        <MetricCard label="Agendadas" value={metrics.scheduled} />
        <MetricCard label="Rascunhos" value={metrics.draft} />
        <MetricCard label="Produtos em campanhas" value={metrics.products} />
      </div>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{error}</div>}

      <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-100 px-5 py-4">
          <h2 className="text-sm font-black uppercase tracking-widest text-neutral-600">Campanhas</h2>
        </div>
        {isLoading ? (
          <div className="p-8 text-sm text-neutral-500">Carregando campanhas...</div>
        ) : campaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
            <Megaphone className="h-10 w-10 text-[#c98f86]" />
            <h3 className="text-lg font-black text-neutral-900">Nenhuma campanha criada</h3>
            <p className="max-w-md text-sm text-neutral-500">Crie uma campanha para aplicar selo, preco promocional e contador regressivo no catalogo.</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {campaigns.map((campaign) => (
              <article key={campaign.id} className="grid gap-4 px-5 py-5 lg:grid-cols-[1.4fr_1fr_auto] lg:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#fbf4f3] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#8f5e59]">{campaign.badge_label}</span>
                    <span className="rounded-full bg-neutral-100 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-neutral-600">{campaignTypeLabels[campaign.type]}</span>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-700">{campaignStatusLabels[campaign.status]}</span>
                  </div>
                  <h3 className="mt-3 text-lg font-black text-neutral-900">{campaign.name}</h3>
                  <p className="mt-1 text-xs text-neutral-500">
                    {campaign.marketing_campaign_products?.length ?? 0} produtos - desconto {campaign.discount_type === 'percent' ? `${campaign.discount_value}%` : formatCurrency(Number(campaign.discount_value))}
                  </p>
                </div>
                <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-3 text-xs text-neutral-600">
                  <div className="flex items-center gap-2 font-bold text-neutral-800">
                    <CalendarClock className="h-4 w-4 text-[#9d6a63]" />
                    Periodo da campanha
                  </div>
                  <p className="mt-2">Inicio: {campaign.starts_at ? new Date(campaign.starts_at).toLocaleString('pt-BR') : 'Manual'}</p>
                  <p>Fim: {campaign.ends_at ? new Date(campaign.ends_at).toLocaleString('pt-BR') : 'Sem prazo'}</p>
                </div>
                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <button onClick={() => openEdit(campaign)} className="rounded-lg border border-neutral-200 px-3 py-2 text-xs font-bold text-neutral-700 hover:bg-neutral-50">Editar</button>
                  {campaign.status === 'active' ? (
                    <button onClick={() => changeStatus(campaign, 'paused')} className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700">
                      <Pause className="h-3.5 w-3.5" /> Pausar
                    </button>
                  ) : (
                    <button onClick={() => changeStatus(campaign, 'active')} className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
                      <Play className="h-3.5 w-3.5" /> Ativar
                    </button>
                  )}
                  <button onClick={() => removeCampaign(campaign)} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {isModalOpen && (
        <CampaignModal
          campaign={editingCampaign}
          products={products}
          onClose={() => setIsModalOpen(false)}
          onSaved={(campaign) => {
            setCampaigns((current) => {
              const exists = current.some((item) => item.id === campaign.id);
              return exists ? current.map((item) => item.id === campaign.id ? campaign : item) : [campaign, ...current];
            });
            setIsModalOpen(false);
          }}
        />
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400">{label}</p>
      <strong className="mt-2 block text-2xl font-black text-neutral-900">{value}</strong>
    </div>
  );
}

function CampaignModal({
  campaign,
  products,
  onClose,
  onSaved,
}: {
  campaign: MarketingCampaign | null;
  products: Product[];
  onClose: () => void;
  onSaved: (campaign: MarketingCampaign) => void;
}) {
  const [payload, setPayload] = useState<CampaignPayload>(() => campaign ? campaignToPayload(campaign) : createEmptyPayload());
  const [startsAt, setStartsAt] = useState(() => toDatetimeLocal(campaign?.starts_at));
  const [endsAt, setEndsAt] = useState(() => toDatetimeLocal(campaign?.ends_at));
  const [selectedProducts, setSelectedProducts] = useState<CampaignProduct[]>(() => campaign?.marketing_campaign_products ?? []);
  const [productSearch, setProductSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const selectedProductIds = new Set(selectedProducts.map((item) => item.product_id));
  const filteredProducts = products.filter((product) => {
    const term = productSearch.toLowerCase();
    return [product.title, product.categoryName ?? '', product.subcategoryName ?? '', product.brandLabel ?? '']
      .some((value) => value.toLowerCase().includes(term));
  }).slice(0, 80);

  const toggleProduct = (product: Product) => {
    setSelectedProducts((current) => (
      current.some((item) => item.product_id === product.id)
        ? current.filter((item) => item.product_id !== product.id)
        : [...current, { product_id: product.id, campaign_price: null, sort_order: current.length }]
    ));
  };

  const submit = async () => {
    if (!payload.name.trim()) {
      window.alert('Informe o nome da campanha.');
      return;
    }

    setIsSaving(true);
    try {
      const campaignPayload = {
        ...payload,
        isActive: payload.status === 'active' || payload.status === 'scheduled',
        startsAt: toApiDatetime(startsAt),
        endsAt: toApiDatetime(endsAt),
      };
      const saved = campaign
        ? await updateCampaign(campaign.id, campaignPayload)
        : await createCampaign(campaignPayload);
      const withProducts = await replaceCampaignProducts(saved.id, selectedProducts);
      onSaved(withProducts);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Nao foi possivel salvar a campanha.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-neutral-900/55 p-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight text-neutral-900">{campaign ? 'Editar campanha' : 'Nova campanha'}</h2>
            <p className="text-xs text-neutral-500">Configure periodo, desconto e produtos participantes.</p>
          </div>
          <button onClick={onClose} className="rounded-xl border border-neutral-200 p-2 text-neutral-500 hover:bg-neutral-50">
            <X className="h-5 w-5" />
          </button>
        </header>

        <main className="grid flex-1 overflow-y-auto p-6 lg:grid-cols-[1fr_1.15fr] gap-6">
          <section className="space-y-4">
            <Field label="Nome da campanha">
              <input value={payload.name} onChange={(event) => setPayload({ ...payload, name: event.target.value })} className="admin-input" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tipo">
                <select value={payload.type} onChange={(event) => setPayload({ ...payload, type: event.target.value as CampaignType })} className="admin-input">
                  {Object.entries(campaignTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </Field>
              <Field label="Status">
                <select value={payload.status} onChange={(event) => setPayload({ ...payload, status: event.target.value as CampaignStatus })} className="admin-input">
                  {Object.entries(campaignStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Inicio">
                <input type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} className="admin-input" />
              </Field>
              <Field label="Fim">
                <input type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} className="admin-input" />
              </Field>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Desconto">
                <select value={payload.discountType} onChange={(event) => setPayload({ ...payload, discountType: event.target.value as DiscountType })} className="admin-input">
                  <option value="none">Sem desconto</option>
                  <option value="percent">Percentual</option>
                  <option value="fixed">Valor fixo</option>
                  <option value="override_price">Preco final</option>
                </select>
              </Field>
              <Field label="Valor">
                <input type="number" min={0} step="0.01" value={payload.discountValue} onChange={(event) => setPayload({ ...payload, discountValue: Number(event.target.value) })} className="admin-input" />
              </Field>
              <Field label="Prioridade">
                <input type="number" value={payload.priority} onChange={(event) => setPayload({ ...payload, priority: Number(event.target.value) })} className="admin-input" />
              </Field>
            </div>
            <Field label="Selo no catalogo">
              <input value={payload.badgeLabel} onChange={(event) => setPayload({ ...payload, badgeLabel: event.target.value.toUpperCase() })} className="admin-input" />
            </Field>
          </section>

          <section className="min-h-[520px] rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest text-neutral-700">Produtos da campanha</h3>
                <p className="text-xs text-neutral-500">{selectedProducts.length} produtos selecionados</p>
              </div>
            </div>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input value={productSearch} onChange={(event) => setProductSearch(event.target.value)} placeholder="Buscar produto..." className="admin-input pl-9" />
            </div>
            <div className="mt-4 grid max-h-[420px] gap-2 overflow-y-auto pr-1">
              {filteredProducts.map((product) => {
                const selected = selectedProductIds.has(product.id);
                return (
                  <button
                    key={product.id}
                    onClick={() => toggleProduct(product)}
                    className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${selected ? 'border-[#c98f86] bg-[#fbf4f3]' : 'border-neutral-200 bg-white hover:border-[#ead5d2]'}`}
                  >
                    <div className="h-12 w-12 overflow-hidden rounded-lg bg-white">
                      {product.images[0] && <img src={product.images[0]} alt={product.title} className="h-full w-full object-contain" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-neutral-900">{product.title}</p>
                      <p className="text-xs text-neutral-500">{formatCurrency(product.price)}</p>
                    </div>
                    <span className={`h-5 w-5 rounded border ${selected ? 'border-[#8f5e59] bg-[#8f5e59]' : 'border-neutral-300 bg-white'}`} />
                  </button>
                );
              })}
            </div>
          </section>
        </main>

        <footer className="flex flex-col gap-3 border-t border-neutral-100 px-6 py-4 sm:flex-row sm:justify-end">
          <button onClick={onClose} className="rounded-xl border border-neutral-200 px-5 py-3 text-sm font-black uppercase tracking-wide text-neutral-600">Cancelar</button>
          <button onClick={submit} disabled={isSaving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6f4844] to-[#c98f86] px-5 py-3 text-sm font-black uppercase tracking-wide text-white disabled:opacity-60">
            <Save className="h-4 w-4" />
            {isSaving ? 'Salvando...' : 'Salvar campanha'}
          </button>
        </footer>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-neutral-400">{label}</span>
      {children}
    </label>
  );
}
