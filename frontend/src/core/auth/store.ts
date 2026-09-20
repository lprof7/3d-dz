import { create } from 'zustand';
import i18n from '../i18n/i18n';
import api from '../api/client';

function extractError(err: any, fallback: string): string {
  const data = err?.response?.data;
  if (!data) return fallback;
  if (data.error) {
    const msg = String(data.error);
    if (/already registered|already exists/i.test(msg)) return i18n.t('auth.emailAlreadyRegistered');
    if (/banned/i.test(msg)) return i18n.t('auth.accountBanned');
    if (/invalid|incorrect/i.test(msg)) return i18n.t('auth.invalidCredentials');
    return msg;
  }
  if (data.errors && typeof data.errors === 'object') {
    const labelMap: Record<string, string> = {
      Email: i18n.t('auth.email'),
      Password: i18n.t('auth.password'),
      FullName: i18n.t('auth.fullName'),
      Phone: i18n.t('auth.phone')
    };
    const parts: string[] = [];
    Object.entries(data.errors).forEach(([field, list]) => {
      const label = labelMap[field] ?? field;
      const msgs: string[] = Array.isArray(list) ? (list as string[]) : [String(list)];
      msgs.forEach((m: string) => {
        if (/at least 6 characters/i.test(m)) parts.push(`${label}: ${i18n.t('auth.errPasswordShort')}`);
        else if (/at least 2 characters/i.test(m)) parts.push(`${label}: ${i18n.t('auth.errNameShort')}`);
        else if (/must not be empty/i.test(m)) parts.push(`${label}: ${i18n.t('auth.errRequired')}`);
        else if (/valid email/i.test(m)) parts.push(`${label}: ${i18n.t('auth.errEmailInvalid')}`);
        else parts.push(`${label}: ${m}`);
      });
    });
    return parts.join(' · ') || fallback;
  }
  return fallback;
}

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
      const msg = extractError(err, i18n.t('auth.invalidCredentials'));
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
      const msg = extractError(err, i18n.t('auth.registerFailed'));
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