import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Receipt, 
  Printer, 
  DollarSign,
  Clock,
  CheckCircle
} from 'lucide-react';
import { apiService } from '../services/api';
import { Orden, OrdenDetalleProducto } from '../types';

interface OrdenCompleta extends Orden {
  productos?: OrdenDetalleProducto[];
}

const Cobrar: React.FC = () => {
  const [ordenesActivas, setOrdenesActivas] = useState<OrdenCompleta[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadOrdenesActivas();
  }, []);

  const loadOrdenesActivas = async () => {
    try {
      const response = await apiService.getOrdenes();
      let ordenes: Orden[] = [];
      if (response.success && response.data) {
        if (Array.isArray(response.data.ordenes)) {
          ordenes = response.data.ordenes;
        } else if (Array.isArray(response.data)) {
          ordenes = response.data;
        }
        // Filtrar por estatus Surtida
        const ordenesSurtidas = ordenes.filter((orden: Orden) => orden.estatus === 'Surtida');
        const ordenesConDetalles: OrdenCompleta[] = ordenesSurtidas.map(orden => ({
          ...orden,
          platillos: (orden as any).platillos || [],
          productos: (orden as any).productos || [],
        }));
        setOrdenesActivas(ordenesConDetalles);
      } else {
        setOrdenesActivas([]);
      }
    } catch (err) {
      setError('Error cargando órdenes');
      setOrdenesActivas([]);
      console.error('[Cobrar] Error al cargar órdenes:', err);
    } finally {
      setLoading(false);
    }
  };

  // Dummy implementations for missing functions
  const handleGenerateTicket = (orden: OrdenCompleta) => {
    // Implement ticket generation logic here
  };

  const handlePrintTicket = (orden: OrdenCompleta) => {
    // Implement print logic here
  };

  const handleFinalizarOrden = (orden: OrdenCompleta) => {
    // Implement finalize logic here
  };

  const getTotalMesa = () => {
    return ordenesActivas.reduce((acc, orden) => acc + (orden.total || 0), 0);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Cobrar</h1>
          <p className="text-gray-600 mt-1">Procesa el pago y finaliza las órdenes</p>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg">{success}</div>}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mt-4">
        <div className="flex items-center space-x-2 mb-6">
          <CreditCard className="w-5 h-5 text-orange-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            Órdenes activas
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Cargando órdenes...</p>
          </div>
        ) : ordenesActivas?.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <p className="text-gray-500">No hay órdenes activas</p>
          </div>
        ) : (
          <div className="space-y-4">
            <>
              {ordenesActivas.map(orden => (
                <div key={orden._id?.toString()} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900">Orden #{orden._id?.toString().slice(-6)}</h3>
                      <p className="text-sm text-gray-600 flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {orden.fecha ? new Date(orden.fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Mesa: {orden.mesa}</p>
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
                    <span className="text-lg font-semibold text-gray-900">Total:</span>
                    <span className="text-xl font-bold text-orange-600">${getTotalMesa().toFixed(2)}</span>
                  </div>
                </div>
              )}
            </>
          </div>
        )}
      </div>
    </div>
  );
}

export default Cobrar;
