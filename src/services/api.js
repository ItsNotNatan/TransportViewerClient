import axios from 'axios';

// 🔴 O segredo está aqui: trocamos o localhost pela URL do Render que funcionou no Postman
const api = axios.create({
  baseURL: 'https://backendtransportview.onrender.com/api' 
});

// Interceptor para colocar o token (se existir) em toda requisição
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