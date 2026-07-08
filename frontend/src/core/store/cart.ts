import { create } from 'zustand';
import api from '../api/client';

export interface CartItem {
  productId: string;
  quantity: number;
  price: number;
  productName: string;
  imageUrl: string;
}

interface CartState {
  items: CartItem[];
  total: number;
  loading: boolean;
  fetchCart: () => Promise<void>;
  addItem: (productId: string, qty?: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => void;
  itemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  total: 0,
  loading: false,

  fetchCart: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get('/cart');
      set({ items: data.items || [], total: data.total || 0, loading: false });
    } catch { set({ loading: false }); }
  },

  addItem: async (productId, qty = 1) => {
    const token = localStorage.getItem('token');
    if (!token) { window.location.href = '/auth?mode=login'; return; }
    await api.post('/cart/add', { productId, qty });
    get().fetchCart();
  },

  removeItem: async (productId) => {
    await api.delete(`/cart/${productId}`);
    get().fetchCart();
  },

  updateQuantity: async (productId, quantity) => {
    if (quantity < 1) { get().removeItem(productId); return; }
    await api.post('/cart/update', { productId, qty: quantity });
    get().fetchCart();
  },

  clearCart: async () => {
    try { await api.post('/cart/clear'); } catch { /* ignore */ }
    set({ items: [], total: 0 });
  },
  itemCount: () => get().items.reduce((s, i) => s + i.quantity, 0)
}));
