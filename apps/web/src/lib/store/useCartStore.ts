import { create } from 'zustand';
import { api } from '../api';

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  productName: string;
  price: number;
  mrp: number;
  unit: string;
  image: string;
  availableQty: number;
  subtotal: number;
  store: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface CartData {
  id?: string;
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;
}

interface CartState {
  cart: CartData;
  isLoading: boolean;
  fetchCart: () => Promise<void>;
  addItem: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  removeItem: (cartItemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: {
    items: [],
    totalItems: 0,
    subtotal: 0,
    deliveryFee: 0,
    tax: 0,
    total: 0,
  },
  isLoading: false,

  fetchCart: async () => {
    try {
      const data = await api.get('/cart');
      set({ cart: data });
    } catch {
      // not authenticated or empty
    }
  },

  addItem: async (productId: string, quantity = 1) => {
    set({ isLoading: true });
    try {
      const data = await api.post('/cart/items', { productId, quantity });
      set({ cart: data, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  updateQuantity: async (cartItemId: string, quantity: number) => {
    set({ isLoading: true });
    try {
      const data = await api.patch(`/cart/items/${cartItemId}`, { quantity });
      set({ cart: data, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  removeItem: async (cartItemId: string) => {
    set({ isLoading: true });
    try {
      const data = await api.delete(`/cart/items/${cartItemId}`);
      set({ cart: data, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  clearCart: async () => {
    try {
      await api.delete('/cart');
      set({
        cart: {
          items: [],
          totalItems: 0,
          subtotal: 0,
          deliveryFee: 0,
          tax: 0,
          total: 0,
        },
      });
    } catch (err) {
      throw err;
    }
  },
}));
