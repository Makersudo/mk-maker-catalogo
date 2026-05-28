import { Home, MessageCircle, ShoppingBag, ShoppingCart } from "lucide-react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { BrandLogo } from "../brand/BrandLogo";
import { usePublicSettings } from "../../hooks/usePublicSettings";
import { useStore } from "../../store/useStore";

export function Header() {
  const { activeTab, setActiveTab, cart, openCart } = useStore();
  const settings = usePublicSettings();
  const navigate = useNavigate();
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const primaryColor = settings.store_primary_color || '#c98f86';
  const secondaryColor = settings.store_secondary_color || '#111111';
  const publicPathByTab = {
    inicio: '/inicio',
    catalogo: '/catalogo',
    contato: '/contato'
  } as const;

  const goToTab = (tab: keyof typeof publicPathByTab) => {
    setActiveTab(tab);
    navigate(publicPathByTab[tab]);
  };

  const navItems = [
    { id: 'inicio', label: 'In\u00edcio', icon: Home },
    { id: 'catalogo', label: 'Cat\u00e1logo', icon: ShoppingBag },
    { id: 'contato', label: 'Contato', icon: MessageCircle }
  ] as const;

  return (
    <header className="sticky top-0 z-50 bg-white/90 px-3 py-2 backdrop-blur-xl md:px-5 lg:px-8">
      <div className="relative grid min-h-[5.5rem] grid-cols-[auto_1fr_auto] items-center gap-3 overflow-hidden rounded-lg bg-[linear-gradient(90deg,#ffffff_0%,#fff7f5_48%,#ffffff_100%)] px-3 shadow-[0_12px_34px_rgba(17,17,17,0.06)] ring-1 ring-[#c98f86]/20 md:gap-5 md:px-5 lg:px-7">
        <div className="pointer-events-none absolute inset-y-2 left-56 right-64 hidden rounded-lg bg-[linear-gradient(90deg,rgba(201,143,134,0.08),rgba(255,255,255,0.18),rgba(17,17,17,0.04))] lg:block" />

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 flex w-36 min-w-0 cursor-pointer items-center md:w-44 lg:w-52"
          onClick={() => goToTab('inicio')}
        >
          <BrandLogo imageClassName="h-16 w-36 object-contain object-left md:h-[4.5rem] md:w-44 lg:w-52" />
        </motion.div>

        {/* Nav Links */}
        <nav className="relative z-10 hidden min-w-0 grid-cols-3 items-center gap-1 rounded-lg bg-white/85 p-1 text-sm font-bold uppercase tracking-wider text-neutral-500 shadow-inner shadow-neutral-200/60 ring-1 ring-white/80 md:grid">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <motion.button
                key={item.id}
                onClick={() => goToTab(item.id)}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                style={isActive ? { color: primaryColor } : undefined}
                className={`flex h-12 min-w-0 items-center justify-center gap-2 rounded-md px-3 transition-all ${isActive ? 'bg-white font-black shadow-sm ring-1 ring-[#c98f86]/20' : 'hover:bg-white/80 hover:text-neutral-900'}`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </motion.button>
            );
          })}
        </nav>

        {/* Header Controls */}
        <div className="relative z-10 flex items-center justify-end gap-2 md:gap-3">
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={openCart}
            className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white/95 text-neutral-500 shadow-sm ring-1 ring-neutral-200 transition-colors hover:text-neutral-900"
            aria-label="Abrir carrinho"
          >
            <ShoppingCart className="h-6 w-6" />
            {cartCount > 0 && (
              <span
                className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ backgroundColor: primaryColor }}
              >
                {cartCount}
              </span>
            )}
          </motion.button>

          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="hidden h-12 items-center justify-center rounded-full px-6 text-xs font-bold uppercase tracking-tight text-white shadow-lg shadow-neutral-900/10 transition-all sm:flex"
            style={{ background: `linear-gradient(90deg, ${secondaryColor}, ${primaryColor})` }}
            onClick={() => goToTab('contato')}
          >
            Fale Conosco
          </motion.button>
        </div>
      </div>

      <nav className="mt-2 grid grid-cols-3 rounded-lg bg-white/85 p-1 text-xs font-bold uppercase tracking-wider text-neutral-500 shadow-sm ring-1 ring-neutral-200/70 md:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => goToTab(item.id)}
              style={isActive ? { color: primaryColor } : undefined}
              className={`flex min-w-0 items-center justify-center gap-1.5 rounded-md px-2 py-2 transition-all ${isActive ? 'bg-white font-black shadow-sm' : 'hover:bg-white/70 hover:text-neutral-900'}`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
}
