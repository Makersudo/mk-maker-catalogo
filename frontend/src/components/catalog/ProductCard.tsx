import { ShoppingCart, Timer } from "lucide-react";
import { memo, type MouseEvent, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Product } from "../../types";
import { useStore } from "../../store/useStore";

interface ProductCardProps {
  product: Product;
  priority?: boolean;
  compact?: boolean;
}

export const ProductCard = memo(function ProductCard({ product, priority = false, compact = false }: ProductCardProps) {
  const addToCart = useStore((state) => state.addToCart);
  const navigate = useNavigate();
  const [wasAdded, setWasAdded] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const openProduct = () => {
    navigate(`/produto/${product.slug || product.id}`);
  };

  const handleAdd = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (product.variantsEnabled && product.variants && product.variants.length > 0) {
      openProduct();
      return;
    }
    addToCart(product);
    setWasAdded(true);
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setWasAdded(false), 1800);
  };

  return (
    <div onClick={openProduct} className="group flex flex-col h-full overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-all duration-300 cursor-pointer hover:-translate-y-1.5 hover:border-[#c98f86] hover:shadow-xl hover:shadow-[#c98f86]/10">
      <div className={`relative overflow-hidden border-b border-neutral-100 bg-white ${compact ? "aspect-square lg:aspect-[4/5]" : "aspect-[4/5]"}`}>
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            fetchPriority={priority ? "high" : "auto"}
            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className={`h-full w-full object-contain transition-transform duration-500 group-hover:scale-[1.03] ${
              compact ? "p-2 sm:p-3 lg:p-4" : "p-4"
            }`}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-400">
            Sem Imagem
          </div>
        )}
        {wasAdded && (
          <div className="absolute bottom-3 left-3 right-3 px-3 py-2 rounded-lg bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-widest text-center shadow-lg">
            Adicionado ao carrinho
          </div>
        )}
        {product.campaign && (
          <CampaignTagGroup
            product={product}
            compact={compact}
            className="absolute left-3 top-3 hidden flex-col gap-1 md:flex"
          />
        )}
      </div>

      <div className={`flex flex-1 flex-col ${compact ? "p-3 lg:p-5" : "p-5"}`}>
        {product.campaign && (
          <CampaignTagGroup
            product={product}
            compact={compact}
            className="mb-3 flex flex-wrap items-center gap-1.5 md:hidden"
          />
        )}
        <p className={`mb-1 font-black uppercase tracking-widest text-[#9d6a63] ${compact ? "line-clamp-1 text-[8px] lg:text-[9px]" : "text-[9px]"}`}>
          {product.category}
        </p>
        {product.brandLabel && (
          <p className={`mb-1 font-black uppercase tracking-widest text-neutral-900 ${compact ? "text-[9px] lg:text-[10px]" : "text-[10px]"}`}>
            {product.brandLabel}
          </p>
        )}
        <h3 className={`font-bold leading-tight text-neutral-900 transition-colors group-hover:text-[#7c4f4a] ${
          compact ? "mb-1 line-clamp-2 text-sm lg:mb-2 lg:text-base" : "mb-2 text-base"
        }`}>
          {product.name}
        </h3>
        <p className={`text-xs text-neutral-600 ${compact ? "mb-3 hidden flex-1 line-clamp-2 sm:block lg:mb-4 lg:line-clamp-3" : "mb-4 flex-1 line-clamp-3"}`}>
          {product.description}
        </p>

        <div className="mt-auto flex items-end justify-between gap-2">
          <div className="flex flex-col">
            <span className={`font-bold uppercase tracking-widest text-neutral-400 ${compact ? "text-[8px] lg:text-[10px]" : "text-[10px]"}`}>Por apenas</span>
            {product.campaign && product.originalPrice && product.originalPrice > product.price && (
              <span className={`text-neutral-400 line-through ${compact ? "text-[10px]" : "text-xs"}`}>
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.originalPrice)}
              </span>
            )}
            <span className={`font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#6f4844] to-[#c98f86] ${compact ? "text-sm lg:text-lg" : "text-lg"}`}>
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
            </span>
          </div>

          <button
            onClick={handleAdd}
            className={`shrink-0 rounded-full bg-gradient-to-r from-[#6f4844] to-[#c98f86] text-white flex items-center justify-center hover:from-[#7c4f4a] hover:to-[#d6a39b] hover:scale-105 active:scale-95 transition-all shadow-md shadow-[#c98f86]/20 ${
              compact ? "h-9 w-9 lg:h-10 lg:w-10" : "h-10 w-10"
            }`}
            aria-label={product.variantsEnabled ? "Escolher variacao" : "Adicionar ao carrinho"}
          >
            <ShoppingCart className="w-4 h-4 ml-[-2px]" />
          </button>
        </div>
      </div>
    </div>
  );
});

function CampaignTagGroup({
  product,
  compact,
  className,
}: {
  product: Product;
  compact: boolean;
  className: string;
}) {
  if (!product.campaign) return null;

  return (
    <div className={className}>
      <span className="w-fit rounded-full bg-[#8f5e59] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-md">
        {product.campaign.badgeLabel}
      </span>
      {product.campaign.endsAt && <CampaignCountdown endsAt={product.campaign.endsAt} compact={compact} />}
    </div>
  );
}

function CampaignCountdown({ endsAt, compact }: { endsAt: string; compact: boolean }) {
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
  const label = `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 font-black text-[#7c4f4a] shadow-sm ${compact ? "text-[9px]" : "text-[10px]"}`}>
      <Timer className="h-3 w-3" />
      {remainingMs > 0 ? label : "Encerrando"}
    </span>
  );
}
