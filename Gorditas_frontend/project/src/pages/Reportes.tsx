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
  ReporteProductosVendidos, 
  ReporteGastos, 
  ReporteUsuarios, 
  ReporteMesas 
} from '../types';

const Reportes: React.FC = () => {
  const [activeTab, setActiveTab] = useState('ventas');
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0]);
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);
  
  // State for each report type
  const [reporteVentas, setReporteVentas] = useState<ReporteVentas | null>(null);
  const [reporteInventario, setReporteInventario] = useState<ReporteInventario | null>(null);
  const [productosVendidos, setProductosVendidos] = useState<ReporteProductosVendidos | null>(null);
  const [reporteGastos, setReporteGastos] = useState<ReporteGastos | null>(null);
  const [reporteUsuarios, setReporteUsuarios] = useState<ReporteUsuarios | null>(null);
  const [reporteMesas, setReporteMesas] = useState<ReporteMesas | null>(null);
  
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
          if (ventasRes.success) {
            setReporteVentas(ventasRes.data);
          } else {
            setError('Error cargando reporte de ventas');
          }
          break;
          
        case 'inventario':
          const inventarioRes = await apiService.getReporteInventario();
          if (inventarioRes.success) {
            setReporteInventario(inventarioRes.data);
          } else {
            setError('Error cargando reporte de inventario');
          }
          break;
          
        case 'productos':
          const productosRes = await apiService.getProductosVendidos(fechaInicio, fechaFin);
          if (productosRes.success) {
            setProductosVendidos(productosRes.data);
          } else {
            setError('Error cargando productos vendidos');
          }
          break;
          
        case 'gastos':
          const gastosRes = await apiService.getReporteGastos(fechaInicio, fechaFin);
          if (gastosRes.success) {
            setReporteGastos(gastosRes.data);
          } else {
            setError('Error cargando reporte de gastos');
          }
          break;

        case 'usuarios':
          const usuariosRes = await apiService.getReporteUsuarios(fechaInicio, fechaFin);
          if (usuariosRes.success) {
            setReporteUsuarios(usuariosRes.data);
          } else {
            setError('Error cargando reporte de usuarios');
          }
          break;

        case 'mesas':
          const mesasRes = await apiService.getReporteMesas(fechaInicio, fechaFin);
          if (mesasRes.success) {
            setReporteMesas(mesasRes.data);
          } else {
            setError('Error cargando reporte de mesas');
          }
          break;
      }
    } catch (error) {
      setError('Error cargando reportes: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = () => {
    // In a real implementation, you would generate and download a CSV/PDF
    alert('Funcionalidad de exportación en desarrollo');
  };

  const tabs = [
    { id: 'ventas', name: 'Ventas', icon: TrendingUp },
    { id: 'inventario', name: 'Inventario', icon: Package },
    { id: 'productos', name: 'Productos Vendidos', icon: BarChart3 },
    { id: 'gastos', name: 'Gastos', icon: DollarSign },
    { id: 'usuarios', name: 'Usuarios', icon: Users },
    { id: 'mesas', name: 'Mesas', icon: Table },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('es-MX');
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
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
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
        {['ventas', 'gastos', 'productos', 'usuarios', 'mesas'].includes(activeTab) && (
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
              {activeTab === 'ventas' && reporteVentas && (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-green-600">Total Ventas</p>
                          <p className="text-2xl font-bold text-green-900">
                            {formatCurrency(reporteVentas.resumen.totalVentas)}
                          </p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-green-600" />
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-blue-600">Total Órdenes</p>
                          <p className="text-2xl font-bold text-blue-900">
                            {reporteVentas.resumen.cantidadOrdenes}
                          </p>
                        </div>
                        <BarChart3 className="w-8 h-8 text-blue-600" />
                      </div>
                    </div>
                    
                    <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-purple-600">Promedio por Venta</p>
                          <p className="text-2xl font-bold text-purple-900">
                            {formatCurrency(reporteVentas.resumen.promedioVenta)}
                          </p>
                        </div>
                        <DollarSign className="w-8 h-8 text-purple-600" />
                      </div>
                    </div>
                  </div>

                  {/* Charts */}
                  {reporteVentas.ventasPorDia.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Ventas por Día</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-2 px-4">Fecha</th>
                              <th className="text-left py-2 px-4">Ventas</th>
                              <th className="text-left py-2 px-4">Órdenes</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reporteVentas.ventasPorDia.map((dia, index) => (
                              <tr key={index} className="border-b border-gray-100">
                                <td className="py-2 px-4">{dia._id}</td>
                                <td className="py-2 px-4 text-green-600 font-medium">
                                  {formatCurrency(dia.ventas)}
                                </td>
                                <td className="py-2 px-4">{dia.ordenes}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Inventory Report */}
              {activeTab === 'inventario' && reporteInventario && (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-600">Total Productos</p>
                      <p className="text-xl font-bold text-blue-900">
                        {reporteInventario.resumen.totalProductos}
                      </p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <p className="text-sm text-yellow-600">Stock Bajo</p>
                      <p className="text-xl font-bold text-yellow-900">
                        {reporteInventario.resumen.stockBajo}
                      </p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                      <p className="text-sm text-red-600">Stock Agotado</p>
                      <p className="text-xl font-bold text-red-900">
                        {reporteInventario.resumen.stockAgotado}
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <p className="text-sm text-green-600">Valor Inventario</p>
                      <p className="text-xl font-bold text-green-900">
                        {formatCurrency(reporteInventario.resumen.valorInventario)}
                      </p>
                    </div>
                  </div>

                  {/* Inventory Table */}
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
                        {reporteInventario.productos.map((item, index) => (
                          <tr key={index} className="border-b border-gray-100">
                            <td className="py-3 px-4 font-medium">{item.producto.nombre}</td>
                            <td className="py-3 px-4">{item.producto.cantidad}</td>
                            <td className="py-3 px-4">{formatCurrency(item.producto.costo)}</td>
                            <td className="py-3 px-4 font-medium">{formatCurrency(item.valorTotal)}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  item.stockAgotado
                                    ? 'bg-red-100 text-red-800'
                                    : item.stockMinimo
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-green-100 text-green-800'
                                }`}
                              >
                                {item.stockAgotado ? 'Agotado' : item.stockMinimo ? 'Stock Bajo' : 'Normal'}
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
              {activeTab === 'productos' && productosVendidos && (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                      <h3 className="text-lg font-medium text-blue-900 mb-2">Productos</h3>
                      <p className="text-sm text-blue-600">Total Vendido: {productosVendidos.resumen.totalProductosVendidos}</p>
                      <p className="text-sm text-blue-600">Ingresos: {formatCurrency(productosVendidos.resumen.ingresosTotalProductos)}</p>
                    </div>
                    <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                      <h3 className="text-lg font-medium text-green-900 mb-2">Platillos</h3>
                      <p className="text-sm text-green-600">Total Vendido: {productosVendidos.resumen.totalPlatillosVendidos}</p>
                      <p className="text-sm text-green-600">Ingresos: {formatCurrency(productosVendidos.resumen.ingresosTotalPlatillos)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Products Table */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Productos Más Vendidos</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-3 px-4 font-medium text-gray-900">Producto</th>
                              <th className="text-left py-3 px-4 font-medium text-gray-900">Cantidad</th>
                              <th className="text-left py-3 px-4 font-medium text-gray-900">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {productosVendidos.productos.map((producto, index) => (
                              <tr key={index} className="border-b border-gray-100">
                                <td className="py-3 px-4 font-medium">{producto.nombre}</td>
                                <td className="py-3 px-4">{producto.cantidadVendida}</td>
                                <td className="py-3 px-4 text-green-600 font-medium">
                                  {formatCurrency(producto.totalVendido)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Dishes Table */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Platillos Más Vendidos</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-3 px-4 font-medium text-gray-900">Platillo</th>
                              <th className="text-left py-3 px-4 font-medium text-gray-900">Cantidad</th>
                              <th className="text-left py-3 px-4 font-medium text-gray-900">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {productosVendidos.platillos.map((platillo, index) => (
                              <tr key={index} className="border-b border-gray-100">
                                <td className="py-3 px-4 font-medium">{platillo.nombre}</td>
                                <td className="py-3 px-4">{platillo.cantidadVendida}</td>
                                <td className="py-3 px-4 text-green-600 font-medium">
                                  {formatCurrency(platillo.totalVendido)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Expenses Report */}
              {activeTab === 'gastos' && reporteGastos && (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-red-50 p-6 rounded-lg border border-red-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-red-600">Total Gastos</p>
                          <p className="text-2xl font-bold text-red-900">
                            {formatCurrency(reporteGastos.resumen.totalGastos)}
                          </p>
                        </div>
                        <DollarSign className="w-8 h-8 text-red-600" />
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-blue-600">Cantidad Gastos</p>
                          <p className="text-2xl font-bold text-blue-900">
                            {reporteGastos.resumen.cantidadGastos}
                          </p>
                        </div>
                        <BarChart3 className="w-8 h-8 text-blue-600" />
                      </div>
                    </div>
                    
                    <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-purple-600">Promedio por Gasto</p>
                          <p className="text-2xl font-bold text-purple-900">
                            {formatCurrency(reporteGastos.resumen.promedioGasto)}
                          </p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-purple-600" />
                      </div>
                    </div>
                  </div>

                  {/* Expenses Table */}
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
                        {reporteGastos.gastos.map((gasto, index) => (
                          <tr key={index} className="border-b border-gray-100">
                            <td className="py-3 px-4">{formatDate(gasto.fecha)}</td>
                            <td className="py-3 px-4">{gasto.tipoGasto}</td>
                            <td className="py-3 px-4">{gasto.descripcion}</td>
                            <td className="py-3 px-4 text-red-600 font-medium">
                              {formatCurrency(gasto.monto)}
                            </td>
                            <td className="py-3 px-4">{gasto.usuario}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Users Report */}
              {activeTab === 'usuarios' && reporteUsuarios && (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-blue-600">Usuarios Activos</p>
                          <p className="text-2xl font-bold text-blue-900">
                            {reporteUsuarios.resumen.totalUsuariosActivos}
                          </p>
                        </div>
                        <Users className="w-8 h-8 text-blue-600" />
                      </div>
                    </div>
                    
                    <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-green-600">Ventas Totales</p>
                          <p className="text-2xl font-bold text-green-900">
                            {formatCurrency(reporteUsuarios.resumen.ventasTotales)}
                          </p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-green-600" />
                      </div>
                    </div>
                    
                    <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-purple-600">Órdenes Totales</p>
                          <p className="text-2xl font-bold text-purple-900">
                            {reporteUsuarios.resumen.ordenesTotales}
                          </p>
                        </div>
                        <BarChart3 className="w-8 h-8 text-purple-600" />
                      </div>
                    </div>
                  </div>

                  {/* Users Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Usuario</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Órdenes</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Ventas Totales</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Promedio por Venta</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reporteUsuarios.usuarios.map((usuario, index) => (
                          <tr key={index} className="border-b border-gray-100">
                            <td className="py-3 px-4 font-medium">{usuario.nombreUsuario}</td>
                            <td className="py-3 px-4">{usuario.totalOrdenes}</td>
                            <td className="py-3 px-4 text-green-600 font-medium">
                              {formatCurrency(usuario.totalVentas)}
                            </td>
                            <td className="py-3 px-4">{formatCurrency(usuario.promedioVenta)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tables Report */}
              {activeTab === 'mesas' && reporteMesas && (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-blue-600">Mesas Activas</p>
                          <p className="text-2xl font-bold text-blue-900">
                            {reporteMesas.resumen.totalMesas}
                          </p>
                        </div>
                        <Table className="w-8 h-8 text-blue-600" />
                      </div>
                    </div>
                    
                    <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-green-600">Ventas Totales</p>
                          <p className="text-2xl font-bold text-green-900">
                            {formatCurrency(reporteMesas.resumen.ventasTotales)}
                          </p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-green-600" />
                      </div>
                    </div>
                    
                    <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-purple-600">Órdenes Totales</p>
                          <p className="text-2xl font-bold text-purple-900">
                            {reporteMesas.resumen.ordenesTotales}
                          </p>
                        </div>
                        <BarChart3 className="w-8 h-8 text-purple-600" />
                      </div>
                    </div>
                  </div>

                  {/* Tables Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Mesa</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Órdenes</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Ventas Totales</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Promedio por Venta</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Última Orden</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reporteMesas.mesas.map((mesa, index) => (
                          <tr key={index} className="border-b border-gray-100">
                            <td className="py-3 px-4 font-medium">{mesa.nombreMesa}</td>
                            <td className="py-3 px-4">{mesa.totalOrdenes}</td>
                            <td className="py-3 px-4 text-green-600 font-medium">
                              {formatCurrency(mesa.totalVentas)}
                            </td>
                            <td className="py-3 px-4">{formatCurrency(mesa.promedioVenta)}</td>
                            <td className="py-3 px-4">{formatDate(mesa.ultimaOrden)}</td>
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