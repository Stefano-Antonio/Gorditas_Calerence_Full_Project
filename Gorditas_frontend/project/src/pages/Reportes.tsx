import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Package, 
  DollarSign,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Users,
  Table
} from 'lucide-react';
import { apiService } from '../services/api';
import { 
  ReporteVentas, 
  ReporteInventario, 
  ProductoVendido, 
  ReporteUsuario, 
  ReporteMesa, 
  ReporteGasto 
} from '../types';

const Reportes: React.FC = () => {
  const [activeTab, setActiveTab] = useState('ventas');
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0]);
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);
  
  const [reporteVentas, setReporteVentas] = useState<ReporteVentas[]>([]);
  const [reporteInventario, setReporteInventario] = useState<ReporteInventario[]>([]);
  const [productosVendidos, setProductosVendidos] = useState<ProductoVendido[]>([]);
  const [reporteGastos, setReporteGastos] = useState<ReporteGasto[]>([]);
  const [reporteUsuarios, setReporteUsuarios] = useState<ReporteUsuario[]>([]);
  const [reporteMesas, setReporteMesas] = useState<ReporteMesa[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadReports();
  }, [activeTab, fechaInicio, fechaFin]);

  const loadReports = async () => {
    setLoading(true);
    setError('');
    
    try {
      switch (activeTab) {
        case 'ventas':
          const ventasRes = await apiService.getReporteVentas(fechaInicio, fechaFin);
          if (ventasRes.success && ventasRes.data) {
            setReporteVentas(Array.isArray(ventasRes.data.data) ? ventasRes.data.data : []);
          }
          break;
          
        case 'inventario':
          const inventarioRes = await apiService.getReporteInventario();
          if (inventarioRes.success && inventarioRes.data) {
            setReporteInventario(Array.isArray(inventarioRes.data.data) ? inventarioRes.data.data : []);
          }
          break;
          
        case 'productos':
          const productosRes = await apiService.getProductosVendidos(fechaInicio, fechaFin);
          if (productosRes.success && productosRes.data) {
            setProductosVendidos(Array.isArray(productosRes.data.data) ? productosRes.data.data : []);
          }
          break;
          
        case 'gastos':
          const gastosRes = await apiService.getReporteGastos(fechaInicio, fechaFin);
          if (gastosRes.success && gastosRes.data) {
            setReporteGastos(Array.isArray(gastosRes.data.data) ? gastosRes.data.data : []);
          }
          break;

        case 'usuarios':
          const usuariosRes = await apiService.getReporteUsuarios(fechaInicio, fechaFin);
          if (usuariosRes.success && usuariosRes.data) {
            setReporteUsuarios(Array.isArray(usuariosRes.data.data) ? usuariosRes.data.data : []);
          }
          break;

        case 'mesas':
          const mesasRes = await apiService.getReporteMesas(fechaInicio, fechaFin);
          if (mesasRes.success && mesasRes.data) {
            setReporteMesas(Array.isArray(mesasRes.data.data) ? mesasRes.data.data : []);
          }
          break;
      }
    } catch (error) {
      setError('Error cargando reportes');
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = () => {
    let csvContent = '';
    let filename = '';
    
    switch (activeTab) {
      case 'ventas':
        filename = 'reporte-ventas.csv';
        csvContent = 'Fecha,Ventas Totales,Gastos Totales,Utilidad,Ordenes\n';
        reporteVentas.forEach(venta => {
          csvContent += `${venta.fecha},${venta.ventasTotales},${venta.gastosTotales},${venta.utilidad},${venta.ordenes}\n`;
        });
        break;
        
      case 'inventario':
        filename = 'reporte-inventario.csv';
        csvContent = 'Producto,Cantidad,Costo Unitario,Valor Total,Estado\n';
        reporteInventario.forEach(item => {
          csvContent += `${item.producto.nombre},${item.producto.cantidad},${item.producto.costo},${item.valorTotal},${item.stockMinimo ? 'Stock Bajo' : 'Normal'}\n`;
        });
        break;
        
      case 'productos':
        filename = 'productos-vendidos.csv';
        csvContent = 'Producto,Cantidad Vendida,Total Vendido\n';
        productosVendidos.forEach(producto => {
          csvContent += `${producto.nombre},${producto.cantidadVendida},${producto.totalVendido}\n`;
        });
        break;
        
      case 'gastos':
        filename = 'reporte-gastos.csv';
        csvContent = 'Fecha,Tipo,Descripción,Monto,Usuario\n';
        reporteGastos.forEach(gasto => {
          csvContent += `${new Date(gasto.fecha).toLocaleDateString()},${gasto.tipoGasto},${gasto.descripcion},${gasto.monto},${gasto.usuario}\n`;
        });
        break;
        
      case 'usuarios':
        filename = 'reporte-usuarios.csv';
        csvContent = 'Usuario,Ordenes,Total Ventas,Promedio Venta,Gastos,Total Gastos\n';
        reporteUsuarios.forEach(usuario => {
          csvContent += `${usuario.usuario},${usuario.cantidadOrdenes},${usuario.totalVentas},${usuario.promedioVenta},${usuario.cantidadGastos},${usuario.totalGastos}\n`;
        });
        break;
        
      case 'mesas':
        filename = 'reporte-mesas.csv';
        csvContent = 'Mesa,Ordenes,Total Ventas,Promedio Venta,Tiempo Promedio (min)\n';
        reporteMesas.forEach(mesa => {
          csvContent += `${mesa.mesa},${mesa.cantidadOrdenes},${mesa.totalVentas},${mesa.promedioVenta},${mesa.tiempoPromedioMinutos}\n`;
        });
        break;
        
      default:
        alert('No hay datos para exportar');
        return;
    }
    
    // Crear y descargar el archivo CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const tabs = [
    { id: 'ventas', name: 'Ventas', icon: TrendingUp },
    { id: 'inventario', name: 'Inventario', icon: Package },
    { id: 'productos', name: 'Productos Vendidos', icon: BarChart3 },
    { id: 'gastos', name: 'Gastos', icon: DollarSign },
    { id: 'usuarios', name: 'Usuarios', icon: Users },
    { id: 'mesas', name: 'Mesas', icon: Table },
  ];

  const getTotalVentas = () => {
    return reporteVentas.reduce((total, reporte) => total + reporte.ventasTotales, 0);
  };

  const getTotalGastos = () => {
    return reporteGastos.reduce((total, gasto) => total + gasto.monto, 0);
  };

  const getTotalUtilidad = () => {
    return getTotalVentas() - getTotalGastos();
  };

  const getTotalInventario = () => {
    return reporteInventario.reduce((total, item) => total + item.valorTotal, 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reportes</h1>
          <p className="text-gray-600 mt-1">Análisis y estadísticas del restaurante</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadReports}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </button>
          <button
            onClick={handleExportReport}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Date Filter */}
        {(activeTab === 'ventas' || activeTab === 'gastos' || activeTab === 'productos' || activeTab === 'usuarios' || activeTab === 'mesas') && (
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Período:</span>
              </div>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <span className="text-gray-500">hasta</span>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            </div>
          ) : (
            <>
              {/* Sales Report */}
              {activeTab === 'ventas' && (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-green-600">Total Ventas</p>
                          <p className="text-2xl font-bold text-green-900">
                            ${getTotalVentas().toFixed(2)}
                          </p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-green-600" />
                      </div>
                    </div>
                    
                    <div className="bg-red-50 p-6 rounded-lg border border-red-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-red-600">Total Gastos</p>
                          <p className="text-2xl font-bold text-red-900">
                            ${getTotalGastos().toFixed(2)}
                          </p>
                        </div>
                        <DollarSign className="w-8 h-8 text-red-600" />
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-blue-600">Utilidad</p>
                          <p className="text-2xl font-bold text-blue-900">
                            ${getTotalUtilidad().toFixed(2)}
                          </p>
                        </div>
                        <BarChart3 className="w-8 h-8 text-blue-600" />
                      </div>
                    </div>
                  </div>

                  {/* Sales Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Fecha</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Ventas</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Gastos</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Utilidad</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Órdenes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reporteVentas.map((reporte, index) => (
                          <tr key={index} className="border-b border-gray-100">
                            <td className="py-3 px-4">{reporte.fecha}</td>
                            <td className="py-3 px-4 text-green-600 font-medium">
                              ${reporte.ventasTotales.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-red-600 font-medium">
                              ${reporte.gastosTotales.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-blue-600 font-medium">
                              ${reporte.utilidad.toFixed(2)}
                            </td>
                            <td className="py-3 px-4">{reporte.ordenes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Inventory Report */}
              {activeTab === 'inventario' && (
                <div className="space-y-6">
                  <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-orange-600">Valor Total del Inventario</p>
                        <p className="text-2xl font-bold text-orange-900">
                          ${getTotalInventario().toFixed(2)}
                        </p>
                      </div>
                      <Package className="w-8 h-8 text-orange-600" />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Producto</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Cantidad</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Costo Unit.</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Valor Total</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reporteInventario.map((item, index) => (
                          <tr key={index} className="border-b border-gray-100">
                            <td className="py-3 px-4 font-medium">{item.producto.nombre}</td>
                            <td className="py-3 px-4">{item.producto.cantidad}</td>
                            <td className="py-3 px-4">${item.producto.costo.toFixed(2)}</td>
                            <td className="py-3 px-4 font-medium">${item.valorTotal.toFixed(2)}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  item.stockMinimo
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-green-100 text-green-800'
                                }`}
                              >
                                {item.stockMinimo ? 'Stock Bajo' : 'Normal'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Products Sold Report */}
              {activeTab === 'productos' && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Producto</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Cantidad Vendida</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Total Vendido</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productosVendidos.map((producto, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-3 px-4 font-medium">{producto.nombre}</td>
                          <td className="py-3 px-4">{producto.cantidadVendida}</td>
                          <td className="py-3 px-4 text-green-600 font-medium">
                            ${producto.totalVendido.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Expenses Report */}
              {activeTab === 'gastos' && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Fecha</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Tipo</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Descripción</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Monto</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Usuario</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reporteGastos.map((gasto, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-3 px-4">{new Date(gasto.fecha).toLocaleDateString()}</td>
                          <td className="py-3 px-4">{gasto.tipoGasto}</td>
                          <td className="py-3 px-4">{gasto.descripcion}</td>
                          <td className="py-3 px-4 text-red-600 font-medium">
                            ${gasto.monto.toFixed(2)}
                          </td>
                          <td className="py-3 px-4">{gasto.usuario}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Users Report */}
              {activeTab === 'usuarios' && (
                <div className="space-y-6">
                  <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-purple-600">Usuarios Activos</p>
                        <p className="text-2xl font-bold text-purple-900">
                          {reporteUsuarios.length}
                        </p>
                      </div>
                      <Users className="w-8 h-8 text-purple-600" />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Usuario</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Órdenes</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Total Ventas</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Promedio Venta</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Gastos</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Total Gastos</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reporteUsuarios.map((usuario, index) => (
                          <tr key={index} className="border-b border-gray-100">
                            <td className="py-3 px-4 font-medium">{usuario.usuario}</td>
                            <td className="py-3 px-4">{usuario.cantidadOrdenes}</td>
                            <td className="py-3 px-4 text-green-600 font-medium">
                              ${usuario.totalVentas.toFixed(2)}
                            </td>
                            <td className="py-3 px-4">
                              ${usuario.promedioVenta.toFixed(2)}
                            </td>
                            <td className="py-3 px-4">{usuario.cantidadGastos}</td>
                            <td className="py-3 px-4 text-red-600 font-medium">
                              ${usuario.totalGastos.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tables Report */}
              {activeTab === 'mesas' && (
                <div className="space-y-6">
                  <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-indigo-600">Mesas con Actividad</p>
                        <p className="text-2xl font-bold text-indigo-900">
                          {reporteMesas.length}
                        </p>
                      </div>
                      <Table className="w-8 h-8 text-indigo-600" />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Mesa</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Órdenes</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Total Ventas</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Promedio Venta</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Tiempo Promedio (min)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reporteMesas.map((mesa, index) => (
                          <tr key={index} className="border-b border-gray-100">
                            <td className="py-3 px-4 font-medium">{mesa.mesa}</td>
                            <td className="py-3 px-4">{mesa.cantidadOrdenes}</td>
                            <td className="py-3 px-4 text-green-600 font-medium">
                              ${mesa.totalVentas.toFixed(2)}
                            </td>
                            <td className="py-3 px-4">
                              ${mesa.promedioVenta.toFixed(2)}
                            </td>
                            <td className="py-3 px-4">{mesa.tiempoPromedioMinutos}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reportes;