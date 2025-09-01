import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Receipt, 
  Printer, 
  DollarSign,
  Users,
  Clock,
  CheckCircle
} from 'lucide-react';
import { apiService } from '../services/api';
import { Orden, Mesa, OrdenDetallePlatillo, OrdenDetalleProducto } from '../types';

interface OrdenCompleta extends Orden {
  platillos?: OrdenDetallePlatillo[];
  productos?: OrdenDetalleProducto[];
}

const Cobrar: React.FC = () => {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [selectedMesa, setSelectedMesa] = useState<Mesa | null>(null);
  const [ordenesActivas, setOrdenesActivas] = useState<OrdenCompleta[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadMesas();
  }, []);

  const loadMesas = async () => {
    try {
      const response = await apiService.getCatalog<Mesa>('mesa');
      if (response.success && Array.isArray(response.data)) {
        setMesas(response.data);
      } else {
        setMesas([]);
      }
    } catch (err) {
      setError('Error cargando mesas');
      setMesas([]);
    } finally {
      setLoading(false);
    }
  };

  const loadOrdenesActivas = async (mesa: Mesa) => {
    try {
      setSelectedMesa(mesa);
      const response = await apiService.getOrdenes();
      
      if (response.success && Array.isArray(response.data)) {
        const ordenesArray: Orden[] = response.data;
        const ordenesMesa = ordenesArray.filter(
          (orden: Orden) =>
            orden.mesa?.toString() === mesa._id?.toString() &&
            orden.estatus === 'Finalizada' // Only show orders ready for payment
        );

        const ordenesConDetalles: OrdenCompleta[] = ordenesMesa.map(orden => ({
          ...orden,
          platillos: (orden as any).platillos || [],
          productos: (orden as any).productos || [],
        }));

        setOrdenesActivas(ordenesConDetalles);
      } else {
        setOrdenesActivas([]);
      }
    } catch (err) {
      setError('Error cargando órdenes de la mesa');
      setOrdenesActivas([]);
    }
  };

  const handleGenerateTicket = (orden: OrdenCompleta) => {
    const ticketContent = generateTicketContent(orden);
    console.log('Generating ticket:', ticketContent);
    alert('Ticket generado (ver consola para detalles)');
  };

  const handlePrintTicket = (orden: OrdenCompleta) => {
    const ticketContent = generateTicketContent(orden);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Ticket - Mesa ${selectedMesa?.numero}</title>
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
        if (selectedMesa) {
          await loadOrdenesActivas(selectedMesa);
        }
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
    const mesa = selectedMesa;
    const fecha = orden.fecha ? new Date(orden.fecha) : new Date();
    
    return `
      <div class="header">
        <h2>RESTAURANTE</h2>
        <p>Ticket de Venta</p>
        <div class="line"></div>
      </div>
      <p><strong>Mesa:</strong> ${mesa?.numero}</p>
      <p><strong>Fecha:</strong> ${fecha.toLocaleDateString('es-ES')}</p>
      <p><strong>Hora:</strong> ${fecha.toLocaleTimeString('es-ES')}</p>
      <p><strong>Orden:</strong> #${orden._id?.toString().slice(-6)}</p>
      <div class="line"></div>
      <h3>PLATILLOS</h3>
      ${orden.platillos?.length
        ? orden.platillos.map(p => `<p>${p.cantidad}x Platillo - $${p.subtotal.toFixed(2)}</p>`).join('')
        : '<p>Sin platillos</p>'}
      <h3>PRODUCTOS</h3>
      ${orden.productos?.length
        ? orden.productos.map(p => `<p>${p.cantidad}x Producto - $${p.subtotal.toFixed(2)}</p>`).join('')
        : '<p>Sin productos</p>'}
      <div class="line"></div>
      <p class="total">TOTAL: $${orden.total.toFixed(2)}</p>
      <div class="line"></div>
      <div class="header"><p>¡Gracias por su visita!</p></div>
    `;
  };

  const getTotalMesa = () => {
    return ordenesActivas?.reduce((total, orden) => total + (orden.total || 0), 0);
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
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg">{success}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Table Selection */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center space-x-2 mb-4 sm:mb-6">
            <Users className="w-4 sm:w-5 h-4 sm:h-5 text-orange-600" />
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Seleccionar Mesa</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {mesas?.filter(m => m.activo).map(mesa => (
              <button
                key={mesa._id?.toString()}
                onClick={() => loadOrdenesActivas(mesa)}
                className={`p-3 sm:p-4 rounded-lg border-2 text-center transition-colors ${
                  selectedMesa?._id === mesa._id
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                }`}
              >
                <div className="text-base sm:text-lg font-semibold">Mesa {mesa.numero}</div>
                <div className="text-xs sm:text-sm text-gray-600">{mesa.capacidad} personas</div>
              </button>
            ))}
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center space-x-2 mb-6">
            <CreditCard className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedMesa ? `Órdenes - Mesa ${selectedMesa.numero}` : 'Selecciona una mesa'}
            </h2>
          </div>

          {!selectedMesa ? (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Selecciona una mesa para ver las órdenes activas</p>
            </div>
          ) : ordenesActivas?.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <p className="text-gray-500">No hay órdenes activas en esta mesa</p>
            </div>
          ) : (
            <div className="space-y-4">
              {ordenesActivas.map(orden => (
                <div key={orden._id?.toString()} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900">Orden #{orden._id?.toString().slice(-6)}</h3>
                      <p className="text-sm text-gray-600 flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {orden.fecha ? new Date(orden.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-green-600">${orden.total?.toFixed(2)}</p>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        orden.estatus === 'Surtida' ? 'bg-green-100 text-green-800'
                        : orden.estatus === 'Preparacion' ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                      }`}>{orden.estatus}</span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button onClick={() => handleGenerateTicket(orden)} className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors flex items-center justify-center">
                      <Receipt className="w-4 h-4 mr-1" /> PDF
                    </button>
                    <button onClick={() => handlePrintTicket(orden)} className="flex-1 px-3 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors flex items-center justify-center">
                      <Printer className="w-4 h-4 mr-1" /> Imprimir
                    </button>
                    <button onClick={() => handleFinalizarOrden(orden)} disabled={processing} className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 mr-1" /> Cobrar
                    </button>
                  </div>
                </div>
              ))}

              {ordenesActivas.length > 1 && (
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Total Mesa:</span>
                    <span className="text-xl font-bold text-orange-600">${getTotalMesa().toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Payment Methods */}
      {selectedMesa && ordenesActivas?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Métodos de Pago</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-center">
              <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <span className="font-medium text-gray-900">Efectivo</span>
            </button>
            <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center">
              <CreditCard className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <span className="font-medium text-gray-900">Tarjeta</span>
            </button>
            <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors text-center">
              <Receipt className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <span className="font-medium text-gray-900">Transferencia</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cobrar;
