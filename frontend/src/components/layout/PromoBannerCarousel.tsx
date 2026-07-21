import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { listPublicAnnouncements, BannerAnnouncement } from '../../services/bannersService';
import { getOptimizedImageUrl } from '../../utils/imageOptimizer';

export function PromoBannerCarousel() {
  const [banners, setBanners] = useState<BannerAnnouncement[]>([]);
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [direction, setDirection] = useState(0); // -1 left, 1 right
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const navigate = useNavigate();
  const { setActiveTab, setActiveCategory } = useStore();

  useEffect(() => {
    listPublicAnnouncements()
      .then(data => {
        const filtered = data.filter(item => item.is_full_banner && item.image_url);
        setBanners(filtered);
      })
      .catch(() => {});
  }, []);

  const next = useCallback(() => {
    if (!banners.length) return;
    setDirection(1);
    setCurrent(prev => (prev + 1) % banners.length);
  }, [banners.length]);

  const prev = useCallback(() => {
    if (!banners.length) return;
    setDirection(-1);
    setCurrent(prev => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  useEffect(() => {
    if (banners.length <= 1 || paused) return;
    const duration = (banners[current]?.duration_seconds ?? 5) * 1000;
    intervalRef.current = setInterval(next, duration);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [banners, current, next, paused]);

  if (!banners.length) return null;

  const item = banners[current];

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

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0
    })
  };

  const [bgColor, imageFit] = (item.bg_color || '#c98f86').split('|');
  const fitClass = imageFit === 'contain' ? 'object-contain' : imageFit === 'fill' ? 'object-fill' : 'object-cover';

  return (
    <div 
      className="relative w-full overflow-hidden h-[150px] sm:h-[220px] md:h-[380px] z-10"
      style={{ backgroundColor: bgColor }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={item.id}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: "spring", stiffness: 350, damping: 35 },
            opacity: { duration: 0.15 }
          }}
          className="absolute inset-0 w-full h-full cursor-pointer select-none"
          onClick={handleClick}
        >
          <img 
            src={getOptimizedImageUrl(item.image_url || '', 1200, 80)} 
            alt={item.title} 
            className={`w-full h-full ${fitClass}`}
            draggable={false}
          />
        </motion.div>
      </AnimatePresence>
      {banners.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-neutral-800 backdrop-blur-sm transition-all hover:bg-white hover:scale-105 shadow"
            aria-label="Anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-neutral-800 backdrop-blur-sm transition-all hover:bg-white hover:scale-105 shadow"
            aria-label="Próximo"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Dots indicators */}
      {banners.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-black/30 backdrop-blur-[2px] px-2.5 py-1 rounded-full">
          {banners.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={(e) => { e.stopPropagation(); setDirection(i > current ? 1 : -1); setCurrent(i); }}
              className={`h-1.5 rounded-full transition-all ${i === current ? 'w-4 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/75'}`}
              aria-label={`Ir para slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
