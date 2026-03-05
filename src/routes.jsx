// src/routes.jsx
import { createBrowserRouter } from 'react-router-dom';
import Layout from './components/layout/layout'; // Importando a nossa Moldura
import RequestForm from './pages/RequestForm/RequestForm';
import TrackOrder from './pages/TrackOrder/TrackOrder';

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />, // O Elemento principal é o Layout
    children: [
      { path: "/", element: <RequestForm /> }, // A Foto 1
      { path: "/rastreio", element: <TrackOrder /> } // A Foto 2
    ]
  }
]);