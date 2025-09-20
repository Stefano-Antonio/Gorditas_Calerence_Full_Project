import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  Printer, 
  Clock,
  CheckCircle,
  StickyNote,
  ChevronDown,
  ChevronRight,
  Users
} from 'lucide-react';
import { apiService } from '../services/api';
import { Orden, OrdenCompleta, MesaAgrupada } from '../types';

const Cobrar: React.FC = () => {
  // Eliminamos mesas y selectedMesa
  const [ordenesActivas, setOrdenesActivas] = useState<OrdenCompleta[]>([]);
  const [mesasAgrupadas, setMesasAgrupadas] = useState<MesaAgrupada[]>([]);
  const [expandedMesas, setExpandedMesas] = useState<Set<number>>(new Set());
  const [expandedOrdenes, setExpandedOrdenes] = useState<Set<string>>(new Set());
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

  const toggleOrdenExpansion = (ordenId: string) => {
    const newExpanded = new Set(expandedOrdenes);
    if (newExpanded.has(ordenId)) {
      newExpanded.delete(ordenId);
    } else {
      newExpanded.add(ordenId);
    }
    setExpandedOrdenes(newExpanded);
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
              const data = detailsResponse.data;
              
              // Map platillos to include extras
              const platillosConExtras = (data.platillos || []).map((p: any) => ({
                ...p,
                extras: p.extras || []
              }));
              
              ordenesConDetalles.push({
                ...data,
                platillos: platillosConExtras,
                extras: data.extras || []
              });
            } else {
              ordenesConDetalles.push({
                ...orden,
                productos: [],
                platillos: [],
                extras: []
              });
            }
          } catch {
            ordenesConDetalles.push({
              ...orden,
              productos: [],
              platillos: [],
              extras: []
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

  const handleGenerateMesaTicket = (mesa: MesaAgrupada) => {
    const ticketContent = generateMesaTicketContent(mesa);
    const blob = new Blob([ticketContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ticket-mesa-${mesa.nombreMesa.replace(/\s/g, '-').toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintMesaTicket = (mesa: MesaAgrupada) => {
    const ticketContent = generateMesaTicketContent(mesa);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Ticket - ${mesa.nombreMesa}</title>
            <style>
              body { font-family: monospace; font-size: 12px; margin: 20px; }
              .header { text-align: center; margin-bottom: 20px; }
              .line { border-bottom: 1px dashed #000; margin: 10px 0; }
              .total { font-weight: bold; font-size: 14px; }
              h3 { margin-top: 15px; margin-bottom: 5px; }
              h4 { margin-top: 10px; margin-bottom: 3px; }
            </style>
          </head>
          <body>${ticketContent}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleCobrarTodaLaMesa = async (mesa: MesaAgrupada) => {
    // Cobrar todas las órdenes de la mesa
    for (const orden of mesa.ordenes) {
      await handleFinalizarOrden(orden);
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
    
    // Función para generar HTML de platillos con extras
    const generatePlatillosHtml = () => {
      if (!orden.platillos?.length) return '<p>Sin platillos</p>';
      
      return orden.platillos.map(p => {
        let html = `<p>${p.cantidad}x ${p.nombrePlatillo} - $${(p.importe || 0).toFixed(2)}</p>`;
        
        // Agregar extras si existen
        if (p.extras && p.extras.length > 0) {
          const extrasHtml = p.extras.map((e: any) => 
            `<p style="margin-left: 15px; font-size: 0.9em; color: #666;">+ ${e.cantidad}x ${e.nombreExtra} - $${(e.importe || 0).toFixed(2)}</p>`
          ).join('');
          html += extrasHtml;
        }
        
        return html;
      }).join('');
    };
    
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
      ${generatePlatillosHtml()}
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

  const generateMesaTicketContent = (mesa: MesaAgrupada) => {
    const fecha = new Date();
    
    // Función para generar HTML de platillos con extras para mesa
    const generatePlatillosHtmlForMesa = (platillos: any[]) => {
      if (!platillos?.length) return '<p>  Sin platillos</p>';
      
      return platillos.map(p => {
        let html = `<p>  ${p.cantidad}x ${p.nombrePlatillo} - $${(p.importe || 0).toFixed(2)}</p>`;
        
        // Agregar extras si existen
        if (p.extras && p.extras.length > 0) {
          const extrasHtml = p.extras.map((e: any) => 
            `<p style="margin-left: 25px; font-size: 0.9em; color: #666;">+ ${e.cantidad}x ${e.nombreExtra} - $${(e.importe || 0).toFixed(2)}</p>`
          ).join('');
          html += extrasHtml;
        }
        
        return html;
      }).join('');
    };
    
    return `
      <div class="header">
        <h2>RESTAURANTE</h2>
        <p>Ticket de Venta - ${mesa.nombreMesa}</p>
        <div class="line"></div>
      </div>
      <p><strong>Fecha:</strong> ${fecha.toLocaleDateString('es-ES')}</p>
      <p><strong>Hora:</strong> ${fecha.toLocaleTimeString('es-ES')}</p>
      <p><strong>Mesa:</strong> ${mesa.nombreMesa}</p>
      <p><strong>Total de órdenes:</strong> ${mesa.totalOrdenes}</p>
      <div class="line"></div>
      ${Object.entries(mesa.clientes).map(([cliente, ordenesCliente]) => `
        <h3>CLIENTE: ${cliente.toUpperCase()}</h3>
        ${ordenesCliente.map((orden: OrdenCompleta) => `
          <p><strong>Orden #${orden._id?.toString().slice(-6)}</strong></p>
          <h4>Platillos:</h4>
          ${generatePlatillosHtmlForMesa(orden.platillos || [])}
          <h4>Productos:</h4>
          ${orden.productos?.length
            ? orden.productos.map((p: any) => `<p>  ${p.cantidad}x ${p.nombreProducto || p.nombre || ''} - $${(p.importe !== undefined ? p.importe.toFixed(2) : '0.00')}</p>`).join('')
            : '<p>  Sin productos</p>'
          }
          <p><strong>Subtotal Orden:</strong> $${orden.total?.toFixed(2)}</p>
          <div class="line"></div>
        `).join('')}
        <p><strong>Total Cliente ${cliente}:</strong> $${ordenesCliente.reduce((sum, orden) => sum + (orden.total || 0), 0).toFixed(2)}</p>
        <div class="line"></div>
      `).join('')}
      <div class="total">
        <p>TOTAL MESA ${mesa.nombreMesa}: $${mesa.totalMonto.toFixed(2)}</p>
      </div>
      <div class="line"></div>
      <p style="text-align: center;">¡Gracias por su preferencia!</p>
    `;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Cobrar</h1>
          <p className="text-gray-600 mt-1">Procesa el pago y finaliza las órdenes</p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {hasNewOrders && (
            <div className="bg-yellow-100 rounded-lg px-3 py-2 shadow-sm border border-yellow-200">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse flex-shrink-0"></div>
                <span className="text-xs font-medium text-yellow-700">
                  Nuevas órdenes para cobrar
                </span>
              </div>
            </div>
          )}
          <div className="text-xs text-gray-500 text-center sm:text-left">
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
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
                  className="p-4 sm:p-6 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleMesaExpansion(mesa.idMesa)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Users className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 break-words">
                          {mesa.nombreMesa}
                        </h3>
                        <p className="text-sm text-gray-600 truncate">
                          {mesa.totalOrdenes} {mesa.totalOrdenes === 1 ? 'orden' : 'órdenes'}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="text-left sm:text-right">
                        <p className="text-base sm:text-lg font-semibold text-green-600">
                          ${mesa.totalMonto.toFixed(2)}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600">Total mesa</p>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end">
                        {expandedMesas.has(mesa.idMesa) ? (
                          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Quick actions for the entire table when collapsed */}
                  {!expandedMesas.has(mesa.idMesa) && (
                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-2" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => handleGenerateMesaTicket(mesa)}
                          className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center text-sm"
                        >
                          <Receipt className="w-4 h-4 mr-1 flex-shrink-0" />
                          <span className="truncate">Ticket Mesa</span>
                        </button>
                        <button
                          onClick={() => handlePrintMesaTicket(mesa)}
                          className="flex-1 bg-gray-600 text-white py-2 px-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center text-sm"
                        >
                          <Printer className="w-4 h-4 mr-1 flex-shrink-0" />
                          <span className="truncate">Imprimir</span>
                        </button>
                      </div>
                      <button
                        onClick={() => handleCobrarTodaLaMesa(mesa)}
                        disabled={processing}
                        className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                      >
                        <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="truncate">
                          {mesa.totalOrdenes === 1 ? 'Cobrar orden' : 'Cobrar toda la mesa'}
                        </span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Orders grouped by client - Expanded view */}
                {expandedMesas.has(mesa.idMesa) && (
                  <div className="p-4 sm:p-6">
                    <div className="space-y-4 sm:space-y-6">
                      {Object.entries(mesa.clientes).map(([cliente, ordenesCliente]) => (
                        <div key={cliente} className="bg-gray-50 rounded-lg p-4 sm:p-6">
                          <h4 className="font-medium text-gray-900 mb-3 truncate">
                            Cliente: {cliente} ({ordenesCliente.length} {ordenesCliente.length === 1 ? 'orden' : 'órdenes'})
                          </h4>
                          <div className="space-y-3">
                            {ordenesCliente.map((orden) => (
                              <div key={orden._id?.toString()} className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5">
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <h5 className="font-medium text-gray-900 truncate">
                                        Orden #{orden._id?.toString().slice(-6)}
                                      </h5>
                                      <button
                                        onClick={() => toggleOrdenExpansion(orden._id?.toString() || '')}
                                        className="text-gray-400 hover:text-gray-600 transition-colors"
                                      >
                                        {expandedOrdenes.has(orden._id?.toString() || '') ? (
                                          <ChevronDown className="w-4 h-4" />
                                        ) : (
                                          <ChevronRight className="w-4 h-4" />
                                        )}
                                      </button>
                                    </div>
                                    {orden.notas && (
                                      <div className="flex items-start space-x-1 mt-1">
                                        <StickyNote className="w-3 h-3 text-yellow-600 mt-0.5 flex-shrink-0" />
                                        <p className="text-xs text-gray-700 italic line-clamp-2 break-words">
                                          {orden.notas}
                                        </p>
                                      </div>
                                    )}
                                    <p className="text-sm text-gray-600 flex items-center mt-1">
                                      <Clock className="w-4 h-4 mr-1 flex-shrink-0" />
                                      {orden.fecha ? new Date(orden.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : ''}
                                    </p>
                                  </div>
                                  <div className="text-left sm:text-right flex-shrink-0">
                                    <p className="text-lg font-semibold text-green-600">${orden.total?.toFixed(2)}</p>
                                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                                      orden.estatus === 'Entregada' ? 'bg-green-100 text-green-800'
                                      : 'bg-blue-100 text-blue-800'
                                    }`}>{orden.estatus}</span>
                                  </div>
                                </div>

                                {/* Detalles de la orden - Panel expandible */}
                                {expandedOrdenes.has(orden._id?.toString() || '') && (
                                  <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
                                    <h6 className="font-medium text-gray-900 mb-2 text-sm">Detalles de la orden:</h6>
                                    
                                    {/* Productos */}
                                    {orden.productos && orden.productos.length > 0 && (
                                      <div className="mb-3">
                                        <p className="text-xs font-medium text-gray-700 mb-1">Productos:</p>
                                        <div className="space-y-1">
                                          {orden.productos.map((producto, idx) => (
                                            <div key={idx} className="flex justify-between items-center text-xs">
                                              <span className="text-gray-600">
                                                {producto.cantidad}x {producto.nombreProducto || producto.nombre || 'Producto'}
                                              </span>
                                              <span className="font-medium text-gray-900">
                                                ${(producto.importe || 0).toFixed(2)}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Platillos */}
                                    {orden.platillos && orden.platillos.length > 0 && (
                                      <div className="mb-3">
                                        <p className="text-xs font-medium text-gray-700 mb-1">Platillos:</p>
                                        <div className="space-y-2">
                                          {orden.platillos.map((platillo, idx) => (
                                            <div key={idx} className="space-y-1">
                                              <div className="flex justify-between items-center text-xs">
                                                <span className="text-gray-600">
                                                  {platillo.cantidad}x {platillo.nombrePlatillo} ({platillo.nombreGuiso})
                                                </span>
                                                <span className="font-medium text-gray-900">
                                                  ${(platillo.importe || 0).toFixed(2)}
                                                </span>
                                              </div>
                                              
                                              {/* Extras del platillo */}
                                              {platillo.extras && platillo.extras.length > 0 && (
                                                <div className="ml-3 space-y-1">
                                                  {platillo.extras.map((extra: any, extraIdx: number) => (
                                                    <div key={extraIdx} className="flex justify-between items-center text-xs">
                                                      <span className="text-purple-600 italic">
                                                        + {extra.cantidad}x {extra.nombreExtra}
                                                      </span>
                                                      <span className="font-medium text-purple-700">
                                                        ${(extra.importe || 0).toFixed(2)}
                                                      </span>
                                                    </div>
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Total de la orden */}
                                    <div className="pt-2 border-t border-gray-200">
                                      <div className="flex justify-between items-center text-sm font-semibold">
                                        <span className="text-gray-900">Total:</span>
                                        <span className="text-green-600">${orden.total?.toFixed(2)}</span>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                <div className="flex flex-col sm:flex-row gap-2">
                                  <button 
                                    onClick={() => handleGenerateTicket(orden)} 
                                    className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors flex items-center justify-center"
                                  >
                                    <Receipt className="w-4 h-4 mr-1 flex-shrink-0" />
                                    <span className="truncate">PDF</span>
                                  </button>
                                  <button 
                                    onClick={() => handlePrintTicket(orden)} 
                                    className="flex-1 px-3 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors flex items-center justify-center"
                                  >
                                    <Printer className="w-4 h-4 mr-1 flex-shrink-0" />
                                    <span className="truncate">Imprimir</span>
                                  </button>
                                  <button 
                                    onClick={() => handleFinalizarOrden(orden)} 
                                    disabled={processing} 
                                    className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                                    <span className="truncate">Cobrar</span>
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
                              <div className="space-y-2">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      // Generar ticket conjunto para el cliente
                                      const clienteTicketContent = `
                                        <div class="header">
                                          <h2>RESTAURANTE</h2>
                                          <p>Ticket de Venta - Cliente: ${cliente}</p>
                                          <div class="line"></div>
                                        </div>
                                        <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
                                        <p><strong>Hora:</strong> ${new Date().toLocaleTimeString('es-ES')}</p>
                                        <p><strong>Mesa:</strong> ${mesa.nombreMesa}</p>
                                        <p><strong>Cliente:</strong> ${cliente}</p>
                                        <div class="line"></div>
                                        ${ordenesCliente.map((orden: OrdenCompleta) => `
                                          <h3>ORDEN #${orden._id?.toString().slice(-6)}</h3>
                                          <h4>Platillos:</h4>
                                          ${orden.platillos?.length 
                                            ? orden.platillos.map((p: any) => `<p>${p.cantidad}x ${p.nombrePlatillo} - $${p.importe.toFixed(2)}</p>`).join('')
                                            : '<p>Sin platillos</p>'
                                          }
                                          <h4>Productos:</h4>
                                          ${orden.productos?.length
                                            ? orden.productos.map((p: any) => `<p>${p.cantidad}x ${p.nombreProducto || p.nombre || ''} - $${(p.importe !== undefined ? p.importe.toFixed(2) : '0.00')}</p>`).join('')
                                            : '<p>Sin productos</p>'
                                          }
                                          <p><strong>Subtotal:</strong> $${orden.total?.toFixed(2)}</p>
                                          <div class="line"></div>
                                        `).join('')}
                                        <div class="total">
                                          <p>TOTAL CLIENTE: $${ordenesCliente.reduce((sum, orden) => sum + (orden.total || 0), 0).toFixed(2)}</p>
                                        </div>
                                        <div class="line"></div>
                                        <p style="text-align: center;">¡Gracias por su preferencia!</p>
                                      `;
                                      const blob = new Blob([clienteTicketContent], { type: 'text/html' });
                                      const url = URL.createObjectURL(blob);
                                      const a = document.createElement('a');
                                      a.href = url;
                                      a.download = `ticket-cliente-${cliente.replace(/\s/g, '-').toLowerCase()}.html`;
                                      a.click();
                                      URL.revokeObjectURL(url);
                                    }}
                                    className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center text-sm"
                                  >
                                    <Receipt className="w-4 h-4 mr-1 flex-shrink-0" />
                                    <span className="truncate">PDF Cliente</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      // Imprimir ticket conjunto para el cliente
                                      const clienteTicketContent = `
                                        <div class="header">
                                          <h2>RESTAURANTE</h2>
                                          <p>Ticket de Venta - Cliente: ${cliente}</p>
                                          <div class="line"></div>
                                        </div>
                                        <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
                                        <p><strong>Hora:</strong> ${new Date().toLocaleTimeString('es-ES')}</p>
                                        <p><strong>Mesa:</strong> ${mesa.nombreMesa}</p>
                                        <p><strong>Cliente:</strong> ${cliente}</p>
                                        <div class="line"></div>
                                        ${ordenesCliente.map((orden: OrdenCompleta) => `
                                          <h3>ORDEN #${orden._id?.toString().slice(-6)}</h3>
                                          <h4>Platillos:</h4>
                                          ${orden.platillos?.length 
                                            ? orden.platillos.map((p: any) => `<p>${p.cantidad}x ${p.nombrePlatillo} - $${p.importe.toFixed(2)}</p>`).join('')
                                            : '<p>Sin platillos</p>'
                                          }
                                          <h4>Productos:</h4>
                                          ${orden.productos?.length
                                            ? orden.productos.map((p: any) => `<p>${p.cantidad}x ${p.nombreProducto || p.nombre || ''} - $${(p.importe !== undefined ? p.importe.toFixed(2) : '0.00')}</p>`).join('')
                                            : '<p>Sin productos</p>'
                                          }
                                          <p><strong>Subtotal:</strong> $${orden.total?.toFixed(2)}</p>
                                          <div class="line"></div>
                                        `).join('')}
                                        <div class="total">
                                          <p>TOTAL CLIENTE: $${ordenesCliente.reduce((sum, orden) => sum + (orden.total || 0), 0).toFixed(2)}</p>
                                        </div>
                                        <div class="line"></div>
                                        <p style="text-align: center;">¡Gracias por su preferencia!</p>
                                      `;
                                      const printWindow = window.open('', '_blank');
                                      if (printWindow) {
                                        printWindow.document.write(`
                                          <html>
                                            <head>
                                              <title>Ticket - Cliente ${cliente}</title>
                                              <style>
                                                body { font-family: monospace; font-size: 12px; margin: 20px; }
                                                .header { text-align: center; margin-bottom: 20px; }
                                                .line { border-bottom: 1px dashed #000; margin: 10px 0; }
                                                .total { font-weight: bold; font-size: 14px; }
                                                h3 { margin-top: 15px; margin-bottom: 5px; }
                                                h4 { margin-top: 10px; margin-bottom: 3px; }
                                              </style>
                                            </head>
                                            <body>${clienteTicketContent}</body>
                                          </html>
                                        `);
                                        printWindow.document.close();
                                        printWindow.print();
                                      }
                                    }}
                                    className="flex-1 bg-gray-600 text-white py-2 px-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center text-sm"
                                  >
                                    <Printer className="w-4 h-4 mr-1 flex-shrink-0" />
                                    <span className="truncate">Imprimir</span>
                                  </button>
                                </div>
                                <button
                                  onClick={() => {
                                    // Cobrar todas las órdenes del cliente
                                    ordenesCliente.forEach(orden => handleFinalizarOrden(orden));
                                  }}
                                  disabled={processing}
                                  className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                                >
                                  <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                                  <span className="truncate">Cobrar todas las órdenes de {cliente}</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {/* Option to pay entire table when expanded */}
                    <div className="mt-4 pt-4 border-t border-gray-200 bg-green-50 rounded-lg p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                        <span className="text-lg font-semibold text-gray-900 truncate">Total de la mesa:</span>
                        <span className="text-xl font-bold text-green-600">${mesa.totalMonto.toFixed(2)}</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            onClick={() => handleGenerateMesaTicket(mesa)}
                            className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center text-sm"
                          >
                            <Receipt className="w-4 h-4 mr-1 flex-shrink-0" />
                            <span className="truncate">Ticket Mesa PDF</span>
                          </button>
                          <button
                            onClick={() => handlePrintMesaTicket(mesa)}
                            className="flex-1 bg-gray-600 text-white py-2 px-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center text-sm"
                          >
                            <Printer className="w-4 h-4 mr-1 flex-shrink-0" />
                            <span className="truncate">Imprimir Mesa</span>
                          </button>
                        </div>
                        <button
                          onClick={() => handleCobrarTodaLaMesa(mesa)}
                          disabled={processing}
                          className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center text-lg font-medium"
                        >
                          <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                          <span className="truncate">
                            {mesa.totalOrdenes === 1 ? `Cobrar orden de ${mesa.nombreMesa}` : `Cobrar toda la mesa ${mesa.nombreMesa}`}
                          </span>
                        </button>
                      </div>
                    </div>
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