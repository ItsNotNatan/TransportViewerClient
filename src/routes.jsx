import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from './components/layout/layout'; 
import RequestForm from './pages/RequestForm/RequestForm';
import TrackOrder from './pages/TrackOrder/TrackOrder';
import PainelAtm from './pages/PainelAtm/PainelAtm';
import AcompFinan from './pages/AcompFinan/AcompFinan'; 
import Login from './pages/Login/Login';

// 🔒 COMPONENTE DE PROTEÇÃO
const RotaPrivada = ({ children }) => {
  const token = localStorage.getItem('accessToken');
  // Se não estiver logado, redireciona para o login
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />, 
    children: [
      // ✅ PÁGINAS PÚBLICAS
      { path: "/", element: <RequestForm /> }, 
      { path: "/rastreio", element: <TrackOrder /> },
      
      // 🔒 PÁGINAS PROTEGIDAS
      { 
        path: "/painelatm", 
        element: <RotaPrivada><PainelAtm /></RotaPrivada> 
      },
      { 
        path: "/financeiro", 
        element: <RotaPrivada><AcompFinan /></RotaPrivada> 
      }
    ]
  },
  {
    path: "/login",
    element: <Login />
  }
]);