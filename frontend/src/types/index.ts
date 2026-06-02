export interface Product {
  id: string;
  slug?: string | null;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  campaign?: ProductCampaign | null;
  isFeatured?: boolean;
  isNew?: boolean;
  createdAt?: string;
  relevanceScore?: number;
  relevanceUnitsSold?: number;
  relevanceOrderCount?: number;
  imageUrl: string;
  images?: string[];
  category: string;
  categoryId?: string;
  subcategoryId?: string | null;
  brandLabel?: string;
  features?: string[];
  stockQuantity?: number;
  variantsEnabled?: boolean;
  variants?: ProductVariant[];
}

export interface ProductCampaign {
  id: string;
  name: string;
  badgeLabel: string;
  startsAt?: string | null;
  endsAt?: string | null;
  discountType: 'none' | 'percent' | 'fixed' | 'override_price';
  discountValue: number;
  originalPrice: number;
  finalPrice: number;
  priority: number;
}

export interface ProductVariant {
  id: string;
  label: string;
  sku?: string;
  options: Array<{ name: string; value: string }>;
  price?: number | null;
  stockQuantity: number;
  isActive: boolean;
}

export interface CartItem {
  key: string;
  product: Product;
  variant?: ProductVariant | null;
  quantity: number;
}

export interface CheckoutData {
  fullName: string;
  phone: string;
  fulfillmentType: 'delivery' | 'pickup';
  paymentMethod: 'cash' | 'pix' | 'card';
  cep: string;
  address: string;
  number: string;
  complement: string;
  neighborhood: string;
  region: string;
  city: string;
  state: string;
  referencePoint: string;
}
