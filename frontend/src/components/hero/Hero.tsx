import { Instagram, PackageCheck, ShoppingBag, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../../store/useStore";
import { usePublicSettings } from "../../hooks/usePublicSettings";

export function Hero() {
  const setActiveTab = useStore(state => state.setActiveTab);
  const settings = usePublicSettings();
  const navigate = useNavigate();
  const instagramUrl = import.meta.env.VITE_INSTAGRAM_URL || "https://www.instagram.com/";
  const storeName = settings.store_name || 'MK MAKER';
  const heroStoreName = storeName.toUpperCase() === 'MK MAKER' ? 'MK Maker' : storeName;
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
    <div className="relative w-full flex-1 flex flex-col overflow-hidden bg-white">
      {/* Background Media */}
      <div className="absolute inset-0 z-0 bg-white">
        <img
          src="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1920&auto=format&fit=crop"
          alt={`Catalogo ${storeName}`}
          className="w-full h-full object-cover mix-blend-multiply opacity-[0.18] grayscale"
          referrerPolicy="no-referrer"
        />
        
        {/* Overlay - Claro para manter o texto legivel e o logo nitido */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/78 to-white/40"></div>
        <div className="absolute inset-0 bg-white/25 backdrop-blur-[1px]"></div>
        <div className="absolute inset-0 dot-pattern opacity-60"></div>
      </div>

      <div className="relative z-10 mx-auto grid w-full max-w-full flex-1 items-center gap-8 px-6 pb-56 pt-10 sm:container sm:pb-44 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.9fr)] lg:px-16 lg:pb-32 lg:pt-12">
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
            <span className="font-display block text-[46px] font-semibold leading-[0.96] tracking-normal sm:text-[58px] md:text-[76px] lg:text-[86px]">
              {heroStoreName}
            </span>
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
            className="flex items-center gap-2 px-6 py-3.5 text-white font-bold text-sm uppercase tracking-tight rounded-full transition-all hover:scale-105 active:scale-95 shadow-lg"
            style={{ background: `linear-gradient(90deg, ${secondaryColor}, ${primaryColor})` }}
          >
            <ShoppingBag className="w-5 h-5" />
            Ver Catalogo
          </motion.button>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 48, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.35, ease: "easeOut" }}
          className="relative mx-auto w-full min-w-0 max-w-[calc(100vw-3rem)] sm:max-w-[560px] lg:max-w-none"
        >
          <div
            className="absolute -inset-4 rounded-lg opacity-35 blur-2xl"
            style={{ background: `linear-gradient(135deg, ${primaryColor}55, transparent 62%)` }}
          />
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-white shadow-2xl shadow-neutral-900/10 ring-1 ring-white/70 lg:h-[min(58vh,520px)] lg:aspect-auto">
            <img
              src="/hero/makeup-products.jpg"
              alt="Produtos de maquiagem MK MAKER"
              className="h-full w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/18 via-transparent to-white/10" />
          </div>
        </motion.div>
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
