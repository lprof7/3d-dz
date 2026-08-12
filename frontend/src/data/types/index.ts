export interface LocalizedString {
  ar?: string;
  en?: string;
  fr?: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string | LocalizedString;
  description: string | LocalizedString;
  price: number;
  effectivePrice: number;
  currency: string;
  categoryId: string;
  collectionIds: string[];
  images: string[];
  fileFormats: string[];
  fileSizeMb?: number;
  modelUrl?: string;
  modelFormat?: string;
  license: string;
  isFeatured: boolean;
  isPublished: boolean;
  isDeleted: boolean;
  createdAt: string;
  discountPercent?: number;
  discountStart?: string;
  discountEnd?: string;
  avgRating?: number;
  reviewCount?: number;
}

export interface Category {
  id: string;
  name: string | LocalizedString;
  slug: string;
  description?: string | LocalizedString;
  imageUrl?: string;
  productCount?: number;
}

export interface Collection {
  id: string;
  name: string | LocalizedString;
  slug: string;
  description?: string | LocalizedString;
  imageUrl?: string;
}

export interface Customer {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  isBanned: boolean;
  createdAt: string;
}

export interface Order {
  id: string;
  reference: string;
  customerId: string;
  customerFullName: string;
  customerEmail: string;
  customerPhone: string;
  wilayaCode: number;
  wilayaName: string;
  items: OrderItem[];
  total: number;
  subTotal: number;
  status: number;
  internalNotes?: InternalNote[];
  statusHistory?: StatusEntry[];
  createdAt: string;
}

export interface InternalNote {
  text: string;
  createdAt: string;
  adminId?: string;
  status?: number;
}

export interface StatusEntry {
  status?: number;
  text: string;
  createdAt: string;
  adminId?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface Review {
  id: string;
  productId?: string;
  orderId?: string;
  rating: number;
  comment: string;
  customerName: string;
  status?: number;
  createdAt: string;
}

export interface Banner {
  id: string;
  title: string | LocalizedString;
  subtitle?: string | LocalizedString;
  imageUrl: string;
  linkUrl?: string;
  ctaText?: string | LocalizedString;
  active: boolean;
  sortOrder: number;
}

export interface Wilaya {
  id: string;
  name: string | LocalizedString;
  code: number;
}

export interface DownloadableProduct {
  productId: string;
  productName: string | LocalizedString;
  images: string[];
  modelUrl: string;
  modelFormat?: string;
  fileFormats: string[];
  fileSizeMb?: number;
  license: string;
}
