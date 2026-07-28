import { create } from 'zustand';
import api from '../api/client';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: string;
  isBanned: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  bootstrapped: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { fullName: string; email: string; phone: string; password: string }) => Promise<void>;
  logout: () => void;
  loadUser: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token'),
  loading: false,
  error: null,
  bootstrapped: false,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      set({ user: data.user, token: data.token, loading: false });
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Invalid credentials';
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  register: async (payload) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/auth/register', payload);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      set({ user: data.user, token: data.token, loading: false });
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Registration failed';
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ user: null, token: null });
  },

  loadUser: () => {
    const token = localStorage.getItem('token');
    if (!token) { set({ bootstrapped: true }); return; }
    api.get('/auth/me').then(({ data }) => {
      localStorage.setItem('user', JSON.stringify(data.user));
      set({ user: data.user, token, bootstrapped: true });
    }).catch((err) => {
      const status = err.response?.status;
      if (status === 401 || status === 404) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, token: null, bootstrapped: true });
        if (status === 401) {
          window.location.href = '/auth?mode=login';
        }
      } else {
        set({ bootstrapped: true });
      }
    });
  },

  clearError: () => set({ error: null })
}));
