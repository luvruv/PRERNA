import { create } from 'zustand';
import { api } from '../api';

export type UserRole = 'CUSTOMER' | 'SHOPKEEPER' | 'DELIVERY_PARTNER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  store?: any;
  deliveryPartner?: any;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<User>;
  register: (data: { email: string; password: string; name: string; phone?: string }) => Promise<User>;
  logout: () => Promise<void>;
  loadProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.post('/auth/login', { email, password });
      api.setTokens(data.accessToken, data.refreshToken);
      set({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return data.user;
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Login failed' });
      throw err;
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/register', data);
      api.setTokens(res.accessToken, res.refreshToken);
      set({
        user: res.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return res.user;
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Registration failed' });
      throw err;
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {}
    api.clearTokens();
    set({ user: null, isAuthenticated: false, isLoading: false, error: null });
  },

  loadProfile: async () => {
    set({ isLoading: true });
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('prerna_access_token') : null;
      if (!token) {
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }
      const user = await api.get('/auth/me');
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      api.clearTokens();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
