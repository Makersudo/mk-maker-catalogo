import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, Save, Trash2, Eye, EyeOff, ChevronUp, ChevronDown, Sparkles,
  Link2, X, Play, Pause, Megaphone, Image as ImageIcon
} from 'lucide-react';
import {
  BannerAnnouncement, BannerPayload, ANIMATION_OPTIONS, LINK_TYPE_OPTIONS,
  listAdminAnnouncements, createAnnouncement, updateAnnouncement,
  toggleAnnouncement, deleteAnnouncement
} from '../../../services/bannersService';
import { useMediaStore } from '../../media/store/useMediaStore';

const EMOJIS = ['✨', '🔥', '💄', '🎁', '🚚', '🛍️', '💅', '🌸', '⭐', '🎉', '💋', '👑', '🏷️', '💰', '🆕'];
const BG_PRESETS = [
  '#4a2825', '#c98f86', '#7c4f4a', '#1a1a2e', '#0f3460',
  '#16213e', '#533483', '#e94560', '#f5a623', '#27ae60',
];

function emptyPayload(): BannerPayload {
  return {
    title: '', subtitle: '', emoji: '✨', image_url: '',
    bg_color: '#4a2825', text_color: '#ffffff',
    link_type: 'none', link_value: '',
    animation_type: 'slide', duration_seconds: 4,
    sort_order: 0, is_active: true,
    is_full_banner: false,
  };
}

