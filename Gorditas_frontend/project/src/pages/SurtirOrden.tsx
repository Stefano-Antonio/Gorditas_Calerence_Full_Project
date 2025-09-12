import React, { useState, useEffect } from 'react';
import { 
  ChefHat, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Users,
  Timer,
  Package,
  Eye,
  RefreshCw
} from 'lucide-react';
import { apiService } from '../services/api';
import { Orden, Mesa, OrdenDetalleProducto, OrdenDetallePlatillo } from '../types';

interface OrdenConDetalles extends Orden {
  productos?: OrdenDetalleProducto[];
  platillos?: OrdenDetallePlatillo[];
}

const SurtirOrden: React.FC = () => {
  const [ordenes, setOrdenes] = useState<OrdenConDetalles[]>([]);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [selectedOrden, setSelectedOrden] = useState<OrdenConDetalles | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [markingItem, setMarkingItem] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadData();
    // Set up polling for real-time updates
    const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [ordenesRes, mesasRes] = await Promise.all([
        apiService.getOrdenes(),
        apiService.getCatalog<Mesa>('mesa')
      ]);

      if (ordenesRes.success) {
        let ordenesArray: Orden[] = [];
        if (Array.isArray(ordenesRes.data.ordenes)) {
          ordenesArray = ordenesRes.data.ordenes;
        } else if (Array.isArray(ordenesRes.data)) {
          ordenesArray = ordenesRes.data;
        }
        // Mostrar solo órdenes en estado 'Recepcion' o 'Pendiente' (recién hechas)
        const ordenesParaSurtir = ordenesArray.filter((orden: Orden) => 
          ['Recepcion', 'Pendiente'].includes(orden.estatus)
        );
        setOrdenes(ordenesParaSurtir);
      }

      if (mesasRes.success) {
        let mesasArray: Mesa[] = [];
        if (Array.isArray(mesasRes.data)) {
          mesasArray = mesasRes.data;
        } else if (Array.isArray(mesasRes.data?.items)) {
          mesasArray = mesasRes.data.items;
        }
        setMesas(mesasArray);
      }
    } catch (error) {
      setError('Error cargando órdenes');
    } finally {
      setLoading(false);
    }
  };

  const loadOrdenDetails = async (orden: OrdenConDetalles) => {
  try {
    const response = await apiService.getOrdenDetails(orden._id!);

    if (response.success) {
      const data = response.data;

      // Map platillos to expected format
      const platillos = (data.platillos || []).map((p: any) => ({
        ...p,
        platillo: p.nombrePlatillo,
        guiso: p.nombreGuiso,
        subtotal: p.importe,
      }));

      // Map productos to expected format
      const productos = (data.productos || []).map((prod: any) => ({
        ...prod,
        producto: prod.nombreProducto,
        subtotal: prod.importe,
      }));

      setSelectedOrden({
        ...data,
        platillos,
        productos,
      });
    } else {
      setError('Error cargando detalles de la orden');
    }
  } catch (error) {
    setError('Error cargando detalles de la orden');
  }
};

  const handleMarkItemAsReady = async (itemId: string, type: 'producto' | 'platillo') => {
    if (!selectedOrden) return;

    setMarkingItem(itemId);
    try {
      let response;
      if (type === 'producto') {
        response = await apiService.markProductoListo(itemId);
      } else {
        response = await apiService.markPlatilloListo(itemId);
      }

      if (response.success) {
        // Update local state
        if (type === 'producto') {
          setSelectedOrden(prev => ({
            ...prev!,
            productos: prev!.productos?.map(p => 
              p._id === itemId ? { ...p, listo: true } : p
            )
          }));
        } else {
          setSelectedOrden(prev => ({
            ...prev!,
            platillos: prev!.platillos?.map(p => 
              p._id === itemId ? { ...p, listo: true } : p
            )
          }));
        }

        setSuccess('Item marcado como listo');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Error marcando item como listo');
      }
    } catch (error) {
      setError('Error marcando item como listo');
    } finally {
      setMarkingItem(null);
    }
  };

  const handleIniciarPreparacion = async (ordenId: string) => {
    setUpdating(ordenId);
    setError('');
    try {
      // Usar la misma API que Dashboard para marcar como Surtida
      const response = await apiService.updateOrdenStatus(ordenId, 'Surtida');
      if (response.success) {
        setSuccess('Orden marcada como Surtida');
        await loadData();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Error al marcar como Surtida');
      }
    } catch (error) {
      setError('Error al marcar como Surtida');
    } finally {
      setUpdating(null);
    }
  };

  const handleCompletarOrden = async (ordenId: string) => {
    setUpdating(ordenId);
    setError('');
    
    try {
      const response = await apiService.updateOrdenStatus(ordenId, 'Surtida');
      
      if (response.success) {
        setSuccess('Orden surtida exitosamente');
        await loadData(); // Refresh the list
        setSelectedOrden(null); // Close details view
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Error al completar la orden');
      }
    } catch (error) {
      setError('Error al completar la orden');
    } finally {
      setUpdating(null);
    }
  };

  const isOrderReadyToComplete = (orden: OrdenConDetalles) => {
    const allProductsReady = orden.productos?.every(p => p.listo) ?? true;
    const allDishesReady = orden.platillos?.every(p => p.listo) ?? true;
    return allProductsReady && allDishesReady;
  };

  const getMesaInfo = (mesaId: string) => {
    return mesas.find(mesa => mesa._id === mesaId);
  };

  const getTimeElapsed = (fecha: Date) => {
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

  const getPriorityColor = (fecha: Date) => {
    const now = new Date();
    const orderTime = new Date(fecha);
    const diffInMinutes = Math.floor((now.getTime() - orderTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes > 45) return 'border-red-500 bg-red-50';
    if (diffInMinutes > 30) return 'border-yellow-500 bg-yellow-50';
    return 'border-green-500 bg-green-50';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="mb-4 sm:mb-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Órdenes Recientes</h1>
          <p className="text-gray-600 mt-1">Gestiona las órdenes que acaban de hacerse y están listas para preparar</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="bg-white rounded-lg px-3 sm:px-4 py-2 shadow-sm border border-gray-200">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 sm:w-5 h-4 sm:h-5 text-orange-600" />
              <span className="text-xs sm:text-sm font-medium text-gray-700">
                {ordenes.length} órdenes pendientes
              </span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {ordenes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
          <div className="text-center">
            <ChefHat className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No hay órdenes para preparar</h2>
            <p className="text-gray-600">No hay órdenes pendientes o en recepción</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {ordenes.map((orden) => {
            const mesa = getMesaInfo(orden.mesa);
            const horaOrden = orden.fechaHora ?? orden.fecha ?? new Date();
            const timeElapsed = getTimeElapsed(horaOrden);
            const priorityColor = getPriorityColor(horaOrden);
            
            return (
              <div
                key={orden._id}
                className={`bg-white rounded-xl shadow-sm border-2 p-4 sm:p-6 transition-all hover:shadow-md ${priorityColor}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Mesa {mesa?.numero || orden.mesa}
                      </h3>
                      {orden.nombreCliente && (
                        <p className="text-sm font-medium text-blue-600">
                          Cliente: {orden.nombreCliente}
                        </p>
                      )}
                      <p className="text-sm text-gray-600">
                        {mesa?.capacidad} personas
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-1 text-sm text-gray-600">
                      <Timer className="w-4 h-4" />
                      <span>{timeElapsed}</span>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      orden.estatus === 'Recepcion' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {orden.estatus === 'Recepcion' ? 'Lista para preparar' : 'En preparación'}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total:</span>
                    <span className="text-lg font-semibold text-green-600">
                      ${orden.total.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Hora de orden:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(orden.fechaHora ?? orden.fecha ?? new Date()).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  {orden.subordenes && orden.subordenes.length > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Subórdenes:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {orden.subordenes.length} items
                      </span>
                    </div>
                  )}
                </div>

                {orden.estatus === 'Recepcion' ? (
                  <div className="space-y-2">
                    <button
                      onClick={() => loadOrdenDetails(orden)}
                      className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Detalles
                    </button>
                    <button
                      onClick={() => handleIniciarPreparacion(orden._id!)}
                      disabled={updating === orden._id}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    >
                      {updating === orden._id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Iniciando...
                        </>
                      ) : (
                        <>
                          <ChefHat className="w-5 h-5 mr-2" />
                          Preparacion completa
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={() => loadOrdenDetails(orden)}
                      className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Items para Surtir
                    </button>
                    <button
                      onClick={() => handleCompletarOrden(orden._id!)}
                      disabled={updating === orden._id || !isOrderReadyToComplete(orden)}
                      className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    >
                      {updating === orden._id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Completando...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5 mr-2" />
                          Marcar como Surtida
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrden && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  Detalles de Orden - Mesa {selectedOrden.mesa}
                </h2>
                <button
                  onClick={() => setSelectedOrden(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Estado: {selectedOrden.estatus} | Total: ${selectedOrden.total.toFixed(2)}
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Products Section */}
              {selectedOrden.productos && selectedOrden.productos.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <Package className="w-5 h-5 mr-2 text-orange-600" />
                    Productos
                  </h3>
                  <div className="space-y-2">
                    {selectedOrden.productos.map((producto) => (
                      <div
                        key={producto._id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          producto.entregado ? 'bg-green-50 border-green-200' : producto.listo ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            producto.entregado ? 'bg-green-500' : producto.listo ? 'bg-yellow-500' : 'bg-gray-300'
                          }`}></div>
                          <div>
                            <p className="font-medium text-gray-900">{producto.producto || producto.nombre}</p>
                            <p className="text-sm text-gray-600">Cantidad: {producto.cantidad}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">
                            ${(producto.subtotal ?? 0).toFixed(2)}
                          </span>
                          {producto.entregado ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dishes Section */}
              {selectedOrden.platillos && selectedOrden.platillos.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <ChefHat className="w-5 h-5 mr-2 text-orange-600" />
                    Platillos
                  </h3>
                  <div className="space-y-2">
                    {selectedOrden.platillos.map((platillo) => (
                      <div
                        key={platillo._id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          platillo.entregado ? 'bg-green-50 border-green-200' : platillo.listo ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            platillo.entregado ? 'bg-green-500' : platillo.listo ? 'bg-yellow-500' : 'bg-gray-300'
                          }`}></div>
                          <div>
                            <p className="font-medium text-gray-900">{platillo.platillo}</p>
                            <p className="text-sm text-gray-600">
                              Guiso: {platillo.guiso} | Cantidad: {platillo.cantidad}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">
                            ${(platillo.subtotal ?? 0).toFixed(2)}
                          </span>
                          {platillo.entregado ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Order Actions */}
              <div className="border-t border-gray-200 pt-4">
                {selectedOrden.estatus === 'Preparacion' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-900">Progreso de preparación</p>
                        <p className="text-xs text-blue-700">
                          Marca cada item como listo cuando esté preparado
                        </p>
                      </div>
                      <div className="text-right">
                        <button
                          onClick={() => handleCompletarOrden(selectedOrden._id!)}
                          disabled={updating === selectedOrden._id || !isOrderReadyToComplete(selectedOrden)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                        >
                          {updating === selectedOrden._id ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Completando...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Marcar Surtida
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Código de Prioridad</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-green-200 border-2 border-green-500 rounded"></div>
            <span className="text-sm text-gray-700">Normal (menos de 30 min)</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-yellow-200 border-2 border-yellow-500 rounded"></div>
            <span className="text-sm text-gray-700">Atención (30-45 min)</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 bg-red-200 border-2 border-red-500 rounded"></div>
            <span className="text-sm text-gray-700">Urgente (más de 45 min)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SurtirOrden;