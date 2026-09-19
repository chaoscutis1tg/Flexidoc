import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isAuthUrl = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register') || error.config?.url?.includes('/auth/google');
      if (!isAuthUrl) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
          window.location.href = '/login';
        }
      }
    }
    const message = error.response?.data?.message || 'Có lỗi kết nối hệ thống';
    return Promise.reject(new Error(message));
  }
);


export default api;
