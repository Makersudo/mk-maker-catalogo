import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Grid2X2, Rows3, Search, ChevronDown, ChevronLeft, ChevronRight, PackageX, Menu, X, Sparkles, Layers } from "lucide-react";
import { ProductCard } from "./ProductCard";
import { CatalogSortOption, sortCatalogProducts } from "./catalogSort";
import { getCatalogSampleImage } from "./catalogSampleImages";
import { useStore } from "../../store/useStore";
import { getPublicCatalogBootstrap } from "../../services/catalogService";
import { Product } from "../../types";
import { BrandLogo } from "../brand/BrandLogo";
import { usePublicSettings } from "../../hooks/usePublicSettings";
import { PromoBannerCarousel } from "../layout/PromoBannerCarousel";

interface CatalogCategory {
  id: string;
  name: string;
  parent_id?: string | null;
  parentId?: string | null;
}

function getParentId(category: CatalogCategory) {
  return category.parent_id ?? category.parentId ?? null;
}

type PaginationItem = number | "start-ellipsis" | "end-ellipsis";
type MobileGridMode = "single" | "compact";

function buildPaginationItems(currentPage: number, totalPages: number): PaginationItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, totalPages, currentPage]);

  if (currentPage <= 4) {
    [2, 3, 4, 5].forEach((page) => pages.add(page));
  } else if (currentPage >= totalPages - 3) {
    [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1].forEach((page) => pages.add(page));
  } else {
    [currentPage - 1, currentPage + 1].forEach((page) => pages.add(page));
  }

  const orderedPages = Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);
  const items: PaginationItem[] = [];

  orderedPages.forEach((page, index) => {
    const previousPage = orderedPages[index - 1];
    if (previousPage && page - previousPage === 2) {
      items.push(previousPage + 1);
    } else if (previousPage && page - previousPage > 2) {
      items.push(index === 1 ? "start-ellipsis" : "end-ellipsis");
    }
    items.push(page);
  });

  return items;
}

