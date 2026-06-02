import { useState, useMemo, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { Grid2X2, Rows3, Search, ChevronDown, ChevronLeft, ChevronRight, PackageX, Menu, X } from "lucide-react";
import { ProductCard } from "./ProductCard";
import { CatalogSortOption, sortCatalogProducts } from "./catalogSort";
import { getCatalogSampleImage } from "./catalogSampleImages";
import { useStore } from "../../store/useStore";
import { getPublicCatalogBootstrap } from "../../services/catalogService";
import { Product } from "../../types";
import { BrandLogo } from "../brand/BrandLogo";
import { usePublicSettings } from "../../hooks/usePublicSettings";

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
  const { activeCategory, setActiveCategory } = useStore();
  const settings = usePublicSettings();
  const catalogScrollRef = useRef<HTMLDivElement | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
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
    catalogScrollRef.current?.scrollTo({ top: 0, left: 0, behavior: "auto" });
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
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

    return () => {
      desktopQuery.removeEventListener("change", syncSidebarMode);
    };
  }, []);

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

  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage) || 1;
  const paginationItems = buildPaginationItems(currentPage, totalPages);
  const isCompactMobileGrid = mobileGridMode === "compact";
  const productGridClass = isCompactMobileGrid
    ? "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 lg:gap-6 content-start mb-10 border-t border-neutral-200 pt-6"
    : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6 content-start mb-10 border-t border-neutral-200 pt-6";
  const paginatedProducts = sortedProducts.slice(
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

  return (
    <div className="catalog-brand-surface relative w-full flex-1 flex overflow-hidden">
      <div className="absolute inset-0 dot-pattern opacity-60 pointer-events-none" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white/90 to-transparent" />

      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-neutral-900/50 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-[60]
          bg-white lg:bg-white/95 lg:backdrop-blur-md
          border-r border-neutral-200
          transition-all duration-300 ease-in-out shrink-0 overflow-visible
          ${
            isSidebarOpen
              ? "translate-x-0 w-[min(20rem,calc(100vw-1rem))] shadow-2xl pointer-events-auto"
              : "-translate-x-full w-[min(20rem,calc(100vw-1rem))] border-r-0 opacity-0 pointer-events-none"
          }
          lg:translate-x-0 lg:border-r lg:opacity-100 lg:pointer-events-auto lg:shadow-none
          ${isSidebarCollapsed ? "lg:w-20" : "lg:w-72"}
        `}
      >
        <button
          type="button"
          onClick={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
          className="absolute -right-4 top-24 z-20 hidden h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-[#8f5e59] shadow-md shadow-neutral-900/10 transition-all hover:border-[#ead5d2] hover:bg-neutral-50 lg:flex"
          aria-label={isSidebarCollapsed ? "Expandir categorias" : "Recolher categorias"}
          title={isSidebarCollapsed ? "Expandir categorias" : "Recolher categorias"}
        >
          {isSidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>

        <div className={`w-[min(20rem,calc(100vw-1rem))] ${isSidebarCollapsed ? "lg:w-20" : "lg:w-72"} flex h-full flex-col overflow-hidden`}>
          <div className={`flex min-h-[92px] items-center bg-white px-5 ${isSidebarCollapsed ? "justify-center lg:px-3" : "justify-start lg:px-5"}`}>
            {!isSidebarCollapsed ? (
              <div className="min-w-0">
                <BrandLogo imageClassName="h-14 w-36 object-contain object-left" />
              </div>
            ) : (
              <div
                className="flex h-14 w-14 items-center justify-center overflow-hidden"
                title={storeName}
                aria-label={storeName}
              >
                <BrandLogo imageClassName="h-14 w-14 object-contain object-center" />
              </div>
            )}
          </div>

          <div className={`border-b border-neutral-100 bg-white/95 px-5 py-5 ${isSidebarCollapsed ? "hidden" : "lg:px-5"}`}>
            <div className={`flex items-center gap-3 ${isSidebarCollapsed ? "lg:justify-center" : "justify-between"}`}>
              <div className="min-w-0">
                <h3 className="text-[11px] font-black text-[#7c4f4a] uppercase tracking-[0.22em]">
                  Categorias
                </h3>
                <p className="mt-1 truncate text-xs text-neutral-500">
                  Navegue por linha e tipo de produto
                </p>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-neutral-500 shadow-sm shadow-neutral-900/5 transition-colors hover:border-[#ead5d2] hover:bg-neutral-50 hover:text-[#8f5e59] lg:hidden"
                aria-label="Fechar painel"
              >
                <X className="w-3.5 h-3.5" />
                Fechar
              </button>
            </div>
          </div>

          <div className={`flex-1 overflow-y-auto py-5 custom-scrollbar ${isSidebarCollapsed ? "px-4 lg:px-2" : "px-4"}`}>
            <div className={`${isSidebarCollapsed ? "hidden" : ""} flex flex-col gap-3`}>
              {isLoading &&
                Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-12 animate-pulse rounded-xl bg-neutral-100" />
                ))}

              {!isLoading && (
                <>
                  <button
                    onClick={() => {
                      selectCategory(null);
                    }}
                    className={`group flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all ${
                      activeCategory === null
                        ? "border-[#ead5d2] bg-white text-[#7c4f4a] font-black shadow-sm shadow-neutral-900/5"
                        : "border-neutral-100 bg-white text-neutral-700 hover:border-[#f0dddd] hover:bg-neutral-50 hover:text-[#7c4f4a]"
                    }`}
                  >
                    <span className="min-w-0 truncate">Todos os Itens</span>
                    <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-bold text-neutral-500">
                      {storeProducts.length}
                    </span>
                  </button>

                  {rootCategories.map((category) => {
                    const subcategories = subcategoriesByParent[category.id] ?? [];
                    const isCategoryActive = activeCategory === category.id;
                    const hasSubcategories = subcategories.length > 0;
                    const isExpanded = expandedCategoryIds.has(category.id);

                    return (
                      <div key={category.id} className="catalog-panel-surface rounded-2xl border p-2">
                        <button
                          onClick={() => {
                            if (hasSubcategories) toggleCategoryDropdown(category.id);
                            selectCategory(category.id);
                          }}
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-all ${
                            isCategoryActive
                              ? "bg-[#fbf4f3] text-[#7c4f4a] shadow-sm"
                              : "text-neutral-700 hover:bg-neutral-50 hover:text-[#7c4f4a]"
                          }`}
                          title={category.name}
                        >
                          <span className={`h-8 w-1 rounded-full ${isCategoryActive ? "bg-[#c98f86]" : "bg-neutral-200"}`} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-bold">{category.name}</span>
                            {subcategories.length > 0 && (
                              <span className="mt-0.5 block text-[11px] font-medium text-neutral-400">
                                {subcategories.length} subcategorias
                              </span>
                            )}
                          </span>
                          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-bold text-neutral-500">
                            {categoryProductCounts[category.id] ?? 0}
                          </span>
                          {hasSubcategories && (
                            <ChevronDown
                              className={`h-4 w-4 shrink-0 text-neutral-400 transition-transform ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            />
                          )}
                        </button>

                        {hasSubcategories && isExpanded && (
                          <div className="mt-1 flex flex-col gap-1 border-l border-[#ead5d2] pl-3">
                            {subcategories.map((subcategory) => {
                              const isSubcategoryActive = activeCategory === subcategory.id;

                              return (
                                <button
                                  key={subcategory.id}
                                  onClick={() => {
                                    selectCategory(subcategory.id);
                                  }}
                                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-all ${
                                    isSubcategoryActive
                                      ? "bg-[#fbf4f3] text-[#7c4f4a] font-bold"
                                      : "text-neutral-600 hover:bg-neutral-50 hover:text-[#7c4f4a]"
                                  }`}
                                  title={subcategory.name}
                                >
                                  <span className="min-w-0 truncate">{subcategory.name}</span>
                                  <span className="shrink-0 rounded-full bg-neutral-50 px-2 py-0.5 text-[10px] font-bold text-neutral-400">
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
                </>
              )}
            </div>

          </div>
        </div>
      </aside>

      <div
        ref={catalogScrollRef}
        className={`relative z-10 flex h-full flex-1 flex-col overflow-y-auto p-4 transition-[margin] duration-300 custom-scrollbar lg:p-12 ${
          isSidebarCollapsed ? "lg:ml-20" : "lg:ml-72"
        }`}
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

          <div className="w-full lg:w-96 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por nome ou descricao..."
              disabled={isLoading}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-[#c98f86] focus:ring-1 focus:ring-[#c98f86] transition-colors shadow-sm shadow-neutral-900/5 disabled:bg-neutral-100 disabled:text-neutral-400"
            />
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
            <div className={productGridClass}>
              {paginatedProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  layout
                >
                  <ProductCard product={product} priority={currentPage === 1 && index < 4} compact={isCompactMobileGrid} />
                </motion.div>
              ))}
            </div>

            {totalPages > 1 && (
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
  );
}
