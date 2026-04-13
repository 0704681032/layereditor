import axios from 'axios';

const API_AUTH_USERNAME = import.meta.env.VITE_API_USERNAME || 'editor';
const API_AUTH_PASSWORD = import.meta.env.VITE_API_PASSWORD || 'editor';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  auth: {
    username: API_AUTH_USERNAME,
    password: API_AUTH_PASSWORD,
  },
});

api.interceptors.response.use(
  (response) => {
    const data = response.data;
    if (data && data.code !== undefined && data.code !== 0) {
      return Promise.reject(new Error(data.message || 'Request failed'));
    }
    return data;
  },
  (error) => {
    if (error.response?.status === 401) {
      return Promise.reject(new Error('Authentication failed. Check VITE_API_USERNAME and VITE_API_PASSWORD.'));
    }
    if (error.response?.data?.message) {
      return Promise.reject(new Error(error.response.data.message));
    }
    return Promise.reject(error);
  }
);

export default api;
