import { createBrowserRouter } from 'react-router-dom';
import RequestForm from './pages/RequestForm/RequestForm';
import TrackOrder from './pages/TrackOrder/TrackOrder';

export const router = createBrowserRouter([
    { path: "/", element: <RequestForm /> },
    { path: "/rastreio", element: <TrackOrder /> }
  ]);