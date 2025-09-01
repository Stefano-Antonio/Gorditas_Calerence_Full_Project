import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Package, 
  CheckCircle, 
  Clock,
  Users,
  AlertCircle
} from 'lucide-react';
import { apiService } from '../services/api';
import { Orden, Mesa, OrdenDetalleProducto, OrdenDetallePlatillo } from '../types';

interface OrdenConDetalles extends Orden {
  productos?: OrdenDetalleProducto[];
  platillos?: OrdenDetallePlatillo[];
}

const Despachar: React.FC = () => {
  const [ordenes, setOrdenes] = useState<OrdenConDetalles[]>([]);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [selectedOrden, setSelectedOrden] = useState<OrdenConDetalles | null>(null);
  const [loading, setLoading] = useState(true);
  const [dispatching, setDispatching] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [ordenesRes, mesasRes] = await Promise.all([
        apiService.getOrdenes(),
        apiService.getCatalog<Mesa>('mesa')
      ]);

      if (ordenesRes.success) {
        const ordenesArray: Orden[] = Array.isArray(ordenesRes.data) ? ordenesRes.data : [];
        const ordenesSurtidas = ordenesArray.filter((orden: Orden) => 
          orden.estatus === 'Surtida'
        );
        setOrdenes(ordenesSurtidas);
      }

      if (mesasRes.success) {
        setMesas(mesasRes.data || []);
      }
    } catch (error) {
      setError('Error cargando órdenes');
    } finally {
      setLoading(false);
    }
  };

  const loadOrdenDetails = async (orden: OrdenConDetalles) => {
    try {
      // In a real implementation, you would load the order details from the API
      // For now, we'll simulate this data
      const ordenConDetalles: OrdenConDetalles = {
        ...orden,
        productos: [
          // Simulated product details
        ],
        platillos: [
          // Simulated dish details
        ]
      };
      
      setSelectedOrden(ordenConDetalles);
    } catch (error) {
      setError('Error cargando detalles de la orden');
    }
  };

  const handleMarkAsDelivered = async (itemId: string, type: 'producto' | 'platillo') => {
    if (!selectedOrden) return;

    try {
      // In a real implementation, you would update the delivery status via API
      // For now, we'll simulate this
      
      if (type === 'producto') {
        setSelectedOrden(prev => ({
          ...prev!,
          productos: prev!.productos?.map(p => 
            p._id === itemId ? { ...p, entregado: true } : p
          )
        }));
      } else {
        setSelectedOrden(prev => ({
          ...prev!,
          platillos: prev!.platillos?.map(p => 
            p._id === itemId ? { ...p, entregado: true } : p
          )
        }));
      }

      setSuccess('Item marcado como entregado');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Error marcando item como entregado');
    }
  };

  const handleCompleteDispatch = async () => {
    if (!selectedOrden) return;

    setDispatching(true);
    try {
      const response = await apiService.updateOrdenStatus(selectedOrden._id!, 'Finalizada');
      
      if (response.success) {
        setSuccess('Orden despachada exitosamente');
        setSelectedOrden(null);
        await loadData();
      } else {
        setError('Error al completar el despacho');
      }
    } catch (error) {
      setError('Error al completar el despacho');
    } finally {
      setDispatching(false);
    }
  };

  const getMesaInfo = (mesaId: string) => {
    return mesas.find(mesa => mesa._id === mesaId);
  };

  const isOrderReadyForDispatch = (orden: OrdenConDetalles) => {
    const allProductsDelivered = orden.productos?.every(p => p.entregado) ?? true;
    const allDishesDelivered = orden.platillos?.every(p => p.entregado) ?? true;
    return allProductsDelivered && allDishesDelivered;
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Despachar Órdenes</h1>
          <p className="text-gray-600 mt-1">Gestiona la entrega de órdenes surtidas</p>
        </div>
        <div className="bg-white rounded-lg px-3 sm:px-4 py-2 shadow-sm border border-gray-200">
          <div className="flex items-center space-x-2">
            <Truck className="w-4 sm:w-5 h-4 sm:h-5 text-orange-600" />
            <span className="text-xs sm:text-sm font-medium text-gray-700">
              {ordenes.length} órdenes listas para despacho
            </span>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Package className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-gray-900">Órdenes Surtidas</h2>
          </div>

          <div className="space-y-4">
            {ordenes.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No hay órdenes listas para despacho</p>
              </div>
            ) : (
              ordenes.map((orden) => {
                const mesa = getMesaInfo(orden.mesa);
                
                return (
                  <div
                    key={orden._id}
                    onClick={() => loadOrdenDetails(orden)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                      selectedOrden?._id === orden._id
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <Users className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            Mesa {mesa?.numero || orden.mesa}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {new Date(orden.fecha).toLocaleTimeString('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-green-600">
                          ${orden.total.toFixed(2)}
                        </p>
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          {orden.estatus}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedOrden ? `Detalles - Mesa ${getMesaInfo(selectedOrden.mesa)?.numero}` : 'Selecciona una orden'}
            </h2>
            {selectedOrden && isOrderReadyForDispatch(selectedOrden) && (
              <button
                onClick={handleCompleteDispatch}
                disabled={dispatching}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center"
              >
                {dispatching ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Despachando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Completar Despacho
                  </>
                )}
              </button>
            )}
          </div>

          {!selectedOrden ? (
            <div className="text-center py-12">
              <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Selecciona una orden para ver los detalles</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Order Summary */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Resumen de la Orden</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Mesa:</span>
                    <span className="ml-2 font-medium">{getMesaInfo(selectedOrden.mesa)?.numero}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total:</span>
                    <span className="ml-2 font-medium text-green-600">${selectedOrden.total.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Hora:</span>
                    <span className="ml-2 font-medium">
                      {new Date(selectedOrden.fecha).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Estado:</span>
                    <span className="ml-2 font-medium">{selectedOrden.estatus}</span>
                  </div>
                </div>
              </div>

              {/* Products */}
              {selectedOrden.productos && selectedOrden.productos.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Productos</h3>
                  <div className="space-y-2">
                    {selectedOrden.productos.map((producto, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          producto.entregado ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                        }`}
                      >
                        <div>
                          <p className="font-medium text-gray-900">Producto {index + 1}</p>
                          <p className="text-sm text-gray-600">Cantidad: {producto.cantidad}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-green-600">
                            ${producto.subtotal.toFixed(2)}
                          </span>
                          {producto.entregado ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <button
                              onClick={() => handleMarkAsDelivered(producto._id!, 'producto')}
                              className="px-3 py-1 bg-orange-600 text-white text-xs rounded hover:bg-orange-700 transition-colors"
                            >
                              Entregar
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dishes */}
              {selectedOrden.platillos && selectedOrden.platillos.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Platillos</h3>
                  <div className="space-y-2">
                    {selectedOrden.platillos.map((platillo, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          platillo.entregado ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                        }`}
                      >
                        <div>
                          <p className="font-medium text-gray-900">Platillo {index + 1}</p>
                          <p className="text-sm text-gray-600">Cantidad: {platillo.cantidad}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-green-600">
                            ${platillo.subtotal.toFixed(2)}
                          </span>
                          {platillo.entregado ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <button
                              onClick={() => handleMarkAsDelivered(platillo._id!, 'platillo')}
                              className="px-3 py-1 bg-orange-600 text-white text-xs rounded hover:bg-orange-700 transition-colors"
                            >
                              Entregar
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Delivery Status */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <h3 className="font-medium text-blue-900">Estado de Entrega</h3>
                </div>
                <p className="text-sm text-blue-700">
                  {isOrderReadyForDispatch(selectedOrden)
                    ? 'Todos los items han sido entregados. La orden está lista para completar el despacho.'
                    : 'Marca todos los items como entregados para completar el despacho.'
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Despachar;