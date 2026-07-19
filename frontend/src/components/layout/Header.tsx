import { useEffect, useState, useRef } from "react";
import { ChevronDown, Home, MapPin, MessageCircle, Phone, Search, ShoppingBag, ShoppingCart, Layers } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useLocation, useNavigate } from "react-router-dom";
import { BrandLogo } from "../brand/BrandLogo";
import { AnnouncementStrip } from "./AnnouncementStrip";
import { usePublicSettings } from "../../hooks/usePublicSettings";
import { useStore } from "../../store/useStore";
import { getPublicCatalogBootstrap, PublicCatalogCategory, PublicCatalogProduct } from "../../services/catalogService";

interface SearchSuggestion {
  type: 'product' | 'category';
  text: string;
  value: string;
  imageUrl?: string;
}

export function Header() {
  const { activeTab, setActiveTab, cart, openCart, isCartOpen, searchTerm, setSearchTerm, setActiveCategory } = useStore();
  const settings = usePublicSettings();
  const location = useLocation();
  const navigate = useNavigate();
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const isProductPage = location.pathname.startsWith('/produto/');
  const isCatalogPage = location.pathname === '/catalogo';
  const isHomeSurface = activeTab === 'inicio' && !isProductPage;
  const isCatalogSurface = activeTab === 'catalogo' && !isProductPage;
  const shouldCenterHeaderControls = isHomeSurface || isCatalogSurface;
  const logoVisibilityClass = isHomeSurface ? 'hidden' : shouldCenterHeaderControls ? 'flex lg:hidden' : 'flex';
  const primaryColor = settings.store_primary_color || '#c98f86';
  const instagramUrl = import.meta.env.VITE_INSTAGRAM_URL || "https://www.instagram.com/";

  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Estados para as sugestões de pesquisa inteligentes (Shopee / Mercado Livre Style)
  const [allProducts, setAllProducts] = useState<PublicCatalogProduct[]>([]);
  const [allCategories, setAllCategories] = useState<PublicCatalogCategory[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);

  const searchContainerRef = useRef<HTMLFormElement>(null);
  const mobileSearchContainerRef = useRef<HTMLFormElement>(null);

  // Carrega produtos e categorias para a busca offline
  useEffect(() => {
    getPublicCatalogBootstrap()
      .then(({ categories, products }) => {
        setAllCategories(categories);
        setAllProducts(products);
        const rootCats = categories.filter(c => !c.parent_id && !c.parentId);
        setCategories(rootCats);
      })
      .catch(() => {});
  }, []);

  // Fecha o menu de sugestões ao clicar fora do formulário de busca
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedInsideDesktop = searchContainerRef.current?.contains(target);
      const clickedInsideMobile = mobileSearchContainerRef.current?.contains(target);

      if (!clickedInsideDesktop && !clickedInsideMobile) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Lógica de filtragem de sugestões em tempo real
  const generateSuggestions = (term: string) => {
    const trimmed = term.trim().toLowerCase();

    // Se estiver vazio, exibe as categorias principais como atalhos de busca rápida
    if (!trimmed) {
      const defaultSuggestions: SearchSuggestion[] = categories.slice(0, 5).map(cat => ({
        type: 'category',
        text: `Ver categoria: ${cat.name}`,
        value: cat.id
      }));
      setSuggestions(defaultSuggestions);
      return;
    }

    // 1. Filtrar categorias correspondentes
    const matchedCategories: SearchSuggestion[] = allCategories
      .filter(cat => cat.name.toLowerCase().includes(trimmed))
      .slice(0, 3)
      .map(cat => ({
        type: 'category',
        text: `Buscar em: ${cat.name}`,
        value: cat.id
      }));

    // 2. Filtrar produtos correspondentes
    const matchedProducts: SearchSuggestion[] = allProducts
      .filter(p => p.title.toLowerCase().includes(trimmed) || p.description?.toLowerCase().includes(trimmed))
      .slice(0, 5)
      .map(p => ({
        type: 'product',
        text: p.title,
        value: p.slug || p.id,
        imageUrl: p.images?.[0]
      }));

    setSuggestions([...matchedCategories, ...matchedProducts]);
  };

  // Monitora alterações na busca para gerar sugestões e resetar índice de navegação do teclado
  useEffect(() => {
    generateSuggestions(searchTerm);
    setActiveSuggestionIndex(-1);
  }, [searchTerm, allProducts, allCategories, categories]);

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setShowSuggestions(false);
    if (suggestion.type === 'product') {
      setSearchTerm(suggestion.text);
      navigate(`/produto/${suggestion.value}`);
    } else if (suggestion.type === 'category') {
      setActiveCategory(suggestion.value);
      setSearchTerm('');
      setActiveTab('catalogo');
      navigate('/catalogo');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    } else if (e.key === 'Enter') {
      if (activeSuggestionIndex >= 0 && activeSuggestionIndex < suggestions.length) {
        e.preventDefault();
        handleSuggestionClick(suggestions[activeSuggestionIndex]);
      }
    }
  };

  // Renderizador do painel flutuante de sugestões (estilo Mercado Livre/Shopee)
  const renderSuggestionsDropdown = () => {
    if (!showSuggestions) return null;
    if (suggestions.length === 0 && searchTerm.trim() === '') return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.15 }}
        className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-neutral-200/80 shadow-2xl overflow-hidden z-[100] text-neutral-800"
      >
        <div className="py-2 max-h-[300px] overflow-y-auto custom-scrollbar">
          {searchTerm.trim() === '' ? (
            <div className="px-4 py-1.5 text-[10px] font-black uppercase tracking-wider text-neutral-400">
              Categorias Principais
            </div>
          ) : null}

          {suggestions.map((suggestion, index) => {
            const isActive = index === activeSuggestionIndex;
            return (
              <button
                key={`${suggestion.type}-${suggestion.value}-${index}`}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                onMouseEnter={() => setActiveSuggestionIndex(index)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#c98f86]/10 text-[#7c4f4a]'
                    : 'text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                {suggestion.type === 'product' ? (
                  suggestion.imageUrl ? (
                    <img
                      src={suggestion.imageUrl}
                      alt=""
                      className="w-8 h-8 rounded-lg object-cover bg-neutral-100 border border-neutral-200/50"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-400">
                      <Search className="w-3.5 h-3.5" />
                    </div>
                  )
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-[#c98f86]/5 flex items-center justify-center text-[#c98f86]">
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                )}

                <span className="truncate flex-1">{suggestion.text}</span>

                {suggestion.type === 'category' && (
                  <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold bg-neutral-100 px-2 py-0.5 rounded-full shrink-0">
                    Categoria
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </motion.div>
    );
  };

  const publicPathByTab = {
    inicio: '/inicio',
    catalogo: '/catalogo',
    contato: '/contato'
  } as const;

  const goToTab = (tab: keyof typeof publicPathByTab) => {
    setActiveTab(tab);
    navigate(publicPathByTab[tab]);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    setActiveTab('catalogo');
    navigate('/catalogo');
  };

  const handleCategoryClick = (categoryId: string | null) => {
    setActiveCategory(categoryId);
    goToTab('catalogo');
    setIsDropdownOpen(false);
  };

  const navItems = [
    { id: 'inicio', label: 'Início' },
    { id: 'catalogo', label: 'Catálogo' },
    { id: 'contato', label: 'Contato' }
  ] as const;

  const bottomNavItems = [
    { id: 'inicio', label: 'Início', icon: Home, path: '/inicio' },
    { id: 'catalogo', label: 'Catálogo', icon: ShoppingBag, path: '/catalogo' },
    { id: 'carrinho', label: 'Carrinho', icon: ShoppingCart, isCart: true },
    { id: 'contato', label: 'Contato', icon: MessageCircle, path: '/contato' },
  ] as const;

  const isHomePage = location.pathname === '/inicio';

  return (
    <>
      {/* Accent bar at the top - oculta na home pois o hero cobre a tela */}
      {!isHomePage && (
        <div className="fixed top-0 inset-x-0 h-1 z-50 transition-colors" style={{ backgroundColor: primaryColor }} />
      )}


      {/* --- CABEÇALHO WEB (DESKTOP) --- oculto na home/início */}
      {!isHomePage && (
      <header className="fixed top-1 inset-x-0 z-50 hidden border-b border-[#3a1e1b] pointer-events-auto lg:block" style={{ backgroundColor: '#4a2825' }}>
        {/* Linha Superior: Logo, Busca Global e Highlight */}
        <div className="mx-auto max-w-7xl px-6 lg:px-8 h-16 flex items-center gap-6">

          {/* Logo MK Maker */}
          <div className="cursor-pointer shrink-0" onClick={() => goToTab('inicio')}>
            <BrandLogo imageClassName="h-12 w-28 object-contain object-left brightness-0 invert" />
          </div>

          {/* Barra de Busca (Mercado Livre Style) — centralizada */}
          <form onSubmit={handleSearchSubmit} className="flex-1 relative" ref={searchContainerRef}>
            <div className="relative flex items-center bg-white/10 rounded-full border border-white/20 transition-all hover:border-white/40 focus-within:border-white/60 focus-within:bg-white/15">
              <input
                type="text"
                placeholder="Busque produtos, categorias e mais..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={handleKeyDown}
                autoComplete="off"
                className="w-full bg-transparent px-5 py-2.5 pr-12 text-sm text-white outline-none placeholder-white/50 font-medium"
              />
              <button
                type="submit"
                className="absolute right-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white transition-all hover:bg-white/30"
                aria-label="Pesquisar"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
            {renderSuggestionsDropdown()}
          </form>

          {/* Banner Promocional / Contato */}
          <div className="flex items-center gap-4 text-xs font-semibold text-white/70 shrink-0">
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 hover:text-white transition-colors"
            >
              <span className="h-2 w-2 rounded-full animate-pulse bg-emerald-400" />
              <span>Siga no Instagram</span>
            </a>
          </div>
        </div>

        {/* Linha Inferior: Localização, Links e Carrinho */}
        <div className="border-t border-white/10">
          <div className="mx-auto max-w-7xl px-6 lg:px-8 h-11 flex items-center justify-between gap-6">
            {/* Informações de Envio */}
            <div className="flex items-center gap-2 text-[11px] font-bold text-white/60 select-none">
              <MapPin className="h-4 w-4 shrink-0 text-white/60" />
              <div className="leading-tight">
                <p className="text-white/80">Enviar para todo o Brasil</p>
                <p className="text-[9px] font-medium text-white/50">Via Motoboy & Correios</p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-white/70">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => goToTab(item.id)}
                  className={`transition-colors hover:text-white ${
                    activeTab === item.id ? 'text-white font-black' : ''
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Carrinho de Compras */}
            <div className="flex items-center">
              <button
                onClick={openCart}
                className="relative flex h-8 items-center gap-2 rounded-full px-3 text-xs font-bold text-white/70 hover:text-white transition-colors"
                aria-label="Abrir carrinho"
              >
                <ShoppingCart className="h-4.5 w-4.5" />
                <span>Meu Carrinho</span>
                {cartCount > 0 && (
                  <span
                    className="flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-white shadow-sm bg-white/20 border border-white/30"
                  >
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>
      )}


      {/* --- CABEÇALHO MOBILE/TABLET (Compacto com Busca) - oculto na home --- */}
      {!isHomePage && (
      <header className="fixed top-1 inset-x-0 z-50 px-4 py-3 border-b border-[#3a1e1b] backdrop-blur-md pointer-events-none lg:hidden" style={{ backgroundColor: '#4a2825ef' }}>
        <div className="mx-auto max-w-lg flex items-center justify-center gap-4 pointer-events-auto">
          {/* Campo de Busca Compacto */}
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-xs relative" ref={mobileSearchContainerRef}>
            <div className="relative flex items-center bg-white/10 rounded-full border border-white/20 focus-within:border-white/40 focus-within:bg-white/15">
              <input
                type="text"
                placeholder="Pesquisar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={handleKeyDown}
                autoComplete="off"
                className="w-full bg-transparent pl-4 pr-10 py-1.5 text-xs text-white outline-none placeholder-white/50 font-medium"
              />
              <button
                type="submit"
                className="absolute right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
              >
                <Search className="h-3.5 w-3.5" />
              </button>
            </div>
            {renderSuggestionsDropdown()}
          </form>
        </div>
      </header>
      )}

      {/* --- BARRA DE NAVEGAÇÃO INFERIOR PÚBLICA (Instagram Style) --- */}
      <div className="fixed bottom-4 left-4 right-4 z-50 rounded-2xl bg-white/94 backdrop-blur-md border border-neutral-200/80 shadow-lg shadow-neutral-900/10 lg:hidden pointer-events-auto">
        <nav className="flex justify-around items-center h-16 px-1">
          {bottomNavItems.map((item) => {
            const isCart = 'isCart' in item && item.isCart;
            const isTabActive = isCart ? isCartOpen : (activeTab === item.id);
            const Icon = item.icon;

            const handleClick = () => {
              if (isCart) {
                openCart();
              } else if (item.path) {
                goToTab(item.id as any);
              }
            };

            return (
              <button
                key={item.id}
                onClick={handleClick}
                className="relative flex flex-col items-center justify-center flex-1 h-full py-1 focus:outline-none"
              >
                <div
                  className={`flex items-center justify-center rounded-xl w-12 h-8 bottom-nav-badge ${
                    isTabActive ? 'bg-[#c98f86]/10 text-[#c98f86]' : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {isCart && cartCount > 0 && (
                    <span
                      className="absolute top-1.5 right-3 flex h-4.5 w-4.5 items-center justify-center rounded-full text-[9px] font-bold text-white ring-2 ring-white"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {cartCount}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[10px] mt-0.5 font-bold transition-colors ${
                    isTabActive ? 'text-[#c98f86]' : 'text-neutral-500'
                  }`}
                >
                  {item.label}
                </span>
                
                {/* Dot Indicator */}
                <div
                  className={`w-1 h-1 rounded-full bg-[#c98f86] mt-0.5 active-dot ${
                    isTabActive ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
                  }`}
                />
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
}
