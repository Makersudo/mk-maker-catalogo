import { ShoppingCart } from "lucide-react";
import { motion } from "motion/react";
import { useLocation, useNavigate } from "react-router-dom";
import { BrandLogo } from "../brand/BrandLogo";
import { usePublicSettings } from "../../hooks/usePublicSettings";
import { useStore } from "../../store/useStore";

export function Header() {
  const { activeTab, setActiveTab, cart, openCart } = useStore();
  const settings = usePublicSettings();
  const location = useLocation();
  const navigate = useNavigate();
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const isProductPage = location.pathname.startsWith('/produto/');
  const isCatalogSurface = activeTab === 'catalogo' && !isProductPage;
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
    { id: 'inicio', label: 'Início' },
    { id: 'catalogo', label: 'Catálogo' },
    { id: 'contato', label: 'Contato' }
  ] as const;

  return (
    <header className="mk-header-surface sticky top-0 z-50 px-4 py-3 backdrop-blur-xl md:px-6 lg:px-16">
      <div className={`grid min-h-16 grid-cols-[auto_1fr_auto] items-center gap-3 md:min-h-20 ${isCatalogSurface ? 'lg:grid-cols-[1fr_auto_1fr]' : ''}`}>
        {/* Logo */}
        {isCatalogSurface && <div className="hidden lg:block" aria-hidden="true" />}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`min-w-0 cursor-pointer items-center ${isCatalogSurface ? 'flex lg:hidden' : 'flex'}`}
          onClick={() => goToTab('inicio')}
        >
          <BrandLogo imageClassName="h-14 w-32 object-contain object-left md:h-16 md:w-40" />
        </motion.div>

        {/* Nav Links */}
        <nav className="hidden justify-self-center rounded-full bg-white p-1 text-sm font-bold uppercase tracking-wider text-neutral-500 shadow-sm shadow-neutral-900/5 ring-1 ring-neutral-200/80 md:flex">
          {navItems.map((item, index) => (
            <motion.button
              key={item.id}
              onClick={() => goToTab(item.id)}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
              style={activeTab === item.id ? { color: primaryColor } : undefined}
              className={`rounded-full px-4 py-2 transition-all ${activeTab === item.id ? 'bg-white font-black shadow-sm shadow-neutral-900/5 ring-1 ring-neutral-200/80' : 'hover:bg-neutral-50 hover:text-neutral-900'}`}
            >
              {item.label}
            </motion.button>
          ))}
        </nav>

        {/* Header Controls */}
        <div className="flex items-center justify-end gap-2 md:gap-3">
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={openCart}
            className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white text-neutral-500 shadow-sm shadow-neutral-900/5 ring-1 ring-neutral-200/80 transition-colors hover:bg-neutral-50 hover:text-neutral-900"
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
            className="hidden h-11 items-center justify-center rounded-full px-5 text-xs font-bold uppercase tracking-tight text-white shadow-lg shadow-neutral-900/10 transition-all sm:flex"
            style={{ background: `linear-gradient(90deg, ${secondaryColor}, ${primaryColor})` }}
            onClick={() => goToTab('contato')}
          >
            Fale Conosco
          </motion.button>
        </div>
      </div>

      <nav className="mt-2 flex justify-center rounded-full bg-white p-1 text-xs font-bold uppercase tracking-wider text-neutral-500 shadow-sm shadow-neutral-900/5 ring-1 ring-neutral-200/80 md:hidden">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => goToTab(item.id)}
            style={activeTab === item.id ? { color: primaryColor } : undefined}
            className={`flex-1 rounded-full px-3 py-2 transition-all ${activeTab === item.id ? 'bg-white font-black shadow-sm shadow-neutral-900/5 ring-1 ring-neutral-200/80' : 'hover:bg-neutral-50 hover:text-neutral-900'}`}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </header>
  );
}
