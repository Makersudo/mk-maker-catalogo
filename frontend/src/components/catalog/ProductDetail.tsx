import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Minus, Plus, ShoppingCart, Timer } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { getPublicCatalogBootstrap, PublicCatalogProduct } from "../../services/catalogService";
import { useStore } from "../../store/useStore";
import { Product } from "../../types";
import { ProductCard } from "./ProductCard";
import { getCatalogSampleImage } from "./catalogSampleImages";
import {
  getActiveVariants,
  getInitialSelectedVariantId,
  getTotalAvailableStock,
  getVisibleVariantOptions,
} from "./productOptions";

function toStoreProduct(product: PublicCatalogProduct): Product {
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
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function calculateCampaignPrice(basePrice: number, product: Product | null) {
  const campaign = product?.campaign;
  if (!campaign) return basePrice;
  const value = Math.max(0, Number(campaign.discountValue || 0));

  if (campaign.discountType === "percent") return Math.max(0, basePrice * (1 - Math.min(value, 100) / 100));
  if (campaign.discountType === "fixed") return Math.max(0, basePrice - value);
  if (campaign.discountType === "override_price" && !product?.variantsEnabled) return campaign.finalPrice;
  return basePrice;
}

type ProductDetailTitleBlockProps = {
  category: string;
  name: string;
  className?: string;
};

function ProductDetailTitleBlock({ category, name, className = "" }: ProductDetailTitleBlockProps) {
  return (
    <div className={className}>
      <p className="text-xs font-bold uppercase tracking-widest text-[#9d6a63]">{category}</p>
      <h1 className="mt-2 text-3xl md:text-4xl font-black tracking-tight text-neutral-900">{name}</h1>
    </div>
  );
}

function DetailCampaignCountdown({ endsAt }: { endsAt: string }) {
  const [remainingMs, setRemainingMs] = useState(() => Math.max(0, new Date(endsAt).getTime() - Date.now()));

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemainingMs(Math.max(0, new Date(endsAt).getTime() - Date.now()));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [endsAt]);

  const totalSeconds = Math.floor(remainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#fbf4f3] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#7c4f4a]">
      <Timer className="h-3 w-3" />
      {remainingMs > 0
        ? `Termina em ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`
        : "Oferta encerrando"}
    </span>
  );
}

