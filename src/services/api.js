import axios from 'axios';

// 🟢 Detecta automaticamente a URL da API
// Se estiver usando Vite: import.meta.env.VITE_API_URL
// Se estiver usando Create React App: process.env.REACT_APP_API_URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
