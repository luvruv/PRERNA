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
  addItem: (productId: string, quantity?: number, productMeta?: any) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  removeItem: (cartItemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

const LOCAL_STORAGE_KEY = 'prerna_local_cart';

function getInitialLocalCart(): CartData {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.items)) {
          return parsed;
        }
      }
    } catch {}
  }
  return {
    items: [],
    totalItems: 0,
    subtotal: 0,
    deliveryFee: 0,
    tax: 0,
    total: 0,
  };
}

function calculateCartTotals(items: CartItem[]): CartData {
  let subtotal = 0;
  let totalItems = 0;
  const formattedItems = items.map((it) => {
    const qty = Math.max(1, it.quantity);
    const itemSubtotal = (it.price || 0) * qty;
    subtotal += itemSubtotal;
    totalItems += qty;
    return {
      ...it,
      quantity: qty,
      subtotal: itemSubtotal,
    };
  });

  const deliveryFee = totalItems > 0 ? 25.0 : 0.0;
  const tax = Math.round(subtotal * 0.05 * 100) / 100;
  const total = Math.round((subtotal + deliveryFee + tax) * 100) / 100;

  return {
    items: formattedItems,
    totalItems,
    subtotal,
    deliveryFee,
    tax,
    total,
  };
}

function saveLocalCart(cart: CartData) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cart));
    } catch {}
  }
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: getInitialLocalCart(),
  isLoading: false,

  fetchCart: async () => {
    const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('prerna_access_token');
    if (hasToken) {
      try {
        const data = await api.get('/cart');
        if (data && Array.isArray(data.items)) {
          set({ cart: data });
          saveLocalCart(data);
          return;
        }
      } catch {
        // Fall back to local cart
      }
    }
    const local = getInitialLocalCart();
    set({ cart: local });
  },

  addItem: async (productId: string, quantity = 1, productMeta?: any) => {
    set({ isLoading: true });
    const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('prerna_access_token');

    if (hasToken) {
      try {
        const data = await api.post('/cart/items', { productId, quantity });
        if (data && Array.isArray(data.items)) {
          set({ cart: data, isLoading: false });
          saveLocalCart(data);
          return;
        }
      } catch (e) {
        console.warn('API add to cart failed, using local cart fallback:', e);
      }
    }

    // Local cart fallback
    const currentItems = [...get().cart.items];
    const existing = currentItems.find((i) => i.productId === productId);

    if (existing) {
      existing.quantity += quantity;
    } else {
      const name = productMeta?.name || 'Fresh Grocery Item';
      const price = productMeta?.price || 60;
      const mrp = productMeta?.mrp || Math.round(price * 1.2);
      const unit = productMeta?.unit || '1 pc';
      const image =
        productMeta?.images?.[0]?.url ||
        productMeta?.imageUrl ||
        productMeta?.image ||
        'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80';
      const availableQty =
        productMeta?.inventory?.availableQty ?? productMeta?.availableQty ?? 50;
      const store = productMeta?.store || {
        id: 'store-1',
        name: 'Sunrise Fresh Market',
        slug: 'sunrise-fresh-market',
      };

      currentItems.push({
        id: `local-item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        productId,
        quantity,
        productName: name,
        price,
        mrp,
        unit,
        image,
        availableQty,
        store,
        subtotal: price * quantity,
      });
    }

    const newCart = calculateCartTotals(currentItems);
    saveLocalCart(newCart);
    set({ cart: newCart, isLoading: false });
  },

  updateQuantity: async (cartItemId: string, quantity: number) => {
    set({ isLoading: true });
    const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('prerna_access_token');

    if (hasToken && !cartItemId.startsWith('local-item-')) {
      try {
        const data = await api.patch(`/cart/items/${cartItemId}`, { quantity });
        if (data && Array.isArray(data.items)) {
          set({ cart: data, isLoading: false });
          saveLocalCart(data);
          return;
        }
      } catch (e) {}
    }

    // Local fallback
    const currentItems = get().cart.items
      .map((it) => (it.id === cartItemId ? { ...it, quantity } : it))
      .filter((it) => it.quantity > 0);

    const newCart = calculateCartTotals(currentItems);
    saveLocalCart(newCart);
    set({ cart: newCart, isLoading: false });
  },

  removeItem: async (cartItemId: string) => {
    set({ isLoading: true });
    const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('prerna_access_token');

    if (hasToken && !cartItemId.startsWith('local-item-')) {
      try {
        const data = await api.delete(`/cart/items/${cartItemId}`);
        if (data && Array.isArray(data.items)) {
          set({ cart: data, isLoading: false });
          saveLocalCart(data);
          return;
        }
      } catch (e) {}
    }

    const currentItems = get().cart.items.filter((it) => it.id !== cartItemId);
    const newCart = calculateCartTotals(currentItems);
    saveLocalCart(newCart);
    set({ cart: newCart, isLoading: false });
  },

  clearCart: async () => {
    const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('prerna_access_token');
    if (hasToken) {
      try {
        await api.delete('/cart');
      } catch (e) {}
    }
    const emptyCart: CartData = {
      items: [],
      totalItems: 0,
      subtotal: 0,
      deliveryFee: 0,
      tax: 0,
      total: 0,
    };
    saveLocalCart(emptyCart);
    set({ cart: emptyCart, isLoading: false });
  },
}));

