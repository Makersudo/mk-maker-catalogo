import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Save, Trash2, Eye, EyeOff, Tag, Percent, DollarSign, Copy, CheckCheck, BarChart3 } from 'lucide-react';
import {
  Coupon, CouponPayload,
  listCoupons, createCoupon, updateCoupon, toggleCoupon, deleteCoupon
} from '../../../services/couponsService';

const fmtCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('pt-BR') : '—';

function emptyPayload(): CouponPayload {
  return {
    code: '', description: '',
    discount_type: 'percent', discount_value: 10,
    min_order_value: 0, max_uses: null,
    expires_at: null, is_active: true, campaign_id: null,
  };
}

function couponToPayload(c: Coupon): CouponPayload {
  return {
    code: c.code, description: c.description ?? '',
    discount_type: c.discount_type, discount_value: c.discount_value,
    min_order_value: c.min_order_value, max_uses: c.max_uses ?? null,
    expires_at: c.expires_at ? c.expires_at.slice(0, 10) : null,
    is_active: c.is_active, campaign_id: c.campaign_id ?? null,
  };
}

// ── CouponForm ────────────────────────────────────────────────────────────────
function CouponForm({ initial, onSave, onCancel }: {
  initial: Partial<CouponPayload>;
  onSave: (p: CouponPayload) => Promise<void>;
  onCancel: () => void;
}) {
  const [payload, setPayload] = useState<CouponPayload>({ ...emptyPayload(), ...initial });
  const [saving, setSaving] = useState(false);

  function set<K extends keyof CouponPayload>(key: K, value: CouponPayload[K]) {
    setPayload(p => ({ ...p, [key]: value }));
  }

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    set('code', code);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!payload.code.trim() || payload.discount_value <= 0) return;
    setSaving(true);
    try { await onSave(payload); } finally { setSaving(false); }
  }

  const discountPreview = payload.discount_type === 'percent'
    ? `${payload.discount_value}% de desconto`
    : `${fmtCurrency(payload.discount_value)} de desconto`;

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Código */}
      <div className="lg:col-span-2">
        <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Código do cupom *</label>
        <div className="mt-1.5 flex gap-2">
          <input
            required
            value={payload.code}
            onChange={e => set('code', e.target.value.toUpperCase().replace(/\s/g, ''))}
            placeholder="Ex: BELEZA20"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-white outline-none focus:border-[#c98f86]/60 uppercase"
          />
          <button
            type="button" onClick={generateCode}
            className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-neutral-400 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap"
          >
            Gerar código
          </button>
        </div>
      </div>

      {/* Descrição */}
      <div className="lg:col-span-2">
        <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Descrição (exibida ao cliente)</label>
        <input
          value={payload.description ?? ''} onChange={e => set('description', e.target.value)}
          placeholder="Ex: 10% de desconto para novos clientes"
          className="mt-1.5 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#c98f86]/60"
        />
      </div>

      {/* Tipo e Valor */}
      <div>
        <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Tipo de desconto</label>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => set('discount_type', 'percent')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-bold transition-all ${
              payload.discount_type === 'percent'
                ? 'border-[#c98f86] bg-[#c98f86]/10 text-white'
                : 'border-white/10 text-neutral-400 hover:border-white/30'
            }`}
          >
            <Percent className="h-4 w-4" /> Percentual
          </button>
          <button
            type="button"
            onClick={() => set('discount_type', 'fixed')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-bold transition-all ${
              payload.discount_type === 'fixed'
                ? 'border-[#c98f86] bg-[#c98f86]/10 text-white'
                : 'border-white/10 text-neutral-400 hover:border-white/30'
            }`}
          >
            <DollarSign className="h-4 w-4" /> Valor fixo
          </button>
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
          Valor do desconto ({payload.discount_type === 'percent' ? '%' : 'R$'})
        </label>
        <input
          required type="number" min={0.01} step={0.01}
          value={payload.discount_value}
          onChange={e => set('discount_value', Number(e.target.value))}
          className="mt-1.5 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#c98f86]/60"
        />
        <p className="mt-1 text-[10px] text-[#c98f86]">{discountPreview}</p>
      </div>

      {/* Pedido mínimo */}
      <div>
        <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Pedido mínimo (R$)</label>
        <input
          type="number" min={0} step={0.01}
          value={payload.min_order_value}
          onChange={e => set('min_order_value', Number(e.target.value))}
          className="mt-1.5 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#c98f86]/60"
        />
        <p className="mt-1 text-[10px] text-neutral-500">0 = sem valor mínimo</p>
      </div>

      {/* Limite de usos */}
      <div>
        <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Limite de usos</label>
        <input
          type="number" min={1} value={payload.max_uses ?? ''}
          onChange={e => set('max_uses', e.target.value ? Number(e.target.value) : null)}
          placeholder="Sem limite"
          className="mt-1.5 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#c98f86]/60"
        />
        <p className="mt-1 text-[10px] text-neutral-500">Deixe vazio para uso ilimitado</p>
      </div>

      {/* Expiração */}
      <div>
        <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Data de expiração</label>
        <input
          type="date"
          value={payload.expires_at ? payload.expires_at.slice(0, 10) : ''}
          onChange={e => set('expires_at', e.target.value || null)}
          className="mt-1.5 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#c98f86]/60"
          style={{ colorScheme: 'dark' }}
        />
        <p className="mt-1 text-[10px] text-neutral-500">Deixe vazio para sem expiração</p>
      </div>

      {/* Botões */}
      <div className="lg:col-span-2 flex items-center justify-between pt-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-400">Ativo</span>
          <button
            type="button"
            onClick={() => set('is_active', !payload.is_active)}
            className={`relative h-6 w-11 rounded-full transition-colors ${payload.is_active ? 'bg-[#c98f86]' : 'bg-white/10'}`}
          >
            <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${payload.is_active ? 'left-6' : 'left-1'}`} />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white">
            Cancelar
          </button>
          <button
            type="submit" disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#c98f86] text-white text-sm font-bold hover:bg-[#b87d74] transition-colors disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Salvando…' : 'Salvar cupom'}
          </button>
        </div>
      </div>
    </form>
  );
}

// ── View Principal ────────────────────────────────────────────────────────────
export function CouponsView() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Coupon | null | 'new'>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try { setCoupons(await listCoupons()); }
    catch { setError('Erro ao carregar cupons.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (payload: CouponPayload) => {
    if (editing === 'new') await createCoupon(payload);
    else if (editing) await updateCoupon(editing.id, payload);
    setEditing(null);
    await load();
  };

  const handleToggle = async (id: string) => {
    await toggleCoupon(id);
    setCoupons(prev => prev.map(c => c.id === id ? { ...c, is_active: !c.is_active } : c));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este cupom permanentemente?')) return;
    await deleteCoupon(id);
    setCoupons(prev => prev.filter(c => c.id !== id));
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  const totalSaved = coupons.reduce((acc, c) => acc + c.uses_count, 0);
  const activeCoupons = coupons.filter(c => c.is_active).length;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <Tag className="h-6 w-6 text-[#c98f86]" />
            Cupons de Desconto
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Crie e gerencie cupons que seus clientes aplicam no carrinho.
          </p>
        </div>
        {editing === null && (
          <button
            onClick={() => setEditing('new')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#c98f86] text-white text-sm font-bold hover:bg-[#b87d74] transition-colors"
          >
            <Plus className="h-4 w-4" /> Novo cupom
          </button>
        )}
      </div>

      {/* Stats */}
      {coupons.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total de cupons', value: coupons.length, icon: Tag },
            { label: 'Cupons ativos', value: activeCoupons, icon: Eye },
            { label: 'Total de usos', value: totalSaved, icon: BarChart3 },
          ].map(s => (
            <div key={s.label} className="rounded-xl bg-white/5 border border-white/10 p-4 flex items-center gap-3">
              <s.icon className="h-8 w-8 text-[#c98f86] opacity-70" />
              <div>
                <p className="text-2xl font-black text-white">{s.value}</p>
                <p className="text-xs text-neutral-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Formulário */}
      <AnimatePresence>
        {editing !== null && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="rounded-2xl bg-white/5 border border-white/10 p-6"
          >
            <h2 className="text-base font-bold text-white mb-6">
              {editing === 'new' ? 'Novo cupom' : `Editando: ${editing.code}`}
            </h2>
            <CouponForm
              initial={editing === 'new' ? {} : couponToPayload(editing)}
              onSave={handleSave}
              onCancel={() => setEditing(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista */}
      {loading ? (
        <div className="text-center py-16 text-neutral-500 text-sm">Carregando…</div>
      ) : error ? (
        <div className="text-center py-16 text-red-400 text-sm">{error}</div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-16 text-neutral-500">
          <Tag className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="font-medium">Nenhum cupom criado ainda.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/5 text-xs text-neutral-400 uppercase tracking-wider">
                <th className="px-4 py-3 text-left font-bold">Código</th>
                <th className="px-4 py-3 text-left font-bold">Desconto</th>
                <th className="px-4 py-3 text-left font-bold hidden md:table-cell">Mín. pedido</th>
                <th className="px-4 py-3 text-left font-bold hidden lg:table-cell">Usos</th>
                <th className="px-4 py-3 text-left font-bold hidden lg:table-cell">Expira</th>
                <th className="px-4 py-3 text-left font-bold">Status</th>
                <th className="px-4 py-3 text-right font-bold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c, i) => (
                <tr key={c.id} className={`border-t border-white/5 ${i % 2 === 0 ? 'bg-transparent' : 'bg-white/2'} hover:bg-white/5 transition-colors`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-white">{c.code}</span>
                      <button onClick={() => copyCode(c.code)} className="text-neutral-500 hover:text-[#c98f86] transition-colors">
                        {copied === c.code ? <CheckCheck className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    {c.description && <p className="text-[11px] text-neutral-500 mt-0.5">{c.description}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: '#c98f8620', color: '#c98f86' }}>
                      {c.discount_type === 'percent' ? <Percent className="h-3 w-3" /> : <DollarSign className="h-3 w-3" />}
                      {c.discount_type === 'percent' ? `${c.discount_value}%` : fmtCurrency(c.discount_value)}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-neutral-400 text-xs">
                    {c.min_order_value > 0 ? fmtCurrency(c.min_order_value) : '—'}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-neutral-400 text-xs">
                    {c.uses_count}{c.max_uses ? ` / ${c.max_uses}` : ''}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-neutral-400 text-xs">
                    {fmtDate(c.expires_at)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block h-2 w-2 rounded-full ${c.is_active ? 'bg-emerald-400' : 'bg-neutral-600'}`} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => handleToggle(c.id)} className={`p-1.5 rounded-lg transition-colors ${c.is_active ? 'text-emerald-400 hover:bg-emerald-400/10' : 'text-neutral-500 hover:bg-white/10'}`}>
                        {c.is_active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      </button>
                      <button onClick={() => setEditing(c)} className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors">
                        <Save className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-400/10 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