export function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const addToCart = useStore((state) => state.addToCart);
  const openCart = useStore((state) => state.openCart);
  const [product, setProduct] = useState<Product | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [cartFeedback, setCartFeedback] = useState("");
  const cartFeedbackTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (cartFeedbackTimeoutRef.current) window.clearTimeout(cartFeedbackTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    setError("");
    setQuantity(1);
    setCartFeedback("");
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    getPublicCatalogBootstrap()
      .then(({ products }) => {
        if (!mounted) return;
        const found = products.find((item) => item.slug === slug || item.id === slug);
        if (!found) {
          setError("Produto nao encontrado.");
          return;
        }
        const mapped = toStoreProduct(found);
        setAllProducts(products.map(toStoreProduct));
        setProduct(mapped);
        setSelectedVariantId(getInitialSelectedVariantId(mapped));
      })
      .catch(() => {
        if (mounted) setError("Nao foi possivel carregar o produto agora.");
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [slug]);

  const activeVariants = useMemo(() => getActiveVariants(product), [product]);
  const visibleVariantOptions = useMemo(() => getVisibleVariantOptions(product), [product]);
  const selectedVariant = activeVariants.find((variant) => variant.id === selectedVariantId) ?? null;
  const suggestedProducts = useMemo(() => {
    if (!product) return [];
    const sameCategory = allProducts.filter((item) => item.id !== product.id && item.categoryId === product.categoryId);
    const sameSubcategory = allProducts.filter((item) => item.id !== product.id && item.subcategoryId === product.subcategoryId);
    const merged = [...sameSubcategory, ...sameCategory, ...allProducts.filter((item) => item.id !== product.id)];
    return merged.filter((item, index, list) => list.findIndex((candidate) => candidate.id === item.id) === index).slice(0, 4);
  }, [allProducts, product]);
  const currentOriginalPrice = selectedVariant?.price ?? product?.originalPrice ?? product?.price ?? 0;
  const currentPrice = selectedVariant ? calculateCampaignPrice(Number(selectedVariant.price ?? product?.price ?? 0), product) : product?.price ?? 0;
  const totalAvailableStock = getTotalAvailableStock(product);
  const hasVariants = activeVariants.length > 0;
  const baseStockQuantity = product?.stockQuantity ?? 0;
  const hasManagedBaseStock = baseStockQuantity > 0;
  const availableQuantity = selectedVariant
    ? selectedVariant.stockQuantity
    : hasManagedBaseStock ? baseStockQuantity : 99;
  const canAddToCart = hasVariants ? Boolean(selectedVariant && availableQuantity > 0) : true;
  const availabilityLabel = hasVariants
    ? totalAvailableStock > 0 ? `${totalAvailableStock} disponivel` : "Indisponivel"
    : hasManagedBaseStock ? `${baseStockQuantity} disponivel` : "Sob confirmacao";

  useEffect(() => {
    const maxQuantity = Math.max(1, availableQuantity);
    setQuantity((current) => Math.min(Math.max(1, current), maxQuantity));
  }, [availableQuantity]);

  const addSelectedToCart = (openCheckout: boolean) => {
    if (!product || !canAddToCart) return;
    const pricedVariant = selectedVariant ? { ...selectedVariant, price: currentPrice } : selectedVariant;
    addToCart(product, pricedVariant, quantity);
    if (openCheckout) {
      openCart();
      return;
    }
    setCartFeedback("Produto adicionado. Voce pode continuar comprando.");
    if (cartFeedbackTimeoutRef.current) window.clearTimeout(cartFeedbackTimeoutRef.current);
    cartFeedbackTimeoutRef.current = window.setTimeout(() => setCartFeedback(""), 2200);
  };

  if (isLoading) {
    return <div className="catalog-brand-surface flex-1 p-8 text-neutral-500">Carregando produto...</div>;
  }

  if (error || !product) {
    return (
      <div className="catalog-brand-surface flex-1 p-8">
        <button onClick={() => navigate("/catalogo")} className="inline-flex items-center gap-2 text-sm font-bold text-[#8f5e59]">
          <ArrowLeft className="w-4 h-4" /> Voltar ao catalogo
        </button>
        <p className="mt-8 text-neutral-600">{error || "Produto nao encontrado."}</p>
      </div>
    );
  }

  return (
    <div className="catalog-brand-surface flex-1">
      <div className="max-w-6xl mx-auto px-4 pb-24 pt-28 md:pb-10 md:pt-32">
        <button onClick={() => navigate("/catalogo")} className="inline-flex items-center gap-2 mb-6 text-xs font-bold uppercase tracking-widest text-neutral-500 hover:text-[#8f5e59]">
          <ArrowLeft className="w-4 h-4" /> Voltar ao catalogo
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="flex flex-col gap-5">
            <ProductDetailTitleBlock category={product.category} name={product.name} className="lg:hidden" />

            <div className="product-photo-surface flex h-[52vh] min-h-[300px] max-h-[720px] items-center justify-center overflow-hidden rounded-2xl border border-neutral-200 p-4 shadow-lg shadow-neutral-900/5 sm:h-[58vh] sm:min-h-[340px] sm:p-6 lg:h-[62vh]">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  loading="eager"
                  decoding="async"
                  className="h-full w-full object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-neutral-400">Sem imagem</div>
              )}
            </div>

            <section className="catalog-panel-surface border rounded-2xl p-5">
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#9d6a63] mb-3">Descrição do produto</h2>
              <p className="text-sm leading-6 text-neutral-600">{product.description}</p>
            </section>
          </div>

          <section className="flex flex-col gap-6">
            <ProductDetailTitleBlock category={product.category} name={product.name} className="hidden lg:block" />

            {product.features && product.features.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {product.features.map((feature) => (
                  <span key={feature} className="px-3 py-2 rounded-lg bg-white/90 border border-[#f0dddd] text-xs font-semibold text-neutral-600 shadow-sm shadow-neutral-900/5">
                    {feature}
                  </span>
                ))}
              </div>
            )}

            <div className="catalog-panel-surface border rounded-2xl p-5 flex flex-col gap-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-bold">Valor</span>
                  {product.campaign && currentOriginalPrice > currentPrice && (
                    <p className="text-sm font-bold text-neutral-400 line-through">{formatPrice(currentOriginalPrice)}</p>
                  )}
                  <p className="text-2xl font-black text-[#8f5e59]">{formatPrice(currentPrice)}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${totalAvailableStock > 0 ? "bg-emerald-50 text-emerald-700" : "bg-neutral-100 text-neutral-600"}`}>
                  {availabilityLabel}
                </span>
              </div>
              {product.campaign && (
                <div className="rounded-xl border border-[#ead5d2] bg-white px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="rounded-full bg-[#8f5e59] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
                      {product.campaign.badgeLabel}
                    </span>
                    {product.campaign.endsAt && <DetailCampaignCountdown endsAt={product.campaign.endsAt} />}
                  </div>
                  <p className="mt-2 text-xs font-semibold text-neutral-500">{product.campaign.name}</p>
                </div>
              )}
              <div className="rounded-xl border border-[#f0dddd] bg-[#fbf4f3]/70 px-4 py-3">
                <span className="text-[10px] text-[#9d6a63] uppercase tracking-widest font-bold">Estoque total do produto</span>
                <p className="mt-1 text-sm font-bold text-neutral-800">
                  {hasVariants || hasManagedBaseStock
                    ? totalAvailableStock > 0 ? `${totalAvailableStock} unidades disponiveis` : "Sem estoque disponivel"
                    : "Estoque confirmado no atendimento"}
                </p>
              </div>

              {visibleVariantOptions.length > 0 && (
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Variacoes</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {visibleVariantOptions.map((option) => {
                      const isSelected = selectedVariantId === option.id;

                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => {
                            if (!option.isAvailable) return;
                            setSelectedVariantId(option.id);
                            setQuantity(1);
                          }}
                          disabled={!option.isAvailable}
                          aria-pressed={isSelected}
                          className={`min-h-[74px] rounded-xl border px-4 py-3 text-left transition-all ${
                            isSelected
                              ? "border-[#8f5e59] bg-[#fbf4f3] text-[#6f4844] shadow-sm"
                              : "border-[#f0dddd] bg-white/70 text-neutral-700 hover:border-[#c98f86] hover:bg-white"
                          } disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:border-[#f0dddd] disabled:hover:bg-white/70`}
                        >
                          <span className="block text-sm font-bold">{option.title}</span>
                          <span className="mt-1 block text-xs text-neutral-500">
                            {formatPrice(option.price)} - estoque {option.stockQuantity}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">Quantidade</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={!canAddToCart || quantity <= 1} className="w-9 h-9 flex items-center justify-center rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed">
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center text-sm font-bold">{quantity}</span>
                  <button onClick={() => setQuantity(Math.min(Math.max(1, availableQuantity), quantity + 1))} disabled={!canAddToCart || quantity >= availableQuantity} className="w-9 h-9 flex items-center justify-center rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {cartFeedback && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-700">
                  {cartFeedback}
                </div>
              )}

              <div className="mobile-product-actions fixed inset-x-0 bottom-0 z-30 border-t border-neutral-200 bg-white/95 px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-[0_-16px_40px_rgba(15,23,42,0.08)] backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
                  <button onClick={() => addSelectedToCart(false)} disabled={!canAddToCart} className="w-full flex items-center justify-center gap-2 py-3.5 border border-[#ead5d2] bg-white text-[#8f5e59] font-bold text-sm uppercase tracking-tight rounded-xl hover:bg-[#fbf4f3] disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                    <Plus className="w-4 h-4" />
                    Adicionar e continuar
                  </button>
                  <button onClick={() => addSelectedToCart(true)} disabled={!canAddToCart} className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-[#6f4844] to-[#c98f86] text-white font-bold text-sm uppercase tracking-tight rounded-xl hover:from-[#7c4f4a] hover:to-[#d6a39b] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-[#c98f86]/20">
                    <ShoppingCart className="w-4 h-4" />
                    Comprar agora
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>

        {suggestedProducts.length > 0 && (
          <section className="mt-12">
            <div className="flex items-end justify-between gap-4 mb-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#9d6a63]">Sugestões</p>
                <h2 className="text-2xl font-black tracking-tight text-neutral-900">Outros produtos para você</h2>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {suggestedProducts.map((suggestion) => (
                <ProductCard key={suggestion.id} product={suggestion} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
