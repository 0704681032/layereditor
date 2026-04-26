import axios from 'axios';

// API credentials must be configured via environment variables
const API_AUTH_USERNAME = import.meta.env.VITE_API_USERNAME;
const API_AUTH_PASSWORD = import.meta.env.VITE_API_PASSWORD;

// Validate credentials are configured
if (!API_AUTH_USERNAME || !API_AUTH_PASSWORD) {
  console.warn(
    'API credentials not configured. Set VITE_API_USERNAME and VITE_API_PASSWORD environment variables. ' +
    'Using fallback credentials for development only.'
  );
}

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  auth: {
    username: API_AUTH_USERNAME || 'editor',
    password: API_AUTH_PASSWORD || 'editor',
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
    if (error.response?.status === 403) {
      return Promise.reject(new Error('Access denied.'));
    }
    if (error.response?.status === 404) {
      return Promise.reject(new Error('Resource not found.'));
    }
    if (error.response?.status === 409) {
      return Promise.reject(new Error('Version conflict. Document was modified by another session.'));
    }
    if (error.response?.data?.message) {
      return Promise.reject(new Error(error.response.data.message));
    }
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('Request timeout. Please try again.'));
    }
    return Promise.reject(new Error(error.message || 'Network error'));
  }
);

export default api;