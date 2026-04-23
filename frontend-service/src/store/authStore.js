// sneakerhead/frontend-service/src/store/authStore.js
import { create } from 'zustand';
import userService from '../services/userService';

const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  isAuthenticated: !!localStorage.getItem('access_token'),
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const res = await userService.login({ email, password });
      const { access_token, refresh_token } = res.data;
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);

      const profileRes = await userService.getProfile();
      const user = profileRes.data;
      localStorage.setItem('user', JSON.stringify(user));

      set({ user, isAuthenticated: true, loading: false });
      return user;
    } catch (err) {
      const message = err.response?.data?.detail || 'Login failed';
      set({ error: message, loading: false });
      throw err;
    }
  },

  register: async (name, email, password) => {
    set({ loading: true, error: null });
    try {
      await userService.register({ name, email, password });
      // Auto-login after register
      return await get().login(email, password);
    } catch (err) {
      const message = err.response?.data?.detail || 'Registration failed';
      set({ error: message, loading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    set({ user: null, isAuthenticated: false });
  },

  updateProfile: async (data) => {
    set({ loading: true, error: null });
    try {
      const res = await userService.updateProfile(data);
      const user = res.data;
      localStorage.setItem('user', JSON.stringify(user));
      set({ user, loading: false });
      return user;
    } catch (err) {
      const message = err.response?.data?.detail || 'Update failed';
      set({ error: message, loading: false });
      throw err;
    }
  },

  refreshUser: async () => {
    try {
      const res = await userService.getProfile();
      const user = res.data;
      localStorage.setItem('user', JSON.stringify(user));
      set({ user });
    } catch {
      // silent fail
    }
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
