import React from 'react';

interface Orden {
  _id: string;
  fechaHora: string;
  nombreTipoOrden: string;
  idMesa?: number;
  total: number;
}

interface TablaOrdenesProps {
  ordenes: Orden[];
}

const TablaOrdenes: React.FC<TablaOrdenesProps> = ({ ordenes }) => {
  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Órdenes del Período</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr className="text-xs sm:text-sm">
              <th className="text-left py-2 sm:py-3 px-3 sm:px-4 font-medium text-gray-900">Fecha</th>
              <th className="text-left py-2 sm:py-3 px-3 sm:px-4 font-medium text-gray-900">Tipo</th>
              <th className="text-left py-2 sm:py-3 px-3 sm:px-4 font-medium text-gray-900">Mesa</th>
              <th className="text-left py-2 sm:py-3 px-3 sm:px-4 font-medium text-gray-900">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {ordenes.map((orden) => (
              <tr key={orden._id} className="text-xs sm:text-sm">
                <td className="py-2 sm:py-3 px-3 sm:px-4 whitespace-nowrap">
                  {new Date(orden.fechaHora).toLocaleString()}
                </td>
                <td className="py-2 sm:py-3 px-3 sm:px-4">{orden.nombreTipoOrden}</td>
                <td className="py-2 sm:py-3 px-3 sm:px-4">{orden.idMesa || 'N/A'}</td>
                <td className="py-2 sm:py-3 px-3 sm:px-4 font-medium text-green-600">
                  ${orden.total.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TablaOrdenes;
