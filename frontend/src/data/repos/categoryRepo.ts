import api from '../../core/api/client';
import type { Category, Collection } from '../types';

export const categoryRepo = {
  getAll: () => api.get('/categories').then(r => r.data.items as Category[]),
  getBySlug: (slug: string) => api.get(`/categories/${slug}`).then(r => r.data as Category),
  create: (data: Partial<Category>) => api.post('/categories', data).then(r => r.data as Category),
  update: (id: string, data: Partial<Category>) => api.put(`/categories/${id}`, data).then(r => r.data as Category),
  delete: (id: string) => api.delete(`/categories/${id}`),
};

export const collectionRepo = {
  getAll: () => api.get('/collections').then(r => r.data.items as Collection[]),
  getBySlug: (slug: string) => api.get(`/collections/${slug}`).then(r => r.data as Collection),
  create: (data: Partial<Collection>) => api.post('/collections', data).then(r => r.data as Collection),
  update: (id: string, data: Partial<Collection>) => api.put(`/collections/${id}`, data).then(r => r.data as Collection),
  delete: (id: string) => api.delete(`/collections/${id}`),
};
