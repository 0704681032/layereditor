import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
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
    if (error.response?.data?.message) {
      return Promise.reject(new Error(error.response.data.message));
    }
    return Promise.reject(error);
  }
);

export default api;
