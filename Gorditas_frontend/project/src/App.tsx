import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NuevaOrden from './pages/NuevaOrden';
import SurtirOrden from './pages/SurtirOrden';
import EditarOrden from './pages/EditarOrden';
import Despachar from './pages/Despachar';
import RecibirProducto from './pages/RecibirProducto';
import Cobrar from './pages/Cobrar';
import Catalogos from './pages/Catalogos';
import Reportes from './pages/Reportes';
import Inventario from './pages/Inventario';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/nueva-orden" element={<NuevaOrden />} />
                    <Route path="/editar-orden" element={<EditarOrden/>} />
                    <Route path="/surtir-orden" element={<SurtirOrden/>} />
                    <Route path="/despachar" element={<Despachar/>} />
                    <Route path="/recibir-productos" element={<RecibirProducto/>} />
                    <Route path="/cobrar" element={<Cobrar/>} />
                    <Route path="/catalogos" element={<Catalogos/>} />
                    <Route path="/reportes" element={<Reportes/>} />
                    <Route path="/inventario" element={<Inventario />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;