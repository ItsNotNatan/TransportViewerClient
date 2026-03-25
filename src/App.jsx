import { RouterProvider } from 'react-router-dom';
import { router } from './routes'; // ou ./routes.jsx
import { AuthProvider } from './components/context/context';

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;