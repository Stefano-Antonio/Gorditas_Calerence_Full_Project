import React, { useEffect, useState } from 'react';
import { 
  ShoppingCart, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Clock,
  Package,
  ChefHat,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { Orden } from '../types';

interface DashboardStats {
  ordenesHoy: number;
  ventasHoy: number;
  ordenesPendientes: number;
  productosLowStock: number;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    ordenesHoy: 0,
    ventasHoy: 0,
    ordenesPendientes: 0,
    productosLowStock: 0,
  });
  const [ordenesPendientes, setOrdenesPendientes] = useState<Orden[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load orders
      const ordenesResponse = await apiService.getOrdenes();
      if (ordenesResponse.success && ordenesResponse.data) {
        const ordenes: Orden[] = Array.isArray(ordenesResponse.data) ? ordenesResponse.data : [];
        const hoy = new Date().toDateString();
        
        const ordenesHoy = ordenes.filter((orden: Orden) => 
          new Date(orden.fecha).toDateString() === hoy
        ).length;
        
        const ventasHoy = ordenes
          .filter((orden: Orden) => new Date(orden.fecha).toDateString() === hoy)
          .reduce((sum: number, orden: Orden) => sum + orden.total, 0);
        
        const pendientes = ordenes.filter((orden: Orden) => 
          ['Recepcion', 'Preparacion'].includes(orden.estatus)
        );

        setStats(prev => ({
          ...prev,
          ordenesHoy,
          ventasHoy,
          ordenesPendientes: pendientes.length,
        }));

        setOrdenesPendientes(pendientes);
      }

      // Load inventory
      const inventarioResponse = await apiService.getInventario();
      if (inventarioResponse.success && inventarioResponse.data) {
        const productos = Array.isArray(inventarioResponse.data) ? inventarioResponse.data : [];
        const lowStock = productos.filter((producto: any) => producto.cantidad < 10).length;
        
        setStats(prev => ({
          ...prev,
          productosLowStock: lowStock,
        }));
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (estatus: string) => {
    switch (estatus) {
      case 'Recepcion':
        return 'bg-blue-100 text-blue-800';
      case 'Preparacion':
        return 'bg-yellow-100 text-yellow-800';
      case 'Surtida':
        return 'bg-green-100 text-green-800';
      case 'Finalizada':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Bienvenido, {user?.nombre}
          </h1>
          <p className="text-gray-600 mt-1">
            Resumen de actividad del restaurante
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">
            {new Date().toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Órdenes Hoy</p>
              <p className="text-3xl font-bold text-gray-900">{stats.ordenesHoy}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ventas Hoy</p>
              <p className="text-3xl font-bold text-gray-900">
                ${stats.ventasHoy.toFixed(2)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Órdenes Pendientes</p>
              <p className="text-3xl font-bold text-gray-900">{stats.ordenesPendientes}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Stock Bajo</p>
              <p className="text-3xl font-bold text-gray-900">{stats.productosLowStock}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Orders */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <ChefHat className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-gray-900">Órdenes Pendientes</h2>
          </div>
          
          <div className="space-y-4">
            {ordenesPendientes.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No hay órdenes pendientes</p>
            ) : (
              ordenesPendientes.slice(0, 5).map((orden) => (
                <div
                  key={orden._id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">Mesa {orden.mesa}</p>
                    <p className="text-sm text-gray-600">
                      Total: ${orden.total.toFixed(2)}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(
                      orden.estatus
                    )}`}
                  >
                    {orden.estatus}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <TrendingUp className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-gray-900">Acciones Rápidas</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
              <Link to="/nueva-orden" className="flex flex-col items-center p-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors">
              <ShoppingCart className="w-8 h-8 text-orange-600 mb-2" />
              <span className="text-sm font-medium text-gray-700">Nueva Orden</span>
              </Link>
            
              <Link to="/inventario" className="flex flex-col items-center p-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors">
              <Package className="w-8 h-8 text-orange-600 mb-2" />
              <span className="text-sm font-medium text-gray-700">Inventario</span>
              </Link>
            
              <Link to="/catalogos" className="flex flex-col items-center p-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors">
              <Users className="w-8 h-8 text-orange-600 mb-2" />
              <span className="text-sm font-medium text-gray-700">Catálogos</span>
              </Link>
            
              <Link to="/reportes" className="flex flex-col items-center p-4 border-2 border-dashed border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors">
              <TrendingUp className="w-8 h-8 text-orange-600 mb-2" />
              <span className="text-sm font-medium text-gray-700">Reportes</span>
              </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;