import { ShoppingCart } from "lucide-react";
import { memo, type MouseEvent, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Product } from "../../types";
import { useStore } from "../../store/useStore";

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

export const ProductCard = memo(function ProductCard({ product, priority = false }: ProductCardProps) {
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
    <div onClick={openProduct} className="group flex flex-col h-full bg-white border border-neutral-200 rounded-2xl overflow-hidden hover:-translate-y-1.5 hover:shadow-xl hover:shadow-purple-500/10 hover:border-purple-600 transition-all duration-300 cursor-pointer">
      <div className="relative aspect-square overflow-hidden bg-neutral-100 border-b border-neutral-100">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            fetchPriority={priority ? "high" : "auto"}
            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-400">
            Sem Imagem
          </div>
        )}
        <div className="absolute top-3 left-3">
          <span className="px-2 py-1 bg-gradient-to-r from-purple-800 to-purple-500 font-bold uppercase tracking-widest text-[9px] rounded text-white shadow-sm">
            {product.category}
          </span>
        </div>
        {wasAdded && (
          <div className="absolute bottom-3 left-3 right-3 px-3 py-2 rounded-lg bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-widest text-center shadow-lg">
            Adicionado ao carrinho
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1">
        {product.brandLabel && (
          <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-neutral-700">
            {product.brandLabel}
          </p>
        )}
        <h3 className="font-bold text-base text-neutral-900 leading-tight mb-2 group-hover:text-purple-700 transition-colors">
          {product.name}
        </h3>
        <p className="text-xs text-neutral-500 mb-4 flex-1 line-clamp-3">
          {product.description}
        </p>

        <div className="flex items-end justify-between mt-auto">
          <div className="flex flex-col">
            <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-bold">Por apenas</span>
            <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-800 to-purple-500">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
            </span>
          </div>

          <button
            onClick={handleAdd}
            className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-800 to-purple-500 text-white flex items-center justify-center hover:from-purple-700 hover:to-purple-400 hover:scale-105 active:scale-95 transition-all shadow-md shadow-purple-500/20"
            aria-label={product.variantsEnabled ? "Escolher variacao" : "Adicionar ao carrinho"}
          >
            <ShoppingCart className="w-4 h-4 ml-[-2px]" />
          </button>
        </div>
      </div>
    </div>
  );
});
