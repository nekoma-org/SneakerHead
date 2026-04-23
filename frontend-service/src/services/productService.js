// sneakerhead/frontend-service/src/services/productService.js
import api from './api';

const productService = {
  getProducts: (params = {}) => api.get('/products', { params }),
  getFeatured: (limit = 8) => api.get('/products/featured', { params: { limit } }),
  getBrands: () => api.get('/products/brands'),
  searchProducts: (q, page = 1, limit = 10) =>
    api.get('/products/search', { params: { q, page, limit } }),
  getProduct: (id) => api.get(`/products/${id}`),
  createProduct: (data) => api.post('/products', data),
  updateProduct: (id, data) => api.put(`/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/products/${id}`),
};

export default productService;
