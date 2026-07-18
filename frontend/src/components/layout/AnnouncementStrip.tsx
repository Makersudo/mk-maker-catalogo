import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { listPublicAnnouncements, BannerAnnouncement } from '../../services/bannersService';

// ── Variantes de animação ────────────────────────────────────────────────────

const variants = {
  slide: {
    initial:  { x: 80, opacity: 0 },
    animate:  { x: 0,  opacity: 1 },
    exit:     { x: -80, opacity: 0 },
  },
  fade: {
    initial:  { opacity: 0 },
    animate:  { opacity: 1 },
    exit:     { opacity: 0 },
  },
  zoom: {
    initial:  { scale: 0.7, opacity: 0 },
    animate:  { scale: 1,   opacity: 1 },
    exit:     { scale: 1.2, opacity: 0 },
  },
  flip: {
    initial:  { rotateX: -90, opacity: 0 },
    animate:  { rotateX: 0,   opacity: 1 },
    exit:     { rotateX:  90, opacity: 0 },
  },
  bounce: {
    initial:  { y: -30, opacity: 0 },
    animate:  { y: 0,   opacity: 1, transition: { type: 'spring', stiffness: 400, damping: 15 } },
    exit:     { y:  30, opacity: 0 },
  },
  typewriter: {
    initial:  { clipPath: 'inset(0 100% 0 0)', opacity: 1 },
    animate:  { clipPath: 'inset(0 0% 0 0)',   opacity: 1 },
    exit:     { opacity: 0 },
  },
};

// ── Componente principal ─────────────────────────────────────────────────────

export function AnnouncementStrip() {
  const [announcements, setAnnouncements] = useState<BannerAnnouncement[]>([]);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const navigate = useNavigate();
  const { setActiveTab, setActiveCategory } = useStore();

  useEffect(() => {
    listPublicAnnouncements()
      .then(data => {
        const strips = data.filter(item => !item.is_full_banner);
        setAnnouncements(strips);
      })
      .catch(() => {});
  }, []);

  const next = useCallback(() => {
    setCurrent(prev => (prev + 1) % (announcements.length || 1));
  }, [announcements.length]);

  // Auto-rotate
  useEffect(() => {
    if (announcements.length <= 1 || paused) return;
    const duration = (announcements[current]?.duration_seconds ?? 4) * 1000;
    intervalRef.current = setInterval(next, duration);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [announcements, current, next, paused]);

  if (!announcements.length) return null;

  const item = announcements[current];

  const handleClick = () => {
    if (!item.link_type || item.link_type === 'none' || !item.link_value) return;
    if (item.link_type === 'product') {
      navigate(`/produto/${item.link_value}`);
    } else if (item.link_type === 'category') {
      setActiveCategory(item.link_value);
      setActiveTab('catalogo');
      navigate('/catalogo');
    } else if (item.link_type === 'campaign') {
      setActiveTab('catalogo');
      navigate(`/catalogo?campaign=${item.link_value}`);
    } else if (item.link_type === 'url') {
      window.open(item.link_value, '_blank', 'noopener,noreferrer');
    }
  };

  const animVariant = variants[item.animation_type] ?? variants.slide;
  const isClickable = item.link_type && item.link_type !== 'none' && item.link_value;

  return (
    <div
      className="announcement-strip-fixed"
      style={{
        backgroundColor: item.bg_color,
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={item.id + current}
            variants={animVariant}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className={`flex items-center gap-3 h-9 ${isClickable ? 'cursor-pointer' : ''}`}
            onClick={isClickable ? handleClick : undefined}
            style={{ color: item.text_color }}
          >
            {/* Emoji/Ícone */}
            {item.emoji && (
              <span className="text-base shrink-0">{item.emoji}</span>
            )}

            {/* Imagem miniatura */}
            {item.image_url && (
              <img
                src={item.image_url}
                alt=""
                className="h-6 w-6 rounded object-cover shrink-0"
              />
            )}

            {/* Textos */}
            <span className="text-xs font-bold tracking-wide truncate">
              {item.title}
              {item.subtitle && (
                <span className="font-normal opacity-80 ml-2">{item.subtitle}</span>
              )}
            </span>

            {/* CTA se clicável */}
            {isClickable && (
              <span
                className="ml-auto shrink-0 text-[10px] font-black uppercase tracking-widest rounded-full px-3 py-0.5 border"
                style={{ borderColor: item.text_color, color: item.text_color }}
              >
                Ver mais →
              </span>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Indicadores de paginação */}
      {announcements.length > 1 && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {announcements.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`rounded-full transition-all ${
                i === current ? 'w-4 h-1.5' : 'w-1.5 h-1.5 opacity-50'
              }`}
              style={{ backgroundColor: item.text_color }}
              aria-label={`Anúncio ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