function CatalogSkeleton() {
  return (
    <div className="flex flex-col flex-1">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6 content-start mb-10 border-t border-neutral-200 pt-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="catalog-panel-surface overflow-hidden rounded-2xl border">
            <div className="aspect-square animate-pulse bg-neutral-100" />
            <div className="space-y-3 p-5">
              <div className="h-4 w-24 animate-pulse rounded bg-neutral-100" />
              <div className="h-6 w-3/4 animate-pulse rounded bg-neutral-100" />
              <div className="h-3 w-full animate-pulse rounded bg-neutral-100" />
              <div className="h-3 w-5/6 animate-pulse rounded bg-neutral-100" />
              <div className="flex items-end justify-between pt-3">
                <div className="space-y-2">
                  <div className="h-3 w-16 animate-pulse rounded bg-neutral-100" />
                  <div className="h-6 w-24 animate-pulse rounded bg-neutral-100" />
                </div>
                <div className="h-10 w-10 animate-pulse rounded-full bg-neutral-100" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Catalog() {
  const { activeCategory, setActiveCategory, searchTerm, setSearchTerm, isMobileCategoriesOpen, setIsMobileCategoriesOpen } = useStore();
  const settings = usePublicSettings();
  const [currentPage, setCurrentPage] = useState(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth >= 1024;
  });
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<string>>(new Set());
  const [sortOption, setSortOption] = useState<CatalogSortOption>("relevance");
  const [mobileGridMode, setMobileGridMode] = useState<MobileGridMode>("single");
  const [storeCategories, setStoreCategories] = useState<CatalogCategory[]>([]);
  const [storeProducts, setStoreProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const itemsPerPage = 8;
  const storeName = settings.store_name?.trim() || "MK MAKER";

  const scrollCatalogToTop = () => {
    document.querySelector("main")?.scrollTo({ top: 0, left: 0, behavior: "auto" });
  };

  const setCatalogPage = (nextPage: number) => {
    const safePage = Math.min(totalPages, Math.max(1, nextPage));
    if (safePage === currentPage) return;
    setCurrentPage(safePage);
    window.requestAnimationFrame(scrollCatalogToTop);
  };

  const selectCategory = (categoryId: string | null) => {
    setActiveCategory(categoryId);
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 1024px)");
    const syncSidebarMode = () => setIsSidebarOpen(desktopQuery.matches);

    syncSidebarMode();
    desktopQuery.addEventListener("change", syncSidebarMode);
    return () => desktopQuery.removeEventListener("change", syncSidebarMode);
  }, []);

  useEffect(() => {
    if (isMobileCategoriesOpen) {
      setIsSidebarOpen(true);
    }
  }, [isMobileCategoriesOpen]);

  useEffect(() => {
    if (!isSidebarOpen && window.innerWidth < 1024) {
      setIsMobileCategoriesOpen(false);
    }
  }, [isSidebarOpen, setIsMobileCategoriesOpen]);

  useEffect(() => {
    let isMounted = true;

    setIsLoading(true);
    setLoadError("");

    getPublicCatalogBootstrap()
      .then(({ categories, products }) => {
        if (!isMounted) return;

        setStoreCategories(
          categories.map((category) => ({
            id: category.id,
            name: category.name,
            parent_id: category.parent_id ?? category.parentId ?? null,
          }))
        );

        setStoreProducts(
          products.map((product) => {
            const sampleImage = getCatalogSampleImage(product);
            const images = product.images.length > 0 ? product.images : [sampleImage];

            return {
              id: product.id,
              slug: product.slug ?? null,
              name: product.title,
              description: product.description,
              price: product.campaign?.finalPrice ?? product.price,
              originalPrice: product.campaign?.originalPrice ?? product.price,
              campaign: product.campaign ?? null,
              isFeatured: product.isFeatured ?? false,
              isNew: product.isNew ?? false,
              createdAt: product.created_at,
              relevanceScore: product.relevanceScore ?? 0,
              relevanceUnitsSold: product.relevanceUnitsSold ?? 0,
              relevanceOrderCount: product.relevanceOrderCount ?? 0,
              category: product.subcategoryName || product.categoryName || "Diversos",
              categoryId: product.categoryId,
              subcategoryId: product.subcategoryId ?? null,
              brandLabel: product.brandLabel ?? "",
              imageUrl: images[0],
              images,
              features: product.features ?? [],
              stockQuantity: product.stockQuantity ?? 0,
              variantsEnabled: product.variantsEnabled ?? false,
              variants: product.variants ?? [],
            };
          })
        );
      })
      .catch(() => {
        if (!isMounted) return;
        setStoreCategories([]);
        setStoreProducts([]);
        setLoadError("Nao foi possivel carregar o catalogo agora.");
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const rootCategories = useMemo(
    () => storeCategories.filter((category) => !getParentId(category)),
    [storeCategories]
  );
  const subcategoriesByParent = useMemo(() => {
    return storeCategories.reduce<Record<string, CatalogCategory[]>>((acc, category) => {
      const parentId = getParentId(category);
      if (!parentId) return acc;
      acc[parentId] = [...(acc[parentId] ?? []), category];
      return acc;
    }, {});
  }, [storeCategories]);
  const categoryProductCounts = useMemo(() => {
    return storeProducts.reduce<Record<string, number>>((acc, product) => {
      if (product.categoryId) acc[product.categoryId] = (acc[product.categoryId] ?? 0) + 1;
      if (product.subcategoryId) acc[product.subcategoryId] = (acc[product.subcategoryId] ?? 0) + 1;
      return acc;
    }, {});
  }, [storeProducts]);
  const activeCategoryData = storeCategories.find((category) => category.id === activeCategory);
  const activeCategoryLabel = activeCategory ? activeCategoryData?.name : "Todos os Itens";

  const filteredProducts = useMemo(() => {
    return storeProducts.filter((product) => {
      const selectedCategory = storeCategories.find((category) => category.id === activeCategory);
      const isSubcategory = selectedCategory ? Boolean(getParentId(selectedCategory)) : false;
      const matchCategory = activeCategory
        ? (isSubcategory ? product.subcategoryId === activeCategory : product.categoryId === activeCategory)
        : true;
      const searchLower = searchTerm.toLowerCase();
      const matchSearch =
        product.name.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower);

      return matchCategory && matchSearch;
    });
  }, [storeProducts, storeCategories, activeCategory, searchTerm]);

  const sortedProducts = useMemo(() => {
    return sortCatalogProducts(filteredProducts, sortOption);
  }, [filteredProducts, sortOption]);

  const campaignFocusProducts = useMemo(() => {
    return sortCatalogProducts(
      filteredProducts.filter((product) => Boolean(product.campaign?.isHighlight ?? product.campaign)),
      "relevance"
    );
  }, [filteredProducts]);

  const campaignFocusProductIds = useMemo(
    () => new Set(campaignFocusProducts.map((product) => product.id)),
    [campaignFocusProducts]
  );

  const regularSortedProducts = useMemo(
    () => sortedProducts.filter((product) => !campaignFocusProductIds.has(product.id)),
    [sortedProducts, campaignFocusProductIds]
  );

  const totalPages = Math.ceil(regularSortedProducts.length / itemsPerPage) || 1;
  const paginationItems = buildPaginationItems(currentPage, totalPages);
  const isCompactMobileGrid = mobileGridMode === "compact";
  const baseProductGridClass = isCompactMobileGrid
    ? "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 lg:gap-6"
    : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6";
  const productGridClass = `${baseProductGridClass} content-start mb-10 border-t border-neutral-200 pt-6`;
  const focusGridClass = `${baseProductGridClass} content-start`;
  const campaignFocusTitle = activeCategory ? `Destaques em ${activeCategoryLabel}` : "Destaques da campanha";
  const paginatedProducts = regularSortedProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
    window.requestAnimationFrame(scrollCatalogToTop);
  }, [activeCategory, searchTerm, sortOption]);

  useEffect(() => {
    if (!activeCategory) return;
    const selectedCategory = storeCategories.find((category) => category.id === activeCategory);
    const parentId = selectedCategory ? getParentId(selectedCategory) : null;
    const categoryIdToExpand = parentId || selectedCategory?.id;
    if (!categoryIdToExpand) return;

    setExpandedCategoryIds((current) => {
      if (current.has(categoryIdToExpand)) return current;
      const next = new Set(current);
      next.add(categoryIdToExpand);
      return next;
    });
  }, [activeCategory, storeCategories]);

  const toggleCategoryDropdown = (categoryId: string) => {
    setExpandedCategoryIds((current) => {
      const next = new Set(current);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const renderSidebarContent = (isMobile: boolean) => (
    <div className={`w-[min(20rem,calc(100vw-1rem))] lg:w-72 flex ${isMobile ? 'h-full' : 'h-auto'} flex-col overflow-hidden`}>
      {/* Logo: visível apenas no mobile drawer */}
      <div className="flex min-h-[92px] items-center bg-white px-5 lg:hidden justify-start">
        <div className="min-w-0">
          <BrandLogo imageClassName="h-14 w-36 object-contain object-left" />
        </div>
      </div>

      {/* Premium Sidebar Header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-3 justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#c98f86]" />
              <h3 className="text-[11px] font-black text-[#7c4f4a] uppercase tracking-[0.22em]">
                Categorias
              </h3>
            </div>
            <p className="mt-1.5 text-[11px] text-neutral-400 font-medium">
              Navegue por linha e tipo de produto
            </p>
          </div>
          {isMobile && (
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="inline-flex shrink-0 items-center justify-center rounded-full w-8 h-8 bg-neutral-100 text-neutral-500 transition-all hover:bg-[#fbf4f3] hover:text-[#8f5e59] hover:scale-105 active:scale-95"
              aria-label="Fechar painel"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {/* Gradient accent line */}
        <div className="mt-3 h-[2px] rounded-full bg-gradient-to-r from-[#c98f86] via-[#e8c4bc] to-transparent" />
      </div>

      {/* Category List */}
      <div className={`flex-1 ${isMobile ? 'overflow-y-auto custom-scrollbar' : 'overflow-hidden'} px-3 pb-5`}>
        {isLoading &&
          Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-11 animate-pulse rounded-lg bg-neutral-50 mb-1" />
          ))}

        {!isLoading && (
          <div className="flex flex-col">
            {/* "Todos os Itens" — Premium pill button */}
            <button
              onClick={() => {
                selectCategory(null);
              }}
              className={`group flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all duration-200 mb-2 ${
                activeCategory === null
                  ? "bg-gradient-to-r from-[#7c4f4a] to-[#c98f86] text-white shadow-lg shadow-[#c98f86]/20"
                  : "text-neutral-600 hover:bg-[#fbf4f3] hover:text-[#7c4f4a]"
              }`}
            >
              <Layers className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${activeCategory === null ? 'text-white/80' : 'text-[#c98f86]'}`} />
              <span className="text-sm font-semibold tracking-wide flex-1">Todos os Itens</span>
              <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold tabular-nums ${
                activeCategory === null
                  ? "bg-white/20 text-white"
                  : "bg-neutral-100 text-neutral-400"
              }`}>
                {storeProducts.length}
              </span>
            </button>

            {/* Category accordion items */}
            {rootCategories.map((category, index) => {
              const subcategories = subcategoriesByParent[category.id] ?? [];
              const hasSubcategories = subcategories.length > 0;
              const isExpanded = expandedCategoryIds.has(category.id);
              const isCategoryActive = activeCategory === category.id || subcategories.some(s => s.id === activeCategory);

              return (
                <div key={category.id} className="flex flex-col">
                  {/* Divider line between categories */}
                  {index > 0 && (
                    <div className="mx-3 border-t border-neutral-100" />
                  )}
                  <button
                    onClick={() => {
                      if (hasSubcategories) {
                        toggleCategoryDropdown(category.id);
                      } else {
                        selectCategory(category.id);
                      }
                    }}
                    className={`group flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition-all duration-200 rounded-lg ${
                      isCategoryActive
                        ? "text-[#7c4f4a]"
                        : "text-neutral-600 hover:text-[#7c4f4a] hover:bg-[#fdf8f7]"
                    }`}
                  >
                    <span className={`text-[13px] tracking-wide truncate min-w-0 ${
                      isCategoryActive ? "font-bold" : "font-semibold"
                    }`}>
                      {category.name}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {!hasSubcategories && (
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums ${
                          isCategoryActive
                            ? "bg-[#fbf0ed] text-[#9d6a63]"
                            : "bg-neutral-50 text-neutral-400"
                        }`}>
                          {categoryProductCounts[category.id] ?? 0}
                        </span>
                      )}
                      {hasSubcategories && (
                        <ChevronDown
                          className={`h-4 w-4 text-neutral-400 transition-all duration-300 ease-out group-hover:text-[#c98f86] ${
                            isExpanded ? "rotate-180 text-[#c98f86]" : ""
                          }`}
                        />
                      )}
                    </div>
                  </button>

                  {/* Subcategory expansion — animated reveal */}
                  {hasSubcategories && isExpanded && (
                    <div className="ml-4 mr-2 mb-2 flex flex-col border-l-2 border-[#ead5d2] pl-3 animate-[fadeSlideIn_200ms_ease-out]">
                      {subcategories.map((subcategory) => {
                        const isSubcategoryActive = activeCategory === subcategory.id;
                        return (
                          <button
                            key={subcategory.id}
                            onClick={() => {
                              selectCategory(subcategory.id);
                            }}
                            className={`group flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left transition-all duration-200 ${
                              isSubcategoryActive
                                ? "bg-[#fbf4f3] text-[#7c4f4a] font-semibold"
                                : "text-neutral-500 hover:bg-[#fdf8f7] hover:text-[#7c4f4a]"
                            }`}
                            title={subcategory.name}
                          >
                            <span className="min-w-0 truncate text-[12.5px]">{subcategory.name}</span>
                            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums ${
                              isSubcategoryActive
                                ? "bg-[#fbf0ed] text-[#9d6a63]"
                                : "bg-neutral-50/80 text-neutral-400"
                            }`}>
                              {categoryProductCounts[subcategory.id] ?? 0}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="catalog-brand-surface relative w-full flex-1 flex flex-col">
      <div className="absolute inset-0 dot-pattern opacity-60 pointer-events-none" />
      {/* 1. Promo Banner Carousel (Full Width) */}
      {!isLoading && !loadError && sortedProducts.length > 0 && (
        <div className="w-full shrink-0">
          <PromoBannerCarousel />
        </div>
      )}
      {/* 2. Main Row Layout (Sidebar + Products Grid) */}
      <div className="flex-1 w-full flex relative items-start">
        {/* Mobile Drawer (Only visible on lg:hidden) */}
        <div className="lg:hidden">
          {isSidebarOpen && (
            <div
              className="fixed inset-0 z-40 bg-neutral-900/50 backdrop-blur-sm"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
          <aside
            className={`
              fixed left-0 z-[60] top-0 h-full bg-white
              border-r border-neutral-200
              transition-all duration-300 ease-in-out shrink-0 overflow-visible
              w-[min(20rem,calc(100vw-1rem))]
              ${
                isSidebarOpen
                  ? "translate-x-0 shadow-2xl pointer-events-auto"
                  : "-translate-x-full opacity-0 pointer-events-none"
              }
            `}
          >
            {renderSidebarContent(true)}
          </aside>
        </div>
        {/* Desktop Sidebar (Only visible on lg:block, sticky positioning below header) */}
        <aside className="hidden lg:block w-72 shrink-0 bg-white/95 backdrop-blur-md border-r border-neutral-200 h-auto self-start mt-6 lg:sticky lg:top-[112px] lg:max-h-[calc(100vh-128px)] lg:overflow-y-auto lg:overflow-x-hidden sidebar-scrollbar">
          {renderSidebarContent(false)}
        </aside>

      <div
        className="relative z-10 flex flex-1 flex-col p-4 pt-4 lg:p-12 lg:pt-6"
      >

        <header className="mb-6 lg:mb-10 flex flex-col gap-4 lg:gap-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              {!isSidebarOpen && (
                <button
                  onClick={() => setIsSidebarOpen(true)}
                  className="mt-1 flex shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-white p-2 text-neutral-600 shadow-sm shadow-neutral-900/5 transition-colors hover:bg-neutral-50 hover:text-[#8f5e59] lg:hidden"
                  title="Abrir Categorias"
                  aria-label="Abrir categorias"
                >
                  <Menu className="w-5 h-5" />
                </button>
              )}
              <div>
                <h2 className="text-2xl lg:text-4xl font-bold uppercase tracking-tight text-neutral-900 mb-1 lg:mb-2">
                  Makeup{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6f4844] to-[#c98f86]">
                    & Beauty
                  </span>
                </h2>
                <p className="text-xs lg:text-sm text-neutral-500">Produtos de beleza organizados para comprar pelo WhatsApp.</p>
              </div>
            </div>

            <div className="w-full lg:w-[260px] lg:pt-1">
              <label
                className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-[#9d6a63]"
                htmlFor="catalog-sort"
              >
                Ordenar por
              </label>
              <select
                id="catalog-sort"
                value={sortOption}
                onChange={(event) => setSortOption(event.target.value as CatalogSortOption)}
                disabled={isLoading}
                className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 shadow-sm shadow-neutral-900/5 outline-none transition-colors focus:border-[#c98f86] focus:ring-1 focus:ring-[#c98f86] disabled:bg-neutral-100 disabled:text-neutral-400"
              >
                <option value="relevance">Mais Relevante</option>
                <option value="price-asc">Menor Preço</option>
                <option value="price-desc">Maior Preço</option>
              </select>
            </div>
          </div>


          <div className="flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 bg-white p-2 shadow-sm shadow-neutral-900/5 lg:hidden">
            <span className="pl-2 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
              Grade mobile
            </span>
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-neutral-100 p-1">
              <button
                type="button"
                onClick={() => setMobileGridMode("single")}
                aria-pressed={mobileGridMode === "single"}
                className={`flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-black transition-all ${
                  mobileGridMode === "single"
                    ? "bg-white text-[#8f5e59] shadow-sm"
                    : "text-neutral-500 hover:text-neutral-800"
                }`}
              >
                <Rows3 className="h-4 w-4" />
                1
              </button>
              <button
                type="button"
                onClick={() => setMobileGridMode("compact")}
                aria-pressed={mobileGridMode === "compact"}
                className={`flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-black transition-all ${
                  mobileGridMode === "compact"
                    ? "bg-white text-[#8f5e59] shadow-sm"
                    : "text-neutral-500 hover:text-neutral-800"
                }`}
              >
                <Grid2X2 className="h-4 w-4" />
                4
              </button>
            </div>
          </div>
        </header>

        {isLoading ? (
          <CatalogSkeleton />
        ) : loadError ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="catalog-panel-surface flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed rounded-2xl backdrop-blur-sm"
          >
            <div className="w-16 h-16 bg-[#fbf4f3] rounded-full flex items-center justify-center text-[#c98f86] mb-4">
              <PackageX className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-neutral-800 mb-2 uppercase tracking-wide">
              Falha ao carregar
            </h3>
            <p className="text-sm text-neutral-500 max-w-md">{loadError}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 px-6 py-2 bg-[#f3dfdc] text-[#7c4f4a] font-bold rounded-lg text-sm hover:bg-[#ead0cb] transition-colors"
            >
              Tentar novamente
            </button>
          </motion.div>
        ) : sortedProducts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="catalog-panel-surface flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed rounded-2xl backdrop-blur-sm"
          >
            <div className="w-16 h-16 bg-[#fbf4f3] rounded-full flex items-center justify-center text-[#c98f86] mb-4">
              <PackageX className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-neutral-800 mb-2 uppercase tracking-wide">
              {searchTerm
                ? "Nenhum resultado encontrado"
                : activeCategory
                  ? `Sem produtos em ${activeCategoryLabel}`
                  : "Catalogo vazio no momento"}
            </h3>
            <p className="text-sm text-neutral-500 max-w-md">
              {searchTerm
                ? `Nao encontramos nenhum produto que bata com "${searchTerm}". Tente usar termos diferentes.`
                : "Ainda nao temos produtos reais cadastrados nesta selecao. Adicione seus produtos ao painel para visualiza-los aqui."}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="mt-6 px-6 py-2 bg-[#f3dfdc] text-[#7c4f4a] font-bold rounded-lg text-sm hover:bg-[#ead0cb] transition-colors"
              >
                Limpar busca
              </button>
            )}
          </motion.div>
        ) : (
          <div className="flex flex-col flex-1">
            {campaignFocusProducts.length > 0 && (
              <section className="mb-6 rounded-2xl border border-[#ead5d2] bg-white p-4 shadow-sm shadow-[#c98f86]/10 lg:p-5">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#9d6a63]">Campanha ativa</p>
                    <h3 className="mt-1 text-lg font-black uppercase tracking-tight text-neutral-900">{campaignFocusTitle}</h3>
                  </div>
                  <span className="w-fit rounded-full bg-[#fbf4f3] px-3 py-1 text-[11px] font-black uppercase tracking-widest text-[#8f5e59]">
                    {campaignFocusProducts.length} produtos em foco
                  </span>
                </div>
                <div className={focusGridClass}>
                  <AnimatePresence mode="popLayout">
                    {campaignFocusProducts.map((product, index) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.22, ease: "easeInOut" }}
                        layout
                      >
                        <ProductCard product={product} priority={index < 4} compact={isCompactMobileGrid} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </section>
            )}

            {paginatedProducts.length > 0 && (
              <div className={productGridClass}>
                <AnimatePresence mode="popLayout">
                  {paginatedProducts.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.22, ease: "easeInOut" }}
                      layout
                    >
                      <ProductCard product={product} priority={campaignFocusProducts.length === 0 && currentPage === 1 && index < 4} compact={isCompactMobileGrid} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            {regularSortedProducts.length > itemsPerPage && (
              <div className="mt-auto flex flex-col items-center justify-center gap-3 border-t border-neutral-200 pt-6 sm:flex-row sm:gap-4">
                <button
                  onClick={() => setCatalogPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex max-w-full flex-wrap items-center justify-center gap-2">
                  {paginationItems.map((item) =>
                    typeof item === "number" ? (
                      <button
                        key={item}
                        onClick={() => setCatalogPage(item)}
                        className={`h-10 min-w-10 rounded-lg px-3 text-sm font-bold transition-colors ${
                          currentPage === item
                            ? "bg-[#8f5e59] text-white shadow-md"
                            : "border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 hover:text-[#7c4f4a]"
                        }`}
                        aria-current={currentPage === item ? "page" : undefined}
                      >
                        {item}
                      </button>
                    ) : (
                      <span
                        key={item}
                        className="flex h-10 min-w-10 items-center justify-center rounded-lg border border-transparent px-2 text-sm font-bold text-neutral-400"
                      >
                        ...
                      </span>
                    )
                  )}
                </div>
                <span className="order-first text-xs font-bold uppercase tracking-widest text-neutral-400 sm:order-none">
                  Pagina {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() => setCatalogPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-50 disabled:hover:bg-white transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  </div>
  );
}
