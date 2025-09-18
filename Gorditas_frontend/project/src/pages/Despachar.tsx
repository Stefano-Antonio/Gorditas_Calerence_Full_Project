import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Package, 
  CheckCircle, 
  Clock,
  Users,
  AlertCircle,
  StickyNote,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { apiService } from '../services/api';
import { Orden, OrdenDetalleProducto, OrdenDetallePlatillo, MesaAgrupada } from '../types';

interface OrdenConDetalles extends Orden {
  productos?: OrdenDetalleProducto[];
  platillos?: OrdenDetallePlatillo[];
}

const Despachar: React.FC = () => {
  const [ordenes, setOrdenes] = useState<OrdenConDetalles[]>([]);
  const [mesasAgrupadas, setMesasAgrupadas] = useState<MesaAgrupada[]>([]);
  const [expandedMesas, setExpandedMesas] = useState<Set<number>>(new Set());
  const [selectedOrden, setSelectedOrden] = useState<OrdenConDetalles | null>(null);
  const [loading, setLoading] = useState(true);
  const [dispatching, setDispatching] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasNewOrders, setHasNewOrders] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());

  useEffect(() => {
    loadData();
    // Set up polling for real-time updates - more frequent for better responsiveness
    const interval = setInterval(loadData, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  // Function to group orders by table
  const groupOrdersByTable = (ordenes: OrdenConDetalles[]): MesaAgrupada[] => {
    const grouped: { [idMesa: number]: MesaAgrupada } = {};
    
    ordenes.forEach(orden => {
      const idMesa = orden.idMesa || 0; // 0 for orders without table
      const nombreMesa = orden.nombreMesa || 'Sin Mesa';
      
      if (!grouped[idMesa]) {
        grouped[idMesa] = {
          idMesa,
          nombreMesa,
          ordenes: [],
          totalOrdenes: 0,
          totalMonto: 0,
          clientes: {}
        };
      }
      
      grouped[idMesa].ordenes.push(orden);
      grouped[idMesa].totalOrdenes += 1;
      grouped[idMesa].totalMonto += orden.total;
      
      // Group by client
      const cliente = orden.nombreCliente || 'Sin nombre';
      if (!grouped[idMesa].clientes[cliente]) {
        grouped[idMesa].clientes[cliente] = [];
      }
      grouped[idMesa].clientes[cliente].push(orden);
    });
    
    return Object.values(grouped).sort((a, b) => a.nombreMesa.localeCompare(b.nombreMesa));
  };

  const toggleMesaExpansion = (idMesa: number) => {
    const newExpanded = new Set(expandedMesas);
    if (newExpanded.has(idMesa)) {
      newExpanded.delete(idMesa);
    } else {
      newExpanded.add(idMesa);
    }
    setExpandedMesas(newExpanded);
  };

  const loadData = async () => {
    try {
      const ordenesRes = await apiService.getOrdenes();

      if (ordenesRes.success) {
        let ordenesArray: Orden[] = [];
        if (Array.isArray(ordenesRes.data.ordenes)) {
          ordenesArray = ordenesRes.data.ordenes;
        } else if (Array.isArray(ordenesRes.data)) {
          ordenesArray = ordenesRes.data;
        }
        // Mostrar órdenes en estado 'Surtida' y 'Recepcion' para despacho
        const ordenesParaDespachar = ordenesArray.filter((orden: Orden) => 
          ['Surtida', 'Recepcion'].includes(orden.estatus)
        );
        
        // Detectar nuevas órdenes comparando con el estado actual
        const currentOrderIds = ordenes.map(o => o._id);
        const newOrderIds = ordenesParaDespachar.map(o => o._id);
        const hasNewData = newOrderIds.some(id => !currentOrderIds.includes(id));
        
        if (hasNewData && ordenes.length > 0) {
          setHasNewOrders(true);
          setSuccess('Nuevas órdenes para despachar detectadas');
          setTimeout(() => {
            setHasNewOrders(false);
            setSuccess('');
          }, 5000);
        }
        
        setOrdenes(ordenesParaDespachar);
        setLastUpdateTime(new Date());
        
        // Group orders by table
        const grouped = groupOrdersByTable(ordenesParaDespachar);
        setMesasAgrupadas(grouped);
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
          // Mapear platillos al formato esperado
          const platillos = (data.platillos || []).map((p: any) => ({
            ...p,
            platillo: p.nombrePlatillo,
            guiso: p.nombreGuiso,
            subtotal: p.importe,
          }));

          // Mapear productos al formato esperado
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

  const handleMarkAsDelivered = async (itemId: string, type: 'producto' | 'platillo') => {
    if (!selectedOrden) return;

    // Permitir marcar productos como entregados en "Recepcion" y "Surtida"
    // Permitir marcar platillos como entregados solo en "Surtida"
    if (type === 'producto') {
      if (!['Recepcion', 'Surtida'].includes(selectedOrden.estatus)) {
        setError('Solo se pueden marcar productos como entregados en órdenes con estatus "Recepcion" o "Surtida"');
        setTimeout(() => setError(''), 3000);
        return;
      }
    } else if (type === 'platillo') {
      if (selectedOrden.estatus !== 'Surtida') {
        setError('Solo se pueden marcar platillos como entregados en órdenes con estatus "Surtida"');
        setTimeout(() => setError(''), 3000);
        return;
      }
    }

    try {
      let response;
      if (type === 'producto') {
        response = await apiService.markProductoEntregado(itemId);
      } else {
        response = await apiService.markPlatilloEntregado(itemId);
      }

      if (response.success) {
        // Update local state
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
      } else {
        setError('Error marcando item como entregado');
      }
    } catch (error) {
      setError('Error marcando item como entregado');
    }
  };

  const handleCompleteDispatch = async () => {
    if (!selectedOrden) return;

    // Solo permitir completar despacho si la orden está en "Surtida" y todos los items están entregados
    if (selectedOrden.estatus !== 'Surtida') {
      setError('Solo se puede completar el despacho de órdenes en estatus "Surtida"');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (!isOrderReadyForDispatch(selectedOrden)) {
      setError('Todos los items deben estar marcados como entregados antes de completar el despacho');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setDispatching(true);
    try {
      const response = await apiService.updateOrdenStatus(selectedOrden._id!, 'Entregada');
      
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
              {ordenes.length} órdenes para despacho
            </span>
          </div>
        </div>
        {hasNewOrders && (
          <div className="bg-blue-100 rounded-lg px-3 py-2 shadow-sm border border-blue-200">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-blue-700">
                Nuevas órdenes listas
              </span>
            </div>
          </div>
        )}
        <div className="text-xs text-gray-500">
          Actualizado: {lastUpdateTime.toLocaleTimeString('es-ES')}
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
            <h2 className="text-lg font-semibold text-gray-900">Órdenes para Despacho</h2>
          </div>

          <div className="space-y-4">
            {mesasAgrupadas.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No hay órdenes disponibles para despacho</p>
              </div>
            ) : (
              mesasAgrupadas.map((mesa) => (
                <div key={mesa.idMesa} className="bg-white rounded-xl shadow-sm border border-gray-200">
                  {/* Mesa Header - Clickable to expand/collapse */}
                  <div 
                    className="p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleMesaExpansion(mesa.idMesa)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <Users className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {mesa.nombreMesa}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {mesa.totalOrdenes} {mesa.totalOrdenes === 1 ? 'orden' : 'órdenes'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <p className="text-lg font-semibold text-green-600">
                            ${mesa.totalMonto.toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-600">Total mesa</p>
                        </div>
                        {expandedMesas.has(mesa.idMesa) ? (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Orders grouped by client - Expanded view */}
                  {expandedMesas.has(mesa.idMesa) && (
                    <div className="p-4">
                      <div className="space-y-4">
                        {Object.entries(mesa.clientes).map(([cliente, ordenesCliente]) => (
                          <div key={cliente} className="bg-gray-50 rounded-lg p-4">
                            <h4 className="font-medium text-gray-900 mb-3">
                              Cliente: {cliente} ({ordenesCliente.length} {ordenesCliente.length === 1 ? 'orden' : 'órdenes'})
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {ordenesCliente.map((orden) => (
                                <div
                                  key={orden._id}
                                  onClick={() => loadOrdenDetails(orden)}
                                  className={`bg-white rounded-lg border p-4 cursor-pointer transition-colors ${
                                    selectedOrden?._id === orden._id
                                      ? 'border-orange-500 bg-orange-50'
                                      : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-3">
                                    <div>
                                      <h5 className="font-medium text-gray-900">
                                        Orden #{orden._id?.toString().slice(-6)}
                                      </h5>
                                      {orden.notas && (
                                        <div className="flex items-start space-x-1 mt-1">
                                          <StickyNote className="w-3 h-3 text-yellow-600 mt-0.5 flex-shrink-0" />
                                          <p className="text-xs text-gray-700 italic line-clamp-2">
                                            {orden.notas}
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm font-medium text-green-600">
                                        ${orden.total.toFixed(2)}
                                      </p>
                                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                        orden.estatus === 'Surtida' 
                                          ? 'bg-green-100 text-green-800'
                                          : 'bg-blue-100 text-blue-800'
                                      }`}>
                                        {orden.estatus}
                                      </span>
                                    </div>
                                  </div>
                                  <p className="text-sm text-gray-600">
                                    {new Date(orden.fechaHora ?? orden.fecha ?? '').toLocaleTimeString('es-ES', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedOrden ? `Detalles - ${selectedOrden.nombreMesa || 'Sin Mesa'}` : 'Selecciona una orden'}
            </h2>
            {selectedOrden && isOrderReadyForDispatch(selectedOrden) && selectedOrden.estatus === 'Surtida' && (
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
                    <span className="ml-2 font-medium">{selectedOrden.nombreMesa || 'Sin Mesa'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total:</span>
                    <span className="ml-2 font-medium text-green-600">${selectedOrden.total.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Hora:</span>
                    <span className="ml-2 font-medium">
                      {new Date(selectedOrden.fechaHora ?? selectedOrden.fecha ?? '').toLocaleTimeString('es-ES', {
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
              {selectedOrden.productos && selectedOrden.productos.length > 0 ? (
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
                          <p className="font-medium text-gray-900">{producto.producto || producto.nombreProducto || `Producto ${index + 1}`}</p>
                          <p className="text-sm text-gray-600">Cantidad: {producto.cantidad}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-green-600">
                            ${producto.subtotal?.toFixed(2) ?? producto.importe?.toFixed(2) ?? '0.00'}
                          </span>
                          {producto.entregado ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <button
                              onClick={() => handleMarkAsDelivered(producto._id!, 'producto')}
                              disabled={!['Recepcion', 'Surtida'].includes(selectedOrden.estatus)}
                              className={`px-3 py-1 text-white text-xs rounded transition-colors ${
                                ['Recepcion', 'Surtida'].includes(selectedOrden.estatus)
                                  ? 'bg-orange-600 hover:bg-orange-700'
                                  : 'bg-gray-400 cursor-not-allowed'
                              }`}
                            >
                              {['Recepcion', 'Surtida'].includes(selectedOrden.estatus) ? 'Entregar' : 'No disponible'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Productos</h3>
                  <div className="text-sm text-gray-500">No hay productos en esta orden.</div>
                </div>
              )}

              {/* Dishes */}
              {selectedOrden.platillos && selectedOrden.platillos.length > 0 ? (
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
                          <p className="font-medium text-gray-900">{platillo.platillo || platillo.nombrePlatillo || `Platillo ${index + 1}`}</p>
                          <p className="text-sm text-gray-600">Guiso: {platillo.guiso || platillo.nombreGuiso}</p>
                          <p className="text-sm text-gray-600">Cantidad: {platillo.cantidad}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-green-600">
                            ${platillo.subtotal !== undefined ? platillo.subtotal.toFixed(2) : '0.00'}
                          </span>
                          {platillo.entregado ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <button
                              onClick={() => handleMarkAsDelivered(platillo._id!, 'platillo')}
                              disabled={selectedOrden.estatus !== 'Surtida'}
                              className={`px-3 py-1 text-white text-xs rounded transition-colors ${
                                selectedOrden.estatus === 'Surtida'
                                  ? 'bg-orange-600 hover:bg-orange-700'
                                  : 'bg-gray-400 cursor-not-allowed'
                              }`}
                            >
                              {selectedOrden.estatus === 'Surtida' ? 'Entregar' : 'Sueriendo...'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Platillos</h3>
                  <div className="text-sm text-gray-500">No hay platillos en esta orden.</div>
                </div>
              )}

              {/* Delivery Status */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <h3 className="font-medium text-blue-900">Estado de Entrega</h3>
                </div>
                <p className="text-sm text-blue-700">
                  {selectedOrden.estatus === 'Recepcion'
                    ? 'En esta orden puedes entregar productos. Los platillos solo se pueden entregar cuando esté "Surtida".'
                    : selectedOrden.estatus === 'Surtida'
                      ? isOrderReadyForDispatch(selectedOrden)
                        ? 'Todos los items han sido entregados. La orden está lista para completar el despacho.'
                        : 'Puedes marcar tanto productos como platillos como entregados.'
                      : 'Esta orden no está disponible para despacho.'
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