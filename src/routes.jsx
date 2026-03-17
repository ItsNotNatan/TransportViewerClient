// src/routes.jsx
import { createBrowserRouter } from 'react-router-dom';
import Layout from './components/layout/layout'; 
import RequestForm from './pages/RequestForm/RequestForm';
import TrackOrder from './pages/TrackOrder/TrackOrder';
import PainelAtm from './pages/PainelAtm/PainelAtm';

// 👇 IMPORTAÇÃO DA NOVA TELA DO FINANCEIRO 👇
import AcompFinan from './pages/AcompFinan/AcompFinan'; 

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />, 
    children: [
      { path: "/", element: <RequestForm /> }, 
      { path: "/rastreio", element: <TrackOrder /> },
      { path: "/painelatm", element: <PainelAtm /> },
      // 👇 NOVA ROTA DO FINANCEIRO AQUI 👇
      { path: "/financeiro", element: <AcompFinan /> }
    ]
  }
]);