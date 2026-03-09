// src/routes.jsx
import { createBrowserRouter } from 'react-router-dom';
import Layout from './components/layout/layout'; 
import RequestForm from './pages/RequestForm/RequestForm';
import TrackOrder from './pages/TrackOrder/TrackOrder';

// 👇 IMPORTAÇÃO DA NOVA TELA DO CLIENTE (Verifique se o caminho bate com o seu!) 👇
import Dashboard from './pages/Dashboard/Dashboard'; 

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />, 
    children: [
      { path: "/", element: <RequestForm /> }, 
      { path: "/rastreio", element: <TrackOrder /> },
      // 👇 NOVA ROTA DO DASHBOARD AQUI 👇
      { path: "/dashboard", element: <Dashboard /> } 
    ]
  }
]);