import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Calendario from './pages/Calendario';

// Ruta protegida genérica: requiere sesión activa (token).
// Las páginas validan su propio estado de carga para evitar redirects prematuros al refrescar.
const PrivateRoute = ({ children }) => {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

// Ruta protegida para un cuchubal concreto.
// La validación de pertenencia la hace Calendario al cargar: si no encuentra
// el cuchubal entre los del usuario (o el id no es válido), redirige al dashboard.
const ProtectedCuchubalRoute = ({ children }) => {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return children;
};

// Redirige /cuchubal/:id -> /app/:id conservando el id (compatibilidad con bookmarks viejos).
const RedirectToApp = () => {
  const { id } = useParams();
  return <Navigate to={`/app/${id}`} replace />;
};

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Raíz: siempre al dashboard (PrivateRoute manda a login si no hay sesión) */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route path="/login" element={<Login />} />

        <Route path="/dashboard" element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } />

        {/* Ruta opaca para ver un cuchubal */}
        <Route path="/app/:id" element={
          <ProtectedCuchubalRoute>
            <Calendario />
          </ProtectedCuchubalRoute>
        } />

        {/* Compatibilidad: redirige links/bookmarks viejos de /cuchubal/:id a /app/:id */}
        <Route path="/cuchubal/:id" element={<RedirectToApp />} />

        {/* Cualquier otra ruta no definida vuelve al inicio */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
