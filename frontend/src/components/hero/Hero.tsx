import { Instagram, PackageCheck, ShoppingBag, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../../store/useStore";
import { usePublicSettings } from "../../hooks/usePublicSettings";
import { BrandLogo } from "../brand/BrandLogo";


const LOOP_FADE_WINDOW_SECONDS = 0.8;
const LOOP_REVEAL_WINDOW_SECONDS = 0.2;

type HeroBackgroundVideoProps = {
  className: string;
  visibleOpacity: number;
};

function HeroBackgroundVideo({ className, visibleOpacity }: HeroBackgroundVideoProps) {
  const [isLoopFading, setIsLoopFading] = useState(false);

  const updateLoopTransition = (video: HTMLVideoElement) => {
    if (!Number.isFinite(video.duration) || video.duration <= 0) return;

    const remainingTime = video.duration - video.currentTime;
    if (remainingTime <= LOOP_FADE_WINDOW_SECONDS) {
      setIsLoopFading(true);
      return;
    }

    if (video.currentTime <= LOOP_REVEAL_WINDOW_SECONDS) {
      setIsLoopFading(false);
    }
  };

  return (
    <video
      src="/hero/makeup-products.mp4"
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      data-hero-video
      aria-hidden="true"
      onTimeUpdate={(event) => updateLoopTransition(event.currentTarget)}
      onSeeked={(event) => updateLoopTransition(event.currentTarget)}
      className={className}
      style={{
        opacity: isLoopFading ? 0 : visibleOpacity,
        transition: "opacity 700ms ease-in-out"
      }}
    />
  );
}

export function Hero() {
  const setActiveTab = useStore(state => state.setActiveTab);
  const settings = usePublicSettings();
  const navigate = useNavigate();
  const instagramUrl = import.meta.env.VITE_INSTAGRAM_URL || "https://www.instagram.com/";
  const storeName = settings.store_name || 'MK MAKER';
  const heroStoreName = storeName.toUpperCase() === 'MK MAKER' ? 'MK Maker' : storeName;
  const useHeroLogoTitle = heroStoreName.toUpperCase() === 'MK MAKER';
  const primaryColor = settings.store_primary_color || '#c98f86';
  const secondaryColor = settings.store_secondary_color || '#111111';

  const openCatalog = () => {
    setActiveTab('catalogo');
    navigate('/catalogo');
  };

  const categorySignals = [
    "Produtos selecionados",
    "Novidades",
    "Ofertas",
    "Compra via WhatsApp"
  ];

  return (
    <div className="relative flex min-h-[100svh] w-full flex-1 flex-col overflow-hidden bg-white">
      {/* Background Media */}
      <div className="absolute inset-0 z-0 bg-white">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, #ffffff 0%, #ffffff 48%, #fff7f5 100%)"
          }}
        />
        <div className="absolute inset-0 dot-pattern opacity-55"></div>
        <div className="absolute inset-0 hidden lg:block">
          <HeroBackgroundVideo
            className="hero-photo-gradient h-full w-full object-cover object-[center_right]"
            visibleOpacity={0.9}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/70 to-white/8" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/24 via-transparent to-white/32" />
        </div>
        <div className="absolute inset-0 sm:hidden">
          <HeroBackgroundVideo
            className="hero-photo-gradient-mobile h-full w-full object-cover"
            visibleOpacity={0.75}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/70 to-white/42" />
          <div className="absolute inset-0 bg-gradient-to-r from-white/86 via-white/60 to-white/20" />
        </div>
      </div>

      <div className="relative z-10 mx-auto grid w-full max-w-full flex-1 items-center gap-8 px-6 pb-56 pt-24 sm:container sm:pb-44 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.9fr)] lg:px-16 lg:pb-32 lg:pt-28">
        <div className="w-full min-w-0 max-w-[calc(100vw-3rem)] sm:max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
            className="mb-4"
          >
            <span
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border font-bold uppercase tracking-widest text-[10px] rounded shadow-sm"
              style={{ borderColor: `${primaryColor}40`, color: secondaryColor }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Catalogo Premium
            </span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25, ease: "easeOut" }}
            className="mb-6 max-w-full text-neutral-900"
          >
            {useHeroLogoTitle ? (
              <span className="flex max-w-full flex-wrap items-end gap-x-3 gap-y-1 sm:gap-x-4">
                <BrandLogo
                  fallbackText="MK"
                  className="shrink-0"
                  imageClassName="h-[72px] w-[132px] object-contain object-left sm:h-[86px] sm:w-[158px] md:h-[112px] md:w-[206px] lg:h-[126px] lg:w-[232px]"
                  textClassName="font-display block text-[46px] font-semibold leading-[0.96] tracking-normal sm:text-[58px] md:text-[76px] lg:text-[86px]"
                />
                <span className="font-display block text-[46px] font-semibold leading-[0.96] tracking-normal sm:text-[58px] md:text-[76px] lg:text-[86px]">
                  Maker
                </span>
              </span>
            ) : (
              <span className="font-display block text-[46px] font-semibold leading-[0.96] tracking-normal sm:text-[58px] md:text-[76px] lg:text-[86px]">
                {heroStoreName}
              </span>
            )}
            <span className="font-display mt-2 block text-[28px] font-medium italic leading-[1.05] tracking-normal text-neutral-800 sm:text-[36px] md:text-[46px] lg:text-[54px]">
              pronto para vender
            </span>
            <span
              className="font-script mt-1 block text-[42px] font-bold leading-[0.95] tracking-normal sm:text-[54px] md:text-[68px] lg:text-[76px]"
              style={{ color: primaryColor }}
            >
              todos os dias.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.34, ease: "easeOut" }}
            className="mb-5 max-w-[19rem] text-sm font-medium leading-relaxed text-neutral-600 sm:max-w-xl md:text-base"
          >
            Um catalogo simples, direto e organizado para seus clientes escolherem produtos e finalizarem pelo WhatsApp.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.38, ease: "easeOut" }}
            className="flex flex-wrap gap-2 mb-8"
          >
            {categorySignals.map((item) => (
              <span key={item} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/85 border border-neutral-200 rounded-full text-[10px] font-bold uppercase tracking-widest text-neutral-700 shadow-sm">
                <PackageCheck className="w-3 h-3" style={{ color: primaryColor }} />
                {item}
              </span>
            ))}
          </motion.div>

          <motion.button
            onClick={openCatalog}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45, ease: "easeOut" }}
            className="liquid-glass-button flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold uppercase tracking-tight transition-all"
          >
            <ShoppingBag className="w-5 h-5" />
            <span>Ver Catalogo</span>
          </motion.button>
        </div>

        <div className="hidden lg:block" aria-hidden="true" />
      </div>

      {/* Bottom Widget */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="absolute bottom-4 right-4 left-auto w-[190px] sm:w-[230px] lg:bottom-8 lg:right-16 lg:w-[280px] z-20"
      >
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="bento-card p-2.5 sm:p-3.5 flex flex-col gap-2.5 sm:gap-3 bg-white/90 backdrop-blur-md shadow-xl"
        >
          <div className="flex gap-2.5 sm:gap-3 items-center">
            <div
              className="w-8 h-8 sm:w-9 sm:h-9 flex-shrink-0 bg-white border flex items-center justify-center rounded-full"
              style={{ borderColor: `${primaryColor}40`, color: primaryColor }}
            >
              <Instagram className="w-4 h-4" strokeWidth={2} />
            </div>
            <div className="flex-1">
              <h3 className="text-xs font-bold uppercase tracking-tight text-neutral-900 mb-1">
                Siga a {storeName}
              </h3>
              <p className="hidden sm:block text-[10px] font-medium text-neutral-500 leading-tight">
                Veja novidades, looks e ofertas no Instagram.
              </p>
            </div>
          </div>
          <button 
            onClick={() => window.open(instagramUrl, "_blank", "noopener,noreferrer")}
            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-neutral-100 text-neutral-900 border border-neutral-200 font-bold text-[10px] sm:text-[11px] uppercase rounded-lg hover:bg-white transition-colors w-full"
          >
            <Instagram className="inline-block w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1.5 sm:mr-2 align-[-2px]" />
            Instagram
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
