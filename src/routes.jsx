import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from './components/layout/layout'; 
import RequestForm from './pages/RequestForm/RequestForm';
import TrackOrder from './pages/TrackOrder/TrackOrder';
import PainelAtm from './pages/PainelAtm/PainelAtm';
import AcompFinan from './pages/AcompFinan/AcompFinan'; 
import Login from './pages/Login/Login';
// 1. Importe a página do Medidor de Cargas
import MedidorCargas from './pages/MedidorCargas/MedidorCargas'; 

// 🔒 COMPONENTE DE PROTEÇÃO
const RotaPrivada = ({ children }) => {
  const token = localStorage.getItem('accessToken');
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
      
      // 2. Adicione a rota do simulador aqui
      // Ela deve bater com o nome usado no navigate da AbaSimulacao
      { path: "/simulador-veiculo", element: <MedidorCargas /> },
      
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