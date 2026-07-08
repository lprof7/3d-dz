import api from '../../core/api/client';
import type { Order, Review, Customer, Category, Collection, Banner, Product } from '../types';

export const adminRepo = {
  getOrders: (params?: { status?: string; search?: string; page?: number }) =>
    api.get('/admin/orders', { params }).then(r => ({ items: r.data.items as Order[], total: r.data.total })),
  getOrder: (id: string) => api.get(`/admin/orders/${id}`).then(r => r.data as Order),
  updateOrderStatus: (id: string, status: number) =>
    api.put(`/admin/orders/${id}/status`, { status }),
  addOrderNote: (id: string, text: string) =>
    api.post(`/admin/orders/${id}/notes`, { text }),

  getCustomers: () => api.get('/admin/customers').then(r => r.data.items as Customer[]),
  toggleBan: (id: string) => api.patch(`/admin/customers/${id}/ban`).then(r => r.data.isBanned as boolean),

  getProducts: () => api.get('/admin/products').then(r => r.data.items as Product[]),
  getAnalytics: (params?: { from?: string; to?: string }) =>
    api.get('/admin/analytics', { params }).then(r => r.data),

  getAllBanners: () => api.get('/banners').then(r => r.data.items as Banner[]),
  upsertBanner: (data: Partial<Banner>) => api.post('/banners', data).then(r => r.data as Banner),
  deleteBanner: (id: string) => api.delete(`/banners/${id}`),
};

export const reviewAdmin = {
  getPending: () => api.get('/admin/reviews/pending').then(r => r.data.items as Review[]),
  approve: (id: string) => api.put(`/admin/reviews/${id}/status`, { status: 1 }),
  reject: (id: string) => api.put(`/admin/reviews/${id}/status`, { status: 2 }),
};