// ── Media Selection Modal ──────────────────────────────────────────────────
function MediaSelectModal({
  isOpen, onClose, onSelect
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}) {
  const { items, fetchMedia, isLoading } = useMediaStore();

  useEffect(() => {
    if (isOpen) {
      fetchMedia();
    }
  }, [isOpen, fetchMedia]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-neutral-900 border border-white/10 p-6 flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Selecionar Imagem da Galeria</h3>
            <p className="text-xs text-neutral-400">Escolha uma imagem de mídia enviada anteriormente.</p>
          </div>
          <button type="button" onClick={onClose} className="p-1 hover:bg-white/5 rounded-lg text-neutral-400 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-[260px] pr-2 custom-scrollbar">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <span className="text-xs text-neutral-400 animate-pulse">Carregando galeria...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-neutral-400">
              <ImageIcon className="w-10 h-10 mb-2 opacity-20" />
              <p className="text-xs font-bold">Nenhuma imagem armazenada.</p>
              <p className="text-[11px] mt-0.5 text-center opacity-60">Faça o upload de novas imagens na seção "Mídia e Imagens" do painel.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {items.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelect(item.url);
                    onClose();
                  }}
                  className="group relative aspect-square bg-neutral-950 rounded-xl overflow-hidden border border-white/5 hover:border-[#c98f86] transition-all text-left"
                >
                  <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-[#c98f86] text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">Selecionar</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Preview Card ─────────────────────────────────────────────────────────────
function PreviewCard({ payload }: { payload: BannerPayload }) {
  const animVariant = {
    slide: { initial: { x: 60, opacity: 0 }, animate: { x: 0, opacity: 1 } },
    fade:  { initial: { opacity: 0 },         animate: { opacity: 1 } },
    zoom:  { initial: { scale: 0.7, opacity: 0 }, animate: { scale: 1, opacity: 1 } },
    flip:  { initial: { rotateX: -90, opacity: 0 }, animate: { rotateX: 0, opacity: 1 } },
    bounce: { initial: { y: -20, opacity: 0 }, animate: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 400, damping: 12 } } },
    typewriter: { initial: { clipPath: 'inset(0 100% 0 0)' }, animate: { clipPath: 'inset(0 0% 0 0)' } },
  };

  const v = animVariant[payload.animation_type] ?? animVariant.slide;

  if (payload.is_full_banner) {
    return (
      <div className="rounded-xl overflow-hidden border border-white/10 shadow-xl">
        <div className="px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-white/40 bg-neutral-900 border-b border-white/5">
          Preview · Banner Principal (Full Image)
        </div>
        <div className="relative aspect-[21/9] w-full bg-neutral-950 flex items-center justify-center overflow-hidden">
          {payload.image_url ? (
            <img src={payload.image_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="text-center p-4">
              <ImageIcon className="h-6 w-6 mx-auto mb-1 text-neutral-600 animate-pulse" />
              <span className="text-[10px] text-neutral-500">Sem imagem de banner selecionada</span>
            </div>
          )}
          {payload.link_type !== 'none' && payload.link_value && (
            <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md text-[9px] font-black uppercase text-white tracking-widest px-2 py-1 rounded border border-white/10">
              Link ativo para {payload.link_type}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden border border-white/10 shadow-xl">
      <div className="px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-white/40 bg-neutral-900 border-b border-white/5">
        Preview · Anúncio Fino (Header Strip)
      </div>
      <div className="h-10 flex items-center px-4 gap-3 relative overflow-hidden" style={{ backgroundColor: payload.bg_color }}>
        <motion.div
          key={JSON.stringify(payload)}
          variants={v}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.4 }}
          className="flex items-center gap-3 w-full"
          style={{ color: payload.text_color }}
        >
          {payload.emoji && <span className="text-base">{payload.emoji}</span>}
          {payload.image_url && (
            <img src={payload.image_url} alt="" className="h-6 w-6 rounded object-cover shrink-0" />
          )}
          <span className="text-xs font-bold truncate">
            {payload.title || 'Título do anúncio'}
            {payload.subtitle && <span className="font-normal opacity-80 ml-2">{payload.subtitle}</span>}
          </span>
          {payload.link_type !== 'none' && payload.link_value && (
            <span className="ml-auto shrink-0 text-[9px] font-black uppercase tracking-widest rounded-full px-2 py-0.5 border" style={{ borderColor: payload.text_color }}>
              Ver mais →
            </span>
          )}
        </motion.div>
        <div className="absolute right-3 flex gap-1">
          <div className="w-3 h-1.5 rounded-full" style={{ backgroundColor: payload.text_color }} />
          <div className="w-1.5 h-1.5 rounded-full opacity-50" style={{ backgroundColor: payload.text_color }} />
          <div className="w-1.5 h-1.5 rounded-full opacity-50" style={{ backgroundColor: payload.text_color }} />
        </div>
      </div>
    </div>
  );
}

// ── Form ─────────────────────────────────────────────────────────────────────
function AnnouncementForm({
  initial, onSave, onCancel
}: {
  initial: Partial<BannerPayload>;
  onSave: (p: BannerPayload) => Promise<void>;
  onCancel: () => void;
}) {
  const [payload, setPayload] = useState<BannerPayload>({ ...emptyPayload(), ...initial });
  const [saving, setSaving] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  function set<K extends keyof BannerPayload>(key: K, value: BannerPayload[K]) {
    setPayload(p => ({ ...p, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!payload.title.trim()) return;
    setSaving(true);
    try { await onSave(payload); } finally { setSaving(false); }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Coluna esquerda: campos */}
        <div className="space-y-5">

          {/* Emoji picker (apenas se NÃO for full banner) */}
          {!payload.is_full_banner && (
            <div>
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Emoji do card</label>
              <div className="mt-2 flex flex-wrap gap-2">
                {EMOJIS.map(e => (
                  <button
                    key={e} type="button"
                    onClick={() => set('emoji', e)}
                    className={`text-lg h-9 w-9 rounded-lg flex items-center justify-center transition-all ${payload.emoji === e ? 'bg-[#c98f86]/30 ring-2 ring-[#c98f86]' : 'bg-white/5 hover:bg-white/10'}`}
                  >{e}</button>
                ))}
                <input
                  type="text" maxLength={2} value={payload.emoji ?? ''}
                  onChange={e => set('emoji', e.target.value)}
                  placeholder="…"
                  className="h-9 w-9 text-center bg-white/5 border border-white/10 rounded-lg text-sm text-white outline-none focus:border-[#c98f86]/60"
                />
              </div>
            </div>
          )}

          {/* Título e Subtítulo */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                {payload.is_full_banner ? 'Título do Banner (Identificação) *' : 'Título *'}
              </label>
              <input
                required value={payload.title} onChange={e => set('title', e.target.value)}
                placeholder="Ex: Campanha de Inverno"
                className="mt-1.5 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#c98f86]/60 focus:bg-white/10"
              />
            </div>
            {!payload.is_full_banner && (
              <div>
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Subtítulo</label>
                <input
                  value={payload.subtitle ?? ''} onChange={e => set('subtitle', e.target.value)}
                  placeholder="Ex: Confira as promoções exclusivas"
                  className="mt-1.5 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#c98f86]/60 focus:bg-white/10"
                />
              </div>
            )}
          </div>

          {/* Imagem miniatura / Banner completo */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                {payload.is_full_banner ? 'Arte do Banner (Imagem) *' : 'URL da imagem miniatura'}
              </label>
              <button
                type="button"
                onClick={() => setIsGalleryOpen(true)}
                className="text-[11px] font-bold text-[#c98f86] hover:text-[#b87d74] transition-colors"
              >
                Selecionar da Galeria
              </button>
            </div>
            <input
              required={payload.is_full_banner}
              value={payload.image_url ?? ''} onChange={e => set('image_url', e.target.value)}
              placeholder="https://..."
              className="mt-1.5 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#c98f86]/60"
            />
          </div>

          {/* Link */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Destino do clique (Redirecionamento)</label>
              <select
                value={payload.link_type} onChange={e => set('link_type', e.target.value as any)}
                className="mt-1.5 w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#c98f86]/60"
              >
                {LINK_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            {payload.link_type !== 'none' && (
              <div>
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  {payload.link_type === 'url' ? 'URL de Destino' :
                   payload.link_type === 'product' ? 'ID do Produto' :
                   payload.link_type === 'category' ? 'ID da Categoria' : 'ID da Campanha'}
                </label>
                <input
                  required
                  value={payload.link_value ?? ''} onChange={e => set('link_value', e.target.value)}
                  placeholder={payload.link_type === 'url' ? 'https://...' : 'cole o ID aqui'}
                  className="mt-1.5 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#c98f86]/60"
                />
              </div>
            )}
          </div>

          {/* Duração e Ordem */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Duração (seg)</label>
              <input
                type="number" min={2} max={30} value={payload.duration_seconds}
                onChange={e => set('duration_seconds', Number(e.target.value))}
                className="mt-1.5 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#c98f86]/60"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Ordem</label>
              <input
                type="number" min={0} value={payload.sort_order}
                onChange={e => set('sort_order', Number(e.target.value))}
                className="mt-1.5 w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-[#c98f86]/60"
              />
            </div>
          </div>
        </div>

        {/* Coluna direita: design + preview */}
        <div className="space-y-6">
          {/* Cores (apenas se NÃO for full banner) */}
          {!payload.is_full_banner && (
            <>
              <div>
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Cor de fundo</label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {BG_PRESETS.map(c => (
                    <button
                      key={c} type="button" onClick={() => set('bg_color', c)}
                      className={`h-8 w-8 rounded-lg border-2 transition-all ${payload.bg_color === c ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <input
                    type="color" value={payload.bg_color}
                    onChange={e => set('bg_color', e.target.value)}
                    className="h-8 w-8 rounded-lg border-0 cursor-pointer bg-transparent"
                    title="Cor personalizada"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Cor do texto</label>
                <div className="mt-2 flex items-center gap-3">
                  {['#ffffff', '#000000', '#c98f86', '#fbbf24', '#34d399'].map(c => (
                    <button
                      key={c} type="button" onClick={() => set('text_color', c)}
                      className={`h-8 w-8 rounded-lg border-2 transition-all ${payload.text_color === c ? 'border-[#c98f86] scale-110' : 'border-white/20 hover:scale-105'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <input
                    type="color" value={payload.text_color}
                    onChange={e => set('text_color', e.target.value)}
                    className="h-8 w-8 rounded-lg border-0 cursor-pointer bg-transparent"
                  />
                </div>
              </div>
            </>
          )}

          {/* Animação */}
          <div>
            <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Animação de transição</label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {ANIMATION_OPTIONS.map(opt => (
                <button
                  key={opt.value} type="button"
                  onClick={() => set('animation_type', opt.value)}
                  className={`text-left px-3 py-2 rounded-xl border transition-all ${
                    payload.animation_type === opt.value
                      ? 'border-[#c98f86] bg-[#c98f86]/10 text-white'
                      : 'border-white/10 text-neutral-400 hover:border-white/30 hover:text-white'
                  }`}
                >
                  <p className="text-xs font-bold">{opt.label}</p>
                  <p className="text-[10px] opacity-60 mt-0.5">{opt.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div>
            <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="h-3 w-3" /> Preview ao vivo
            </label>
            <div className="mt-2">
              <PreviewCard payload={payload} />
            </div>
          </div>
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
            <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors">
              Cancelar
            </button>
            <button
              type="submit" disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#c98f86] text-white text-sm font-bold hover:bg-[#b87d74] transition-colors disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Salvando…' : 'Salvar anúncio'}
            </button>
          </div>
        </div>
      </form>
      <MediaSelectModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        onSelect={(url) => set('image_url', url)}
      />
    </>
  );
}

// ── View Principal ────────────────────────────────────────────────────────────
export function BannersView() {
  const [items, setItems] = useState<BannerAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<BannerAnnouncement | null | 'new'>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const all = await listAdminAnnouncements();
      setItems(all.filter(i => !i.is_full_banner));
    }
    catch { setError('Erro ao carregar anúncios.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (payload: BannerPayload) => {
    if (editing === 'new') {
      await createAnnouncement(payload);
    } else if (editing) {
      await updateAnnouncement(editing.id, payload);
    }
    setEditing(null);
    await load();
  };

  const handleToggle = async (id: string) => {
    await toggleAnnouncement(id);
    setItems(prev => prev.map(i => i.id === id ? { ...i, is_active: !i.is_active } : i));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este anúncio?')) return;
    await deleteAnnouncement(id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <Megaphone className="h-6 w-6 text-[#c98f86]" />
            Anúncios Rotativos
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Gerencie os cards animados que aparecem na barra do cabeçalho do site.
          </p>
        </div>
        {editing === null && (
          <button
            onClick={() => setEditing('new')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#c98f86] text-white text-sm font-bold hover:bg-[#b87d74] transition-colors"
          >
            <Plus className="h-4 w-4" /> Novo anúncio
          </button>
        )}
      </div>

      {/* Formulário de criação/edição */}
      <AnimatePresence>
        {editing !== null && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="rounded-2xl bg-white/5 border border-white/10 p-6"
          >
            <h2 className="text-base font-bold text-white mb-6">
              {editing === 'new' ? 'Novo anúncio' : `Editando: ${editing.title}`}
            </h2>
            <AnnouncementForm
              initial={editing === 'new' ? {} : editing}
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
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-neutral-500">
          <Megaphone className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="font-medium">Nenhum anúncio criado ainda.</p>
          <p className="text-xs mt-1 opacity-60">Clique em "Novo anúncio" para começar.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <motion.div
              key={item.id}
              layout
              className="flex items-center gap-4 rounded-xl bg-white/5 border border-white/10 px-4 py-3 hover:bg-white/8 transition-colors"
            >
              {/* Color chip or image preview */}
              <div className="h-10 w-10 rounded-lg shrink-0 overflow-hidden bg-neutral-950 border border-white/10 flex items-center justify-center text-lg" style={{ backgroundColor: item.is_full_banner ? undefined : item.bg_color }}>
                {item.is_full_banner && item.image_url ? (
                  <img src={item.image_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span>{item.emoji || '📢'}</span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-white truncate">{item.title}</p>
                  {item.is_full_banner && (
                    <span className="bg-[#c98f86]/20 text-[#c98f86] border border-[#c98f86]/30 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded">
                      Banner
                    </span>
                  )}
                </div>
                {item.subtitle && <p className="text-xs text-neutral-400 truncate">{item.subtitle}</p>}
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] text-neutral-500 capitalize">{item.animation_type}</span>
                  <span className="text-[10px] text-neutral-500">{item.duration_seconds}s</span>
                  {item.link_type !== 'none' && item.link_value && (
                    <span className="text-[10px] text-[#c98f86] flex items-center gap-1">
                      <Link2 className="h-2.5 w-2.5" /> {item.link_type}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleToggle(item.id)}
                  title={item.is_active ? 'Pausar' : 'Ativar'}
                  className={`p-2 rounded-lg transition-colors ${item.is_active ? 'text-emerald-400 hover:bg-emerald-400/10' : 'text-neutral-500 hover:bg-white/10'}`}
                >
                  {item.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => setEditing(item)}
                  className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Save className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
