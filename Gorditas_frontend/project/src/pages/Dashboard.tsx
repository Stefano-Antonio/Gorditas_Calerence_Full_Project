import React, { useEffect, useState } from 'react';
import { 
  ShoppingCart, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Clock,
  Package,
  ChefHat,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Eye,
  Edit,
  RefreshCw
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
  ordenesPorEstatus: {
    [key: string]: number;
  };
}

interface OrdenWorkflow {
  _id: string;
  folio: string;
  mesa: string;
  estatus: string;
  total: number;
  fechaHora: Date;
  tiempoTranscurrido?: string;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    ordenesHoy: 0,
    ventasHoy: 0,
    ordenesPendientes: 0,
    productosLowStock: 0,
    ordenesPorEstatus: {},
  });
  const [ordenesPendientes, setOrdenesPendientes] = useState<Orden[]>([]);
  const [ordenesWorkflow, setOrdenesWorkflow] = useState<OrdenWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load orders
  const ordenesResponse = await apiService.getOrdenes();
      if (ordenesResponse?.data?.ordenes) {
        if (ordenesResponse.data.ordenes.length > 0) {
        }
      } else {
        console.log('No se encontró el array de órdenes en la respuesta.');
      }
      if (ordenesResponse.success && ordenesResponse.data) {
        const ordenes: Orden[] = Array.isArray(ordenesResponse.data.ordenes) ? ordenesResponse.data.ordenes : [];

        const hoy = new Date();
        const esHoy = (d?: Date | string) => {
          if (!d) return false;
          const fecha = new Date(d);
          return fecha.getFullYear() === hoy.getFullYear() &&
                 fecha.getMonth() === hoy.getMonth() &&
                 fecha.getDate() === hoy.getDate();
        };

        // Órdenes creadas hoy (por fechaHora)
        const ordenesHoy = ordenes.filter((orden: Orden) => 
          esHoy(orden.fechaHora ?? orden.fecha)
        ).length;

        // Ventas de hoy: solo órdenes pagadas hoy (por fechaPago)
        const ventasHoy = ordenes
          .filter((orden: Orden) => 
            orden.estatus === 'Pagada' && esHoy((orden as any).fechaPago)
          )
          .reduce((sum, orden) => sum + orden.total, 0);

        const pendientes = ordenes.filter((orden: Orden) => 
          orden.estatus !== 'Pagada' && orden.estatus !== 'Cancelado'
        );

        // Count orders by status
        const ordenesPorEstatus = ordenes.reduce((acc: any, orden: Orden) => {
          acc[orden.estatus] = (acc[orden.estatus] || 0) + 1;
          return acc;
        }, {});

        // Create workflow data with time calculations
        const workflow = ordenes
          .filter((orden: Orden) => 
            orden.estatus !== 'Pagada' && orden.estatus !== 'Cancelado'
          )
          .map((orden: Orden) => {
            const fechaHoraRaw = orden.fechaHora ?? orden.fecha;
            const fechaHora: Date = fechaHoraRaw ? new Date(fechaHoraRaw) : new Date();
            return {
              _id: orden._id || '',
              folio: `#${(orden as any).folio || 'N/A'}`,
              mesa: (orden as any).nombreMesa || orden.mesa || 'N/A',
              estatus: orden.estatus,
              total: orden.total,
              fechaHora,
              tiempoTranscurrido: calculateTimeElapsed(fechaHora)
            };
          })
          .sort((a, b) => 
            a.fechaHora.getTime() - b.fechaHora.getTime()
          );

        setStats(prev => ({
          ...prev,
          ordenesHoy,
          ventasHoy,
          ordenesPendientes: pendientes.length,
          ordenesPorEstatus
        }));

        setOrdenesPendientes(pendientes);
        setOrdenesWorkflow(workflow);
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
      setError('Error cargando datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const calculateTimeElapsed = (fecha: Date) => {
    const now = new Date();
    const orderTime = new Date(fecha);
    const diffInMinutes = Math.floor((now.getTime() - orderTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} min`;
    } else {
      const hours = Math.floor(diffInMinutes / 60);
      const minutes = diffInMinutes % 60;
      return `${hours}h ${minutes}m`;
    }
  };

  const updateOrderStatus = async (ordenId: string, newStatus: string) => {
    setUpdating(ordenId);
    try {
      const response = await apiService.updateOrdenStatus(ordenId, newStatus);
      if (response.success) {
        setSuccess(`Orden actualizada a ${newStatus}`);
        setTimeout(() => setSuccess(''), 3000);
        await loadDashboardData(); // Reload data
      } else {
        setError('Error actualizando orden');
      }
    } catch (error) {
      setError('Error actualizando orden');
    } finally {
      setUpdating(null);
    }
  };

  const getStatusColor = (estatus: string) => {
    switch (estatus) {
      case 'Pendiente':
        return 'bg-orange-100 text-orange-800';
      case 'Recepcion':
        return 'bg-blue-100 text-blue-800';
      case 'Preparacion':
        return 'bg-yellow-100 text-yellow-800';
      case 'Surtida':
        return 'bg-purple-100 text-purple-800';
      case 'Entregada':
        return 'bg-green-100 text-green-800';
      case 'Pagada':
        return 'bg-gray-100 text-gray-800';
      case 'Cancelado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (estatus: string) => {
    switch (estatus) {
      case 'Pendiente':
        return <Clock className="w-4 h-4" />;
      case 'Recepcion':
        return <Eye className="w-4 h-4" />;
      case 'Preparacion':
        return <ChefHat className="w-4 h-4" />;
      case 'Surtida':
        return <Package className="w-4 h-4" />;
      case 'Entregada':
        return <CheckCircle className="w-4 h-4" />;
      case 'Pagada':
        return <DollarSign className="w-4 h-4" />;
      case 'Cancelado':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getNextStatus = (currentStatus: string) => {
    const statusFlow = {
      'Pendiente': 'Recepcion',
      'Recepcion': 'Preparacion',
      'Preparacion': 'Surtida',
      'Surtida': 'Entregada',
      'Entregada': 'Pagada'
    };
    return statusFlow[currentStatus as keyof typeof statusFlow];
  };

  const canUserUpdateStatus = (currentStatus: string) => {
    const userRole = user?.nombreTipoUsuario;
    
    // Admin can update any status
    if (userRole === 'Admin') return true;
    
    // Mesero can update Pendiente to Recepcion and Entregada to Pagada
    if (userRole === 'Mesero') {
      return currentStatus === 'Pendiente' || currentStatus === 'Entregada';
    }
    
    // Despachador can update Recepcion to Preparacion and Preparacion to Surtida
    if (userRole === 'Despachador') {
      return currentStatus === 'Recepcion' || currentStatus === 'Preparacion';
    }
    
    // Encargado can update Entregada to Pagada
    if (userRole === 'Encargado') {
      return currentStatus === 'Entregada';
    }
    
    return false;
  };

  const renderWorkflowActions = (orden: OrdenWorkflow) => {
    const userRole = user?.nombreTipoUsuario;
    const currentStatus = orden.estatus;
    const isUpdating = updating === orden._id;

    // Admin can see all actions
    if (userRole === 'Admin') {
      console.log('Render admin actions');
      return renderAdminActions(orden);
    }

    // Role-specific workflow actions
    switch (currentStatus) {
      case 'Pendiente':
        if (userRole === 'Mesero') {
          console.log('Render Mesero -> Verificar');
          return (
            <div className="flex space-x-1">
              <button
                onClick={() => updateOrderStatus(orden._id, 'Recepcion')}
                disabled={isUpdating}
                className="flex items-center space-x-1 px-1.5 sm:px-2 py-1 bg-green-100 text-green-600 rounded text-[10px] sm:text-xs hover:bg-green-200 transition-colors disabled:opacity-50 whitespace-nowrap"
                title="Marcar como verificada y completa"
              >
                {isUpdating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                <span className="hidden sm:inline">Verificar</span>
                <span className="sm:hidden">Ver.</span>
              </button>
            </div>
          );
        }
        break;

      case 'Recepcion':
        if (userRole === 'Despachador') {
          console.log('Render Despachador -> Preparar');
          return (
            <button
              onClick={() => updateOrderStatus(orden._id, 'Preparacion')}
              disabled={isUpdating}
              className="flex items-center space-x-1 px-2 py-1 bg-yellow-100 text-yellow-600 rounded text-xs hover:bg-yellow-200 transition-colors disabled:opacity-50"
              title="Iniciar preparación"
            >
              {isUpdating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <ChefHat className="w-3 h-3" />}
              <span>Preparar</span>
            </button>
          );
        }
        break;

      case 'Preparacion':
        if (userRole === 'Despachador') {
          console.log('Render Despachador -> Surtir');
          return (
            <button
              onClick={() => updateOrderStatus(orden._id, 'Surtida')}
              disabled={isUpdating}
              className="flex items-center space-x-1 px-2 py-1 bg-purple-100 text-purple-600 rounded text-xs hover:bg-purple-200 transition-colors disabled:opacity-50"
              title="Marcar como surtida"
            >
              {isUpdating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Package className="w-3 h-3" />}
              <span>Surtir</span>
            </button>
          );
        }
        break;

      case 'Surtida':
        if (userRole === 'Mesero' || userRole === 'Encargado') {
          console.log('Render Mesero/Encargado -> Cobrar desde Surtida');
          return (
            <button
              onClick={async () => {
                if (window.confirm('¿Confirmar cobro de la orden?')) {
                  if (window.confirm('¿Estás seguro que deseas marcar la orden como pagada?')) {
                    await updateOrderStatus(orden._id, 'Pagada');
                  }
                }
              }}
              disabled={isUpdating}
              className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-600 rounded text-xs hover:bg-green-200 transition-colors disabled:opacity-50"
              title="Cobrar orden"
            >
              {isUpdating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <DollarSign className="w-3 h-3" />}
              <span>Cobrar</span>
            </button>
          );
        }
        break;

      case 'Entregada':
        if (userRole === 'Mesero' || userRole === 'Encargado') {
          console.log('Render Mesero/Encargado -> Cobrar');
          return (
            <button
              onClick={() => updateOrderStatus(orden._id, 'Pagada')}
              disabled={isUpdating}
              className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-600 rounded text-xs hover:bg-green-200 transition-colors disabled:opacity-50"
              title="Cobrar orden"
            >
              {isUpdating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <DollarSign className="w-3 h-3" />}
              <span>Cobrar</span>
            </button>
          );
        }
        break;

      default:
        break;
    }

    return null;
  };

  const renderAdminActions = (orden: OrdenWorkflow) => {
    const isUpdating = updating === orden._id;
    const nextStatus = getNextStatus(orden.estatus);

    if (!nextStatus) return null;

    return (
      <button
        onClick={() => updateOrderStatus(orden._id, nextStatus)}
        disabled={isUpdating}
        className="flex items-center gap-1 px-2 sm:px-3 py-1 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition-colors text-[10px] sm:text-sm disabled:opacity-50 whitespace-nowrap"
      >
        {isUpdating ? (
          <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
        ) : (
          <>
            <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">{nextStatus}</span>
            <span className="sm:hidden">{nextStatus.substring(0, 4)}.</span>
          </>
        )}
      </button>
    );
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

      {/* Alert Messages */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Workflow Management */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <RefreshCw className="w-5 h-5 text-orange-600" />
              <h2 className="text-lg font-semibold text-gray-900">Gestión de Flujo de Órdenes</h2>
            </div>
            <button
              onClick={loadDashboardData}
              className="px-3 py-1 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition-colors text-sm"
            >
              Actualizar
            </button>
          </div>

          {/* Status Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
            {Object.entries(stats.ordenesPorEstatus).map(([status, count]) => (
              <div key={status} className="text-center">
                <div className={`inline-flex items-center space-x-1 px-3 py-2 rounded-lg ${getStatusColor(status)}`}>
                  {getStatusIcon(status)}
                  <span className="text-sm font-medium">{count}</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">{status}</p>
              </div>
            ))}
          </div>

          {/* Active Orders Workflow */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Órdenes Activas</h3>
            {ordenesWorkflow.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No hay órdenes activas</p>
            ) : (
              <div className="space-y-3">
                {ordenesWorkflow.map((orden) => (
                  <div
                    key={orden._id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-4 mb-2 sm:mb-0">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(orden.estatus)}
                        <div>
                          <p className="font-medium text-gray-900">{orden.folio}</p>
                          <p className="text-sm text-gray-600">{orden.mesa}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(orden.estatus)}`}>
                          {orden.estatus}
                        </span>
                        <span className="text-xs text-gray-500">
                          {orden.tiempoTranscurrido}
                        </span>
                        {/* Order modification indicator */}
                        {orden.estatus === 'Pendiente' && (
                          <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-600 rounded whitespace-nowrap">
                            Val.
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-end w-full sm:w-auto gap-2">
                      <span className="text-sm font-medium text-gray-900 whitespace-nowrap">
                        ${orden.total.toFixed(2)}
                      </span>
                      
                      {/* Workflow Action Buttons */}
                      <div className="flex items-center gap-1">
                        {renderWorkflowActions(orden)}
                      </div>
                      
                      <Link
                        to="/editar-orden"
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

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