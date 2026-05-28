import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, Product, ProductVariant } from '../types';

interface StoreState {
  activeTab: 'inicio' | 'catalogo' | 'contato';
  setActiveTab: (tab: 'inicio' | 'catalogo' | 'contato') => void;
  activeCategory: string | null;
  setActiveCategory: (category: string | null) => void;
  cart: CartItem[];
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (product: Product, variant?: ProductVariant | null, quantity?: number) => void;
  removeFromCart: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  clearCart: () => void;
}

function getCartKey(productId: string, variant?: ProductVariant | null) {
  return variant?.id ? `${productId}:${variant.id}` : productId;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      activeTab: 'inicio',
      setActiveTab: (tab) => set({ activeTab: tab }),
      activeCategory: null,
      setActiveCategory: (category) => set({ activeCategory: category }),
      cart: [],
      isCartOpen: false,
      openCart: () => set({ isCartOpen: true }),
      closeCart: () => set({ isCartOpen: false }),
      addToCart: (product, variant = null, quantity = 1) => set((state) => {
        const key = getCartKey(product.id, variant);
        const existing = state.cart.find(item => item.key === key);
        if (existing) {
          return { cart: state.cart.map(item => item.key === key ? { ...item, quantity: item.quantity + quantity } : item) };
        }
        return { cart: [...state.cart, { key, product, variant, quantity }] };
      }),
      removeFromCart: (key) => set((state) => ({ cart: state.cart.filter(item => item.key !== key) })),
      updateQuantity: (key, quantity) => set((state) => ({
        cart: state.cart.map(item => item.key === key ? { ...item, quantity } : item)
      })),
      clearCart: () => set({ cart: [] }),
    }),
    {
      name: 'mk-maker-cart',
      // Persiste somente o carrinho; estado de UI fica apenas em memória
      partialize: (state) => ({ cart: state.cart }),
    }
  )
);
