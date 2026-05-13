// ── Shared TypeScript Types (Skill #3) ────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrls: string[];
  blurDataUrls: string[];
  categoryId: string;
  categoryName?: string;
  categorySlug?: string;
  brandId: string | null;
  brandName?: string | null;
  sku: string;
  mrp: number;
  price: number;
  unit: string;
  tags: string[];
  isFeatured: boolean;
  inStock: boolean;
  averageRating: number;
  reviewCount: number;
  metaTitle?: string | null;
  metaDescription?: string | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string;
  iconUrl: string | null;
  parentId: string | null;
  sortOrder: number;
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogImageUrl?: string | null;
  _count?: { products: number };
}

export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  weight?: number;
}

export interface Address {
  id: string;
  label: string;
  line1: string;
  line2?: string | null;
  landmark?: string | null;
  city: string;
  state: string;
  pincode: string;
  lat: number;
  lng: number;
  isDefault: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  estimatedDeliveryAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  items: OrderItem[];
  address: Address;
}

export interface OrderItem {
  id: string;
  productId: string;
  /** Flat fields returned by /api/orders */
  name: string;
  unit: string;
  slug: string;
  imageUrls: string[];
  quantity: number;
  unitPrice: number;
  weight?: number;
  total?: number;
  /** Legacy nested shape – kept for mock/static pages only */
  product?: Pick<Product, 'name' | 'imageUrls' | 'unit' | 'slug'>;
}

export type OrderStatus =
  | 'PLACED'
  | 'CONFIRMED'
  | 'PICKING'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface User {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  avatarUrl: string | null;
  referralCode: string | null;
  loyaltyPoints: number;
  walletBalance: number;
}

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'success' | 'error' | 'warning';
  duration?: number;
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
