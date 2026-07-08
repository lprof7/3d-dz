import api from '../../core/api/client';
import type { Product } from '../types';

export const productRepo = {
  getAll: (params?: { categoryId?: string; search?: string; page?: number; pageSize?: number }) =>
    api.get('/products/search', { params: { ...params, q: params?.search, search: undefined } }).then(r => r.data.items as Product[]),

  getFeatured: () =>
    api.get('/products/featured').then(r => r.data.items as Product[]),

  getNewest: () =>
    api.get('/products/newest').then(r => r.data.items as Product[]),

  getBySlug: (slug: string) =>
    api.get(`/products/slug/${slug}`).then(r => r.data),

  getById: (id: string) =>
    api.get(`/products/${id}`).then(r => r.data),

  getRelated: (id: string) =>
    api.get(`/products/${id}/related`).then(r => r.data.items as Product[]),

  getByCategory: (categoryId: string) =>
    api.get('/products/search', { params: { categoryId } }).then(r => r.data.items as Product[]),

  getByCollection: (collectionId: string) =>
    api.get(`/collections/${collectionId}/products`).then(r => r.data.items as Product[]),

  create: (data: Partial<Product>) =>
    api.post('/products', data).then(r => r.data as Product),

  update: (id: string, data: Partial<Product>) =>
    api.put(`/products/${id}`, data).then(r => r.data as Product),

  delete: (id: string) =>
    api.delete(`/products/${id}`).then(r => r.data),

  toggleFeatured: (id: string) =>
    api.patch(`/products/${id}/featured`),
};
