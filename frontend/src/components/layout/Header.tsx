import { ShoppingCart } from "lucide-react";
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
    { id: 'inicio', label: 'Início' },
    { id: 'catalogo', label: 'Catálogo' },
    { id: 'contato', label: 'Contato' }
  ] as const;

  return (
    <header className="flex items-center justify-between h-16 border-b border-neutral-200 bg-white/80 backdrop-blur-md px-6 lg:px-16 sticky top-0 z-50">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => goToTab('inicio')}
      >
        <BrandLogo />
      </motion.div>

      {/* Nav Links */}
      <nav className="hidden md:flex gap-8 text-sm font-medium uppercase tracking-wider text-neutral-500">
        {navItems.map((item, index) => (
          <motion.button
            key={item.id}
            onClick={() => goToTab(item.id)}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
            style={activeTab === item.id ? { color: primaryColor } : undefined}
            className={`transition-colors ${activeTab === item.id ? 'font-bold' : 'hover:text-neutral-900'}`}
          >
            {item.label}
          </motion.button>
        ))}
      </nav>

      {/* Header Controls */}
      <div className="flex items-center gap-4">
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={openCart}
          className="relative p-2 text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          <ShoppingCart className="w-6 h-6" />
          {cartCount > 0 && (
            <span
              className="absolute top-0 right-0 w-4 h-4 text-[10px] font-bold text-white flex items-center justify-center rounded-full"
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
          className="hidden sm:flex items-center justify-center px-5 py-2 text-white font-bold text-xs uppercase tracking-tight rounded-lg transition-all shadow-md"
          style={{ background: `linear-gradient(90deg, ${secondaryColor}, ${primaryColor})` }}
          onClick={() => goToTab('contato')}
        >
          Fale Conosco
        </motion.button>
      </div>
    </header>
  );
}
