import axios from 'axios';
import { toast } from 'react-toastify';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  withCredentials: true
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      
      if (status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('token');
        window.location = '/login';
      } else if (status === 403) {
        toast.error('Unauthorized access');
      } else if (status === 500) {
        toast.error('Server error');
      } else {
        toast.error(data.message || 'An error occurred');
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  signup: (userData) => api.post('/auth/signup', userData),
  verifyEmail: (token) => api.get(`/auth/verify-email/${token}`),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.patch(`/auth/reset-password/${token}`, { password }),
  getMe: () => api.get('/auth/me')
};

// Booking API
export const bookingAPI = {
  createBooking: (bookingData) => api.post('/bookings', bookingData),
  getBookings: () => api.get('/bookings'),
  cancelBooking: (id) => api.delete(`/bookings/${id}`),
  verifyPayment: (paymentData) => api.post('/bookings/verify-payment', paymentData),
  getStats: () => api.get('/bookings/stats'),
  getRecentBookings: () => api.get('/bookings/recent')
};

// Meal API
export const mealAPI = {
  getMeals: () => api.get('/meals'),
  getMeal: (id) => api.get(`/meals/${id}`),
  createMeal: (mealData) => api.post('/meals', mealData),
  updateMeal: (id, mealData) => api.patch(`/meals/${id}`, mealData),
  deleteMeal: (id) => api.delete(`/meals/${id}`),
  resetCounts: () => api.post('/meals/reset-counts'),
  getPopularMeals: () => api.get('/meals/popular')
};

// Wallet API
export const walletAPI = {
  addToWallet: (amount) => api.post('/wallet/add', { amount }),
  verifyPayment: (paymentData) => api.post('/wallet/verify', paymentData),
  getBalance: () => api.get('/wallet/balance')
};

export default api;