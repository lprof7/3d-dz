import api from '../../core/api/client';
import type { Order, Review, Banner, Wilaya } from '../types';

export const orderRepo = {
  getAll: () => api.get('/admin/orders').then(r => r.data.items as Order[]),
  getById: (id: string) => api.get(`/admin/orders/${id}`).then(r => r.data as Order),
  getMyOrders: () => api.get('/orders/mine').then(r => r.data.items as Order[]),
  create: (data: { fullName: string; email: string; phone: string; wilayaCode: number; wilayaName: string }) =>
    api.post('/orders/place', data).then(r => r.data.order as Order),
  updateStatus: (id: string, status: number) =>
    api.put(`/admin/orders/${id}/status`, { status }),
  addNote: (id: string, text: string) =>
    api.post(`/admin/orders/${id}/notes`, { text })
};

export const reviewRepo = {
  getByProduct: (productId: string) =>
    api.get(`/reviews/product/${productId}`).then(r => r.data.items as Review[]),
  create: (data: { productId: string; orderId?: string; rating: number; comment: string }) =>
    api.post('/reviews', data).then(r => r.data as Review),
  approve: (id: string) => api.put(`/admin/reviews/${id}/status`, { status: 1 }),
  reject: (id: string) => api.put(`/admin/reviews/${id}/status`, { status: 2 }),
  getPending: () => api.get('/admin/reviews/pending').then(r => r.data.items as Review[])
};

export const bannerRepo = {
  getActive: () => api.get('/banners/active').then(r => r.data.items as Banner[])
};

export const wilayaRepo = {
  getAll: () => api.get('/wilayas').then(r => r.data.items as Wilaya[])
};

export const favoriteRepo = {
  getAll: () => api.get('/favorites').then(r => r.data.items as any[]),
  toggle: (productId: string) => api.post('/favorites/toggle', { productId }).then(r => r.data.isFavorite as boolean),
  isFavorited: (productId: string) => api.get(`/favorites/${productId}`).then(r => r.data.isFavorite as boolean)
};
