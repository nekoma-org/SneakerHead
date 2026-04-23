// sneakerhead/frontend-service/src/store/cartStore.js
import { create } from 'zustand';
import orderService from '../services/orderService';

const useCartStore = create((set, get) => ({
  cart: null,
  items: [],
  subtotal: 0,
  shipping_fee: 0,
  tax: 0,
  total: 0,
  loading: false,
  drawerOpen: false,

  setDrawerOpen: (open) => set({ drawerOpen: open }),

  fetchCart: async () => {
    try {
      const res = await orderService.getCart();
      const data = res.data;
      set({
        cart: data,
        items: data.items || [],
        subtotal: data.subtotal,
        shipping_fee: data.shipping_fee,
        tax: data.tax,
        total: data.total,
      });
    } catch {
      // user might not be logged in
    }
  },

  addToCart: async (item) => {
    set({ loading: true });
    try {
      const res = await orderService.addToCart(item);
      const data = res.data;
      set({
        cart: data,
        items: data.items || [],
        subtotal: data.subtotal,
        shipping_fee: data.shipping_fee,
        tax: data.tax,
        total: data.total,
        loading: false,
        drawerOpen: true,
      });
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  updateQuantity: async (itemId, quantity) => {
    try {
      const res = await orderService.updateCartItem(itemId, { quantity });
      const data = res.data;
      set({
        cart: data,
        items: data.items || [],
        subtotal: data.subtotal,
        shipping_fee: data.shipping_fee,
        tax: data.tax,
        total: data.total,
      });
    } catch (err) {
      throw err;
    }
  },

  removeItem: async (itemId) => {
    try {
      const res = await orderService.removeCartItem(itemId);
      const data = res.data;
      set({
        cart: data,
        items: data.items || [],
        subtotal: data.subtotal,
        shipping_fee: data.shipping_fee,
        tax: data.tax,
        total: data.total,
      });
    } catch (err) {
      throw err;
    }
  },

  clearCart: async () => {
    try {
      await orderService.clearCart();
      set({
        cart: null,
        items: [],
        subtotal: 0,
        shipping_fee: 0,
        tax: 0,
        total: 0,
      });
    } catch (err) {
      throw err;
    }
  },

  getItemCount: () => {
    return get().items.reduce((acc, item) => acc + item.quantity, 0);
  },
}));

export default useCartStore;
