import { create } from 'zustand';
import * as productService from '../../../services/productService';

export interface Product {
  id: string;
  slug?: string | null;
  title: string;
  description: string;
  price: number;
  purchaseCost?: number;
  categoryId: string;
  subcategoryId?: string | null;
  audience?: string | null;
  brandLabel?: string;
  productType?: string;
  variation?: string | null;
  features?: string[];
  imagePrompt?: string;
  catalogStatus?: 'draft' | 'ready' | 'live';
  categoryName?: string | null;
  subcategoryName?: string | null;
  images: string[];
  isActive: boolean;
  isFeatured: boolean;
  isPromo: boolean;
  isNew: boolean;
  stockQuantity?: number;
  variantsEnabled?: boolean;
  variants?: ProductVariant[];
  created_at: string;
  updated_at?: string;
}

export interface ProductVariant {
  id?: string;
  label: string;
  sku?: string;
  options: Array<{ name: string; value: string }>;
  price?: number | null;
  stockQuantity: number;
  isActive: boolean;
}

interface ProductState {
  products: Product[];
  isLoading: boolean;
  error: string;
  fetchProducts: () => Promise<void>;
  addProduct: (product: Omit<Product, 'id' | 'created_at'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  toggleStatus: (id: string, field: 'isActive' | 'isFeatured' | 'isPromo' | 'isNew') => Promise<void>;
  updateVisibility: (id: string, updates: Partial<Pick<Product, 'isActive' | 'isFeatured' | 'isPromo' | 'isNew' | 'catalogStatus'>>) => Promise<void>;
  bulkUpdateVisibility: (productIds: string[], updates: Partial<Pick<Product, 'isActive' | 'isFeatured' | 'isPromo' | 'isNew' | 'catalogStatus'>>) => Promise<void>;
  bulkUpdateStock: (productIds: string[], stockQuantity: number) => Promise<void>;
}

export const useProductStore = create<ProductState>((set) => ({
  products: [],
  isLoading: false,
  error: '',
  fetchProducts: async () => {
    set({ isLoading: true, error: '' });
    try {
      const products = await productService.listAdminProducts();
      set({ products, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },
  addProduct: async (product) => {
    const created = await productService.createProduct(product);
    set((state) => ({ products: [created, ...state.products] }));
  },
  updateProduct: async (id, updates) => {
    const current = useProductStore.getState().products.find((product) => product.id === id);
    const updated = await productService.updateProduct(id, { ...current, ...updates });
    set((state) => ({
      products: state.products.map((product) => product.id === id ? updated : product),
    }));
  },
  deleteProduct: async (id) => {
    await productService.deleteProduct(id);
    set((state) => ({
      products: state.products.filter((product) => product.id !== id),
    }));
  },
  toggleStatus: async (id, field) => {
    const updated = await productService.toggleProductStatus(id, field);
    set((state) => ({
      products: state.products.map((product) => product.id === id ? updated : product),
    }));
  },
  updateVisibility: async (id, updates) => {
    const updated = await productService.updateProductVisibility(id, updates);
    set((state) => ({
      products: state.products.map((product) => product.id === id ? updated : product),
    }));
  },
  bulkUpdateVisibility: async (productIds, updates) => {
    const updatedProducts = await productService.bulkUpdateProductVisibility(productIds, updates);
    const updatedById = new Map(updatedProducts.map((product) => [product.id, product]));

    set((state) => ({
      products: state.products.map((product) => updatedById.get(product.id) ?? product),
    }));
  },
  bulkUpdateStock: async (productIds, stockQuantity) => {
    const updatedProducts = await productService.bulkUpdateProductStock(productIds, stockQuantity);
    const updatedById = new Map(updatedProducts.map((product) => [product.id, product]));

    set((state) => ({
      products: state.products.map((product) => updatedById.get(product.id) ?? product),
    }));
  },
}));
