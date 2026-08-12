import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && !err.config?.url?.startsWith('/auth/login') && !err.config?.url?.startsWith('/auth/register') && !err.config?.url?.startsWith('/auth/me')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      const next = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/auth?mode=login${next !== '%2F' ? `&next=${next}` : ''}`;
    }
    return Promise.reject(err);
  }
);

export default api;
