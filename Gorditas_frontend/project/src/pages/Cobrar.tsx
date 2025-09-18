import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Receipt, 
  Printer, 
  DollarSign,
  Clock,
  CheckCircle,
  StickyNote,
  ChevronDown,
  ChevronRight,
  Users
} from 'lucide-react';
import { apiService } from '../services/api';
import { Orden, Mesa, OrdenDetalleProducto, MesaAgrupada } from '../types';

interface OrdenCompleta extends Orden {
  productos?: OrdenDetalleProducto[];
  platillos?: any[];
}

const Cobrar: React.FC = () => {
  // Eliminamos mesas y selectedMesa
  const [ordenesActivas, setOrdenesActivas] = useState<OrdenCompleta[]>([]);
  const [mesasAgrupadas, setMesasAgrupadas] = useState<MesaAgrupada[]>([]);
  const [expandedMesas, setExpandedMesas] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasNewOrders, setHasNewOrders] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());

  useEffect(() => {
    loadOrdenesActivas();
    // Set up polling for real-time updates
    const interval = setInterval(loadOrdenesActivas, 12000); // Refresh every 12 seconds
    return () => clearInterval(interval);
  }, []);

  // Function to group orders by table
  const groupOrdersByTable = (ordenes: OrdenCompleta[]): MesaAgrupada[] => {
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
      grouped[idMesa].totalMonto += orden.total || 0;
      
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

  const loadOrdenesActivas = async () => {
    try {
      const response = await apiService.getOrdenes();
      if (response.success) {
        let ordenesArray: Orden[] = [];
        if (Array.isArray(response.data.ordenes)) {
          ordenesArray = response.data.ordenes;
        } else if (Array.isArray(response.data)) {
          ordenesArray = response.data;
        }
        // Filtrar solo las órdenes con estatus Entregada
        const ordenesFiltradas = ordenesArray.filter(
          (orden: Orden) => orden.estatus === 'Entregada'
        );
        
        // Detectar nuevas órdenes para cobrar
        const currentOrderIds = ordenesActivas.map(o => o._id);
        const newOrderIds = ordenesFiltradas.map(o => o._id);
        const hasNewData = newOrderIds.some(id => !currentOrderIds.includes(id));
        
        if (hasNewData && ordenesActivas.length > 0) {
          setHasNewOrders(true);
          setSuccess('Nuevas órdenes para cobrar detectadas');
          setTimeout(() => {
            setHasNewOrders(false);
            setSuccess('');
          }, 5000);
        }
        
        // Cargar detalles para cada orden
        const ordenesConDetalles: OrdenCompleta[] = [];
        for (const orden of ordenesFiltradas) {
          try {
            const detailsResponse = await apiService.getOrdenDetails(orden._id!);
            if (detailsResponse.success) {
              ordenesConDetalles.push(detailsResponse.data);
            } else {
              ordenesConDetalles.push({
                ...orden,
                productos: [],
                platillos: []
              });
            }
          } catch {
            ordenesConDetalles.push({
              ...orden,
              productos: [],
              platillos: []
            });
          }
        }
        setOrdenesActivas(ordenesConDetalles);
        setLastUpdateTime(new Date());
        
        // Group orders by table
        const grouped = groupOrdersByTable(ordenesConDetalles);
        setMesasAgrupadas(grouped);
      } else {
        setOrdenesActivas([]);
      }
    } catch (err) {
      setError('Error cargando órdenes');
      setOrdenesActivas([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTicket = (orden: OrdenCompleta) => {
    const ticketContent = generateTicketContent(orden);
    const blob = new Blob([ticketContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ticket-${orden._id?.toString().slice(-6)}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintTicket = (orden: OrdenCompleta) => {
    const ticketContent = generateTicketContent(orden);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Ticket - Orden ${orden._id?.toString().slice(-6)}</title>
            <style>
              body { font-family: monospace; font-size: 12px; margin: 20px; }
              .header { text-align: center; margin-bottom: 20px; }
              .line { border-bottom: 1px dashed #000; margin: 10px 0; }
              .total { font-weight: bold; font-size: 14px; }
            </style>
          </head>
          <body>${ticketContent}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleFinalizarOrden = async (orden: OrdenCompleta) => {
    setProcessing(true);
    try {
      const response = await apiService.updateOrdenStatus(orden._id?.toString() || '', 'Pagada');
      if (response.success) {
        setSuccess('Orden cobrada exitosamente');
        await loadOrdenesActivas();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Error al cobrar la orden');
      }
    } catch (err) {
      setError('Error al cobrar la orden');
    } finally {
      setProcessing(false);
    }
  };

  const generateTicketContent = (orden: OrdenCompleta) => {
    const fecha = orden.fecha ? new Date(orden.fecha) : new Date();
    return `
      <div class="header">
        <h2>RESTAURANTE</h2>
        <p>Ticket de Venta</p>
        <div class="line"></div>
      </div>
      <p><strong>Fecha:</strong> ${fecha.toLocaleDateString('es-ES')}</p>
      <p><strong>Hora:</strong> ${fecha.toLocaleTimeString('es-ES')}</p>
      <p><strong>Orden:</strong> #${orden._id?.toString().slice(-6)}</p>
      <div class="line"></div>
      <h3>PLATILLOS</h3>
      ${orden.platillos?.length 
        ? orden.platillos.map(p => `<p>${p.cantidad}x ${p.nombrePlatillo} - $${p.importe.toFixed(2)}</p>`).join('')
        : '<p>Sin platillos</p>'
      }
      <h3>PRODUCTOS</h3>
      ${orden.productos?.length
        ? orden.productos.map(p => `<p>${p.cantidad}x ${p.nombreProducto || p.nombre || ''} - $${(p.importe !== undefined ? p.importe.toFixed(2) : '0.00')}</p>`).join('')
        : '<p>Sin productos</p>'
      }
      <div class="line"></div>
      <div class="total">
        <p>TOTAL: $${orden.total?.toFixed(2)}</p>
      </div>
      <div class="line"></div>
      <p style="text-align: center;">¡Gracias por su preferencia!</p>
    `;
  };

  const getTotal = () => {
    return ordenesActivas.reduce((acc, orden) => acc + (orden.total || 0), 0);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Cobrar</h1>
          <p className="text-gray-600 mt-1">Procesa el pago y finaliza las órdenes</p>
        </div>
        <div className="flex items-center space-x-4">
          {hasNewOrders && (
            <div className="bg-yellow-100 rounded-lg px-3 py-2 shadow-sm border border-yellow-200">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-yellow-700">
                  Nuevas órdenes para cobrar
                </span>
              </div>
            </div>
          )}
          <div className="text-xs text-gray-500">
            Actualizado: {lastUpdateTime.toLocaleTimeString('es-ES')}
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Órdenes para Cobrar</h2>
        {mesasAgrupadas.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <p className="text-gray-500">No hay órdenes para cobrar</p>
          </div>
        ) : (
          <div className="space-y-4">
            {mesasAgrupadas.map((mesa) => (
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
                  
                  {/* Quick actions for the entire table when collapsed */}
                  {!expandedMesas.has(mesa.idMesa) && mesa.totalOrdenes > 1 && (
                    <div className="mt-3 pt-3 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => {
                          // Cobrar todas las órdenes de la mesa
                          mesa.ordenes.forEach(orden => handleFinalizarOrden(orden));
                        }}
                        disabled={processing}
                        className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Cobrar toda la mesa
                      </button>
                    </div>
                  )}
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
                          <div className="space-y-3">
                            {ordenesCliente.map((orden) => (
                              <div key={orden._id?.toString()} className="bg-white border border-gray-200 rounded-lg p-4">
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
                                    <p className="text-sm text-gray-600 flex items-center">
                                      <Clock className="w-4 h-4 mr-1" />
                                      {orden.fecha ? new Date(orden.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : ''}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-lg font-semibold text-green-600">${orden.total?.toFixed(2)}</p>
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                      orden.estatus === 'Entregada' ? 'bg-green-100 text-green-800'
                                      : 'bg-blue-100 text-blue-800'
                                    }`}>{orden.estatus}</span>
                                  </div>
                                </div>

                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => handleGenerateTicket(orden)} 
                                    className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors flex items-center justify-center"
                                  >
                                    <Receipt className="w-4 h-4 mr-1" />
                                    PDF
                                  </button>
                                  <button 
                                    onClick={() => handlePrintTicket(orden)} 
                                    className="flex-1 px-3 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors flex items-center justify-center"
                                  >
                                    <Printer className="w-4 h-4 mr-1" />
                                    Imprimir
                                  </button>
                                  <button 
                                    onClick={() => handleFinalizarOrden(orden)} 
                                    disabled={processing} 
                                    className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Cobrar
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          {/* Option to pay all orders for this client */}
                          {ordenesCliente.length > 1 && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-900">Total del cliente:</span>
                                <span className="text-lg font-semibold text-green-600">
                                  ${ordenesCliente.reduce((sum, orden) => sum + (orden.total || 0), 0).toFixed(2)}
                                </span>
                              </div>
                              <button
                                onClick={() => {
                                  // Cobrar todas las órdenes del cliente
                                  ordenesCliente.forEach(orden => handleFinalizarOrden(orden));
                                }}
                                disabled={processing}
                                className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Cobrar todas las órdenes de {cliente}
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {/* Option to pay entire table when expanded */}
                    {mesa.totalOrdenes > 1 && (
                      <div className="mt-4 pt-4 border-t border-gray-200 bg-green-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-lg font-semibold text-gray-900">Total de la mesa:</span>
                          <span className="text-xl font-bold text-green-600">${mesa.totalMonto.toFixed(2)}</span>
                        </div>
                        <button
                          onClick={() => {
                            // Cobrar todas las órdenes de la mesa
                            mesa.ordenes.forEach(orden => handleFinalizarOrden(orden));
                          }}
                          disabled={processing}
                          className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center text-lg font-medium"
                        >
                          <CheckCircle className="w-5 h-5 mr-2" />
                          Cobrar toda la mesa {mesa.nombreMesa}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Cobrar;