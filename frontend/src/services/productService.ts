import { apiRequest } from './apiClient';
import { Product } from '../modules/products/store/useProductStore';

export async function listPublicProducts() {
  return apiRequest<Product[]>('/api/products');
}

export async function listAdminProducts() {
  return apiRequest<Product[]>('/api/products/admin', { auth: true });
}

export async function createProduct(product: Omit<Product, 'id' | 'created_at'>) {
  return apiRequest<Product>('/api/products', {
    method: 'POST',
    auth: true,
    body: JSON.stringify(product),
  });
}

export async function updateProduct(id: string, product: Partial<Product>) {
  return apiRequest<Product>(`/api/products/${id}`, {
    method: 'PUT',
    auth: true,
    body: JSON.stringify(product),
  });
}

export async function deleteProduct(id: string) {
  return apiRequest<{ ok: true }>(`/api/products/${id}`, {
    method: 'DELETE',
    auth: true,
  });
}

export async function toggleProductStatus(id: string, field: 'isActive' | 'isFeatured' | 'isPromo' | 'isNew') {
  return apiRequest<Product>(`/api/products/${id}/status`, {
    method: 'PATCH',
    auth: true,
    body: JSON.stringify({ field }),
  });
}

export async function updateProductVisibility(id: string, updates: Partial<Pick<Product, 'isActive' | 'isFeatured' | 'isPromo' | 'isNew' | 'catalogStatus'>>) {
  return apiRequest<Product>(`/api/products/${id}/visibility`, {
    method: 'PATCH',
    auth: true,
    body: JSON.stringify(updates),
  });
}

export async function bulkUpdateProductVisibility(productIds: string[], updates: Partial<Pick<Product, 'isActive' | 'isFeatured' | 'isPromo' | 'isNew' | 'catalogStatus'>>) {
  return apiRequest<Product[]>('/api/products/bulk/visibility', {
    method: 'PATCH',
    auth: true,
    body: JSON.stringify({ productIds, ...updates }),
  });
}

export async function bulkUpdateProductStock(productIds: string[], stockQuantity: number) {
  return apiRequest<Product[]>('/api/products/bulk/stock', {
    method: 'PATCH',
    auth: true,
    body: JSON.stringify({ productIds, stockQuantity }),
  });
}
