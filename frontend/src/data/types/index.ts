export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  effectivePrice: number;
  currency: string;
  categoryId: string;
  collectionIds: string[];
  images: string[];
  fileFormats: string[];
  fileSizeMb?: number;
  license: string;
  isFeatured: boolean;
  isPublished: boolean;
  createdAt: string;
  discountPercent?: number;
  avgRating?: number;
  reviewCount?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  productCount?: number;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description?: string;
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
}

export interface StatusEntry {
  status: number;
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
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface Wilaya {
  id: string;
  name: string;
  code: number;
}
