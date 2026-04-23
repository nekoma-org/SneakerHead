// sneakerhead/frontend-service/src/services/orderService.js
import api from './api';

const orderService = {
  getCart: () => api.get('/cart'),
  addToCart: (item) => api.post('/cart', item),
  updateCartItem: (itemId, data) => api.patch(`/cart/${itemId}`, data),
  removeCartItem: (itemId) => api.delete(`/cart/${itemId}`),
  clearCart: () => api.delete('/cart'),
  placeOrder: (data) => api.post('/orders', data),
  getOrders: () => api.get('/orders'),
  getOrder: (id) => api.get(`/orders/${id}`),
};

export default orderService;
