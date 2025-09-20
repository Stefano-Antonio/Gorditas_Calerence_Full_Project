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
  Plus,
  X,
  Save,
  Trash2
} from 'lucide-react';
import { apiService } from '../services/api';
import ExcelJS from 'exceljs';

interface VentaPorDia {
  _id: string;
  ventas: number;
  ordenes: number;
}

interface GastoPorDia {
  _id: string;
  gastos: number;
  cantidad: number;
}

interface ReporteVentas {
  fecha: string;
  ventasTotales: number;
  gastosTotales: number;
  utilidad: number;
  ordenes: number;
  montoCaja?: number; // Nuevo campo para el monto de caja
}

interface ProductoInventario {
  nombre: string;
  cantidad: number;
  costo: number;
}

interface ReporteInventario {
  producto: ProductoInventario;
  valorTotal: number;
  stockMinimo: boolean;
}

interface ProductoVendido {
  nombre: string;
  cantidadVendida: number;
  totalVendido: number;
}

interface Gasto {
  _id: string;
  nombre: string;
  idTipoGasto: number;
  nombreTipoGasto: string;
  gastoTotal: number;
  descripcion: string;
  fecha: Date;
  createdAt: Date;
  updatedAt: Date;
}

const Reportes: React.FC = () => {
  const [activeTab, setActiveTab] = useState('ventas');
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0]);
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);
  
  const [reporteVentas, setReporteVentas] = useState<ReporteVentas[]>([]);
  const [reporteInventario, setReporteInventario] = useState<ReporteInventario[]>([]);
  const [productosVendidos, setProductosVendidos] = useState<ProductoVendido[]>([]);
  const [reporteGastos, setReporteGastos] = useState<Gasto[]>([]);
  
  const [ordenes, setOrdenes] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [platillos, setPlatillos] = useState<any[]>([]);
  const [extras, setExtras] = useState<any[]>([]);
  const [ordenesDia, setOrdenesDia] = useState<any[]>([]);
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null);
  const [ordenExpandida, setOrdenExpandida] = useState<string | null>(null);
  
  // Expense management states
  const [showGastoModal, setShowGastoModal] = useState(false);
  const [tiposGasto, setTiposGasto] = useState<any[]>([]);
  const [nuevoGasto, setNuevoGasto] = useState({
    nombre: '',
    idTipoGasto: '',
    gastoTotal: 0,
    descripcion: ''
  });
  const [savingGasto, setSavingGasto] = useState(false);
  const [deletingGasto, setDeletingGasto] = useState<string | null>(null);
  
  // Estados para la funcionalidad de caja
  const [montoCajaPorFecha, setMontoCajaPorFecha] = useState<{[fecha: string]: number}>({});
  const [editandoCaja, setEditandoCaja] = useState<string | null>(null);
  const [montoTemporal, setMontoTemporal] = useState<number>(0);
  const [guardandoCaja, setGuardandoCaja] = useState<string | null>(null);
  
  // Estados para editar caja del día actual en el recuadro superior
  const [editandoCajaDiaActual, setEditandoCajaDiaActual] = useState<boolean>(false);
  const [montoAgregarCaja, setMontoAgregarCaja] = useState<number>(0);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Cargar datos de caja desde localStorage
  const cargarMontoCaja = () => {
    const cajaDatos = localStorage.getItem('montoCajaPorFecha');
    if (cajaDatos) {
      setMontoCajaPorFecha(JSON.parse(cajaDatos));
    }
  };

  // Guardar monto de caja en localStorage
  const guardarMontoCaja = (fecha: string, monto: number) => {
    const nuevosMontos = { ...montoCajaPorFecha, [fecha]: monto };
    setMontoCajaPorFecha(nuevosMontos);
    localStorage.setItem('montoCajaPorFecha', JSON.stringify(nuevosMontos));
  };

  // Función para calcular utilidad con caja
  const calcularUtilidadConCaja = (ventasTotales: number, gastosTotales: number, fecha: string): number => {
    const montoCaja = montoCajaPorFecha[fecha] || 0;
    return (ventasTotales + montoCaja) - gastosTotales;
  };

  // Funciones para manejar la edición de caja
  const iniciarEdicionCaja = (fecha: string) => {
    setEditandoCaja(fecha);
    setMontoTemporal(montoCajaPorFecha[fecha] || 0);
  };

  const cancelarEdicionCaja = () => {
    setEditandoCaja(null);
    setMontoTemporal(0);
  };

  const confirmarEdicionCaja = async () => {
    if (editandoCaja) {
      setGuardandoCaja(editandoCaja);
      try {
        guardarMontoCaja(editandoCaja, montoTemporal);
        setEditandoCaja(null);
        setMontoTemporal(0);
      } catch (error) {
        console.error('Error al guardar el monto de caja:', error);
      } finally {
        setGuardandoCaja(null);
      }
    }
  };

  // Funciones para manejar la caja del día actual (recuadro superior)
  const obtenerFechaActualUTC = (): string => {
    const hoy = new Date();
    return hoy.toISOString().split('T')[0]; // YYYY-MM-DD en UTC
  };

  const iniciarEdicionCajaDiaActual = () => {
    const fechaActual = obtenerFechaActualUTC();
    setEditandoCajaDiaActual(true);
    setMontoAgregarCaja(0);
  };

  const cancelarEdicionCajaDiaActual = () => {
    setEditandoCajaDiaActual(false);
    setMontoAgregarCaja(0);
  };

  const confirmarAgregarCajaDiaActual = async () => {
    const fechaActual = obtenerFechaActualUTC();
    const montoActual = montoCajaPorFecha[fechaActual] || 0;
    const nuevoMonto = montoActual + montoAgregarCaja;
    
    console.log(`Agregando $${montoAgregarCaja} a caja del ${fechaActual}`);
    console.log(`Monto anterior: $${montoActual}, Nuevo monto: $${nuevoMonto}`);
    
    guardarMontoCaja(fechaActual, nuevoMonto);
    setEditandoCajaDiaActual(false);
    setMontoAgregarCaja(0);
  };

  useEffect(() => {
    cargarMontoCaja();
  }, []);

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

            const ventasFormateadas: ReporteVentas[] = [];
            const ventasPorDia = ventasRes.data.ventasPorDia || [];
            const ordenes = ventasRes.data.ordenes || [];
            const productos = ventasRes.data.productos || [];
            const platillos = ventasRes.data.platillos || [];
            const extras = ventasRes.data.extras || [];

            setOrdenes(ordenes);
            setProductos(productos);
            setPlatillos(platillos);
            setExtras(extras);

            console.log('Órdenes cargadas:', ordenes.length);
            console.log('Extras cargados:', extras.length);
            console.log('=== DATOS DEL BACKEND PARA DEPURACIÓN (UTC) ===');
            console.log('VentasPorDia (fechas procesadas en UTC):', ventasPorDia);
            console.log('Fechas específicas del resumen (UTC):', ventasPorDia.map((v: any) => v._id));
            console.log('Estructura completa de ventasPorDia:', ventasPorDia.map((v: any) => ({
              fecha: v._id,
              ventas: v.ventas,
              ordenes: v.ordenes
            })));
            console.log('=== MUESTRA DE ÓRDENES INDIVIDUALES ===');
            console.log('Primeras 3 órdenes con fechas:', ordenes.slice(0, 3).map((o: any) => ({ 
              folio: o.folio, 
              fechaHora: o.fechaHora, 
              fechaPago: o.fechaPago,
              estatus: o.estatus 
            })));

            if (ventasPorDia.length > 0) {
              // Obtener los gastos del mismo período
              const gastosRes = await apiService.getReporteGastos(fechaInicio, fechaFin);
              const gastosPorDia = gastosRes.success 
                ? (gastosRes.data.gastosPorDia || []).reduce((acc: {[key: string]: number}, gasto: any) => {
                    acc[gasto._id] = gasto.gastos || 0;
                    return acc;
                  }, {})
                : {};

              // Procesar cada venta
              for (const venta of ventasPorDia) {
                const fecha = venta._id;
                const ventasTotales = venta.ventas || 0;
                const gastosTotales = gastosPorDia[fecha] || 0;
                
                ventasFormateadas.push({
                  fecha,
                  ventasTotales,
                  gastosTotales,
                  utilidad: ventasTotales - gastosTotales,
                  ordenes: venta.ordenes || 0
                });
              }

              // Ordenar por fecha descendente
              ventasFormateadas.sort((a, b) => 
                new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
              );
            }

            setReporteVentas(ventasFormateadas);
          }
          break;
          
        case 'inventario':
          const inventarioRes = await apiService.getReporteInventario();
          if (inventarioRes.success) {
            const inventarioFormateado = inventarioRes.data.productos.map((producto: any) => ({
              producto: {
                nombre: producto.nombre,
                cantidad: producto.cantidad,
                costo: producto.costo
              },
              valorTotal: producto.cantidad * producto.costo,
              stockMinimo: producto.cantidad <= 5
            }));
            setReporteInventario(inventarioFormateado);
          }
          break;
          
        case 'productos':
          const productosRes = await apiService.getProductosVendidos();
          if (productosRes.success) {
            // Combinar productos y platillos vendidos
            const todosProductos = [
              ...productosRes.data.productos.map((p: any) => ({
                nombre: p._id.nombreProducto,
                cantidadVendida: p.cantidadVendida,
                totalVendido: p.totalVentas
              })),
              ...productosRes.data.platillos.map((p: any) => ({
                nombre: p._id.nombrePlatillo,
                cantidadVendida: p.cantidadVendida,
                totalVendido: p.totalVentas
              }))
            ];
            setProductosVendidos(todosProductos);
          }
          break;
          
        case 'gastos':
          const gastosRes = await apiService.getReporteGastos(fechaInicio, fechaFin);
          if (gastosRes.success) {
            setReporteGastos(gastosRes.data.gastos);
          }
          break;
      }
    } catch (error) {
      setError('Error cargando reportes');
      console.error('Error en loadReports:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load tipos de gasto when gastos tab is selected
  useEffect(() => {
    if (activeTab === 'gastos' && tiposGasto.length === 0) {
      loadTiposGasto();
    }
  }, [activeTab]);

  const loadTiposGasto = async () => {
    try {
      const response = await apiService.getCatalog('tipogasto');
      if (response.success) {
        const tiposArray = response.data?.items || response.data || [];
        setTiposGasto(tiposArray);
      }
    } catch (error) {
      console.error('Error loading tipos de gasto:', error);
    }
  };

  const handleCreateGasto = async () => {
    if (!nuevoGasto.nombre || !nuevoGasto.idTipoGasto || nuevoGasto.gastoTotal <= 0) {
      setError('Por favor completa todos los campos requeridos');
      return;
    }

    setSavingGasto(true);
    setError('');

    try {
      const response = await apiService.createGasto(nuevoGasto);
      
      if (response.success) {
        setShowGastoModal(false);
        setNuevoGasto({
          nombre: '',
          idTipoGasto: '',
          gastoTotal: 0,
          descripcion: ''
        });
        // Reload gastos after creation
        loadReports();
      } else {
        setError('Error creando el gasto');
      }
    } catch (error) {
      setError('Error creando el gasto');
    } finally {
      setSavingGasto(false);
    }
  };

  const handleDeleteGasto = async (gastoId: string, nombreGasto: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el gasto "${nombreGasto}"?`)) {
      return;
    }

    setDeletingGasto(gastoId);
    setError('');

    try {
      const response = await apiService.deleteGasto(gastoId);
      
      if (response.success) {
        // Reload gastos after deletion
        loadReports();
      } else {
        setError('Error eliminando el gasto');
      }
    } catch (error) {
      setError('Error eliminando el gasto');
    } finally {
      setDeletingGasto(null);
    }
  };

  
  const handleExportReport = async () => {
    let data: Array<Record<string, any>> = [];
    if (activeTab === 'ventas' && diaSeleccionado && ordenesDia.length > 0) {
      // Exportar órdenes del día seleccionado
      data = ordenesDia.map(orden => ({
        Folio: orden.folio,
        Mesa: orden.idMesa || 'N/A',
        Tipo: orden.nombreTipoOrden,
        Total: orden.total,
        Hora: new Date(orden.fechaHora).toLocaleTimeString(),
        Fecha: new Date(orden.fechaHora).toLocaleDateString(),
      }));
    } else if (activeTab === 'ventas' && !diaSeleccionado && ordenes.length > 0) {
      // Exportar todas las órdenes del filtro de fechas cuando no hay día seleccionado
      const ordenesFiltradas = ordenes.filter((orden: any) => {
        if (orden.estatus !== 'Pagada') return false;
        if (!orden.fechaHora) return false;
        
        const fechaOrdenUTC = obtenerFechaDelDia(orden.fechaHora);
        return fechaOrdenUTC >= fechaInicio && fechaOrdenUTC <= fechaFin;
      });
      
      data = ordenesFiltradas.map(orden => ({
        Folio: orden.folio,
        Cliente: orden.nombreCliente || 'Sin nombre',
        Mesa: orden.idMesa || 'N/A',
        Tipo: orden.nombreTipoOrden,
        Total: orden.total,
        Fecha: new Date(orden.fechaHora).toLocaleDateString(),
        Hora: new Date(orden.fechaHora).toLocaleTimeString(),
      }));
    } else if (activeTab === 'inventario') {
      data = reporteInventario.map(item => ({
        Producto: item.producto.nombre,
        Cantidad: item.producto.cantidad,
        'Costo Unitario': item.producto.costo,
        'Valor Total': item.valorTotal,
        Estado: item.stockMinimo ? 'Stock Bajo' : 'Normal',
      }));
    } else if (activeTab === 'productos') {
      data = productosVendidos.map(prod => ({
        Producto: prod.nombre,
        'Cantidad Vendida': prod.cantidadVendida,
        'Total Vendido': prod.totalVendido,
      }));
    } else if (activeTab === 'gastos') {
      data = reporteGastos.map(gasto => ({
        Fecha: new Date(gasto.fecha).toLocaleDateString(),
        Nombre: gasto.nombre,
        Tipo: gasto.nombreTipoGasto,
        Descripción: gasto.descripcion,
        Monto: gasto.gastoTotal,
      }));
    }

    if (data.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte');

    // Agregar encabezados
    worksheet.columns = Object.keys(data[0]).map(key => ({ header: key, key }));

    // Agregar filas
    data.forEach(row => worksheet.addRow(row));

    // Descargar el archivo
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_${activeTab}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'ventas', name: 'Ventas', icon: TrendingUp },
    { id: 'inventario', name: 'Inventario', icon: Package },
    { id: 'productos', name: 'Productos Vendidos', icon: BarChart3 },
    { id: 'gastos', name: 'Gastos', icon: DollarSign },
  ];

  const getTotalVentas = () => {
    return reporteVentas.reduce((total, reporte) => 
      total + (reporte.ventasTotales || 0), 0
    );
  };

  const getTotalCaja = () => {
    return reporteVentas.reduce((total, reporte) => 
      total + (montoCajaPorFecha[reporte.fecha] || 0), 0
    );
  };

  const getCajaDiaActual = () => {
    const fechaActual = obtenerFechaActualUTC();
    return montoCajaPorFecha[fechaActual] || 0;
  };

  const getTotalIngresosConCaja = () => {
    return getTotalVentas() + getTotalCaja();
  };

  const getTotalGastos = () => {
    return reporteVentas.reduce((total, reporte) => 
      total + (reporte.gastosTotales || 0), 0
    );
  };

  const getTotalUtilidad = () => {
    const totalIngresos = getTotalIngresosConCaja();
    const totalGastos = getTotalGastos();
    return totalIngresos - totalGastos;
  };

  const getTotalInventario = () => {
    return reporteInventario.reduce((total, item) => total + item.valorTotal, 0);
  };

  // Función auxiliar para obtener fecha en formato YYYY-MM-DD usando UTC
  // Esta función debe replicar EXACTAMENTE la lógica del backend MongoDB:
  // $dateToString: { format: '%Y-%m-%d', date: '$fechaHora' } (sin timezone = UTC)
  const obtenerFechaDelDia = (fecha: string | Date): string => {
    const fechaObj = new Date(fecha);
    
    // Verificar que la fecha sea válida
    if (isNaN(fechaObj.getTime())) {
      console.warn(`Fecha inválida recibida: ${fecha}`);
      return '';
    }
    
    // Obtener la fecha en UTC (sin conversión de timezone)
    // Esto debe coincidir exactamente con el backend que usa UTC
    const fechaUTCStr = fechaObj.toISOString().split('T')[0]; // YYYY-MM-DD
    
    console.log(`Conversión de fecha UTC: ${fecha} -> ${fechaUTCStr} (UTC, igual que backend)`);
    
    return fechaUTCStr; // Ya viene en formato YYYY-MM-DD
  };

  const mostrarOrdenesDeDia = (fecha: string) => {
    console.log('=== USANDO FECHA DIRECTA DEL RESUMEN DEL BACKEND (UTC) ===');
    console.log('Fecha seleccionada del resumen:', fecha);
    console.log('Esta fecha YA fue procesada por el backend usando UTC (sin timezone)');
    console.log('Filtro de fechas activo:', { fechaInicio, fechaFin });
    console.log('Órdenes disponibles:', ordenes.length);
    
    // Si no hay órdenes, mostrar array vacío
    if (ordenes.length === 0) {
      setOrdenesDia([]);
      setDiaSeleccionado(fecha);
      setOrdenExpandida(null);
      return;
    }
    
    // Verificar que la fecha seleccionada esté dentro del rango del filtro
    if (fecha < fechaInicio || fecha > fechaFin) {
      console.log(`❌ La fecha ${fecha} está fuera del rango permitido (${fechaInicio} - ${fechaFin})`);
      setOrdenesDia([]);
      setDiaSeleccionado(fecha);
      setOrdenExpandida(null);
      return;
    }
    
    console.log('=== FILTRADO CON LÓGICA IDÉNTICA AL BACKEND (UTC) ===');
    console.log(`Buscando órdenes que en UTC corresponden a: ${fecha}`);
    console.log('Aplicando misma lógica que el backend: $dateToString sin timezone (UTC)');
    
    // Filtrar órdenes usando EXACTAMENTE la misma lógica que el backend
    const ordenesFiltradas = ordenes.filter((orden: any) => {
      // Solo órdenes pagadas (mismo filtro que el backend)
      if (orden.estatus !== 'Pagada') {
        return false;
      }
      
      // Usar fechaHora y aplicar EXACTAMENTE la misma conversión que el backend
      if (!orden.fechaHora) {
        return false;
      }
      
      // Replicar exactamente: $dateToString: { format: '%Y-%m-%d', date: '$fechaHora' } (UTC)
      const fechaOrdenUTC = obtenerFechaDelDia(orden.fechaHora);
      
      // La fecha debe coincidir exactamente con la fecha del resumen
      const coincideFecha = fechaOrdenUTC === fecha;
      
      if (coincideFecha) {
        console.log(`✅ Orden ${orden.folio}: fechaHora=${orden.fechaHora} -> UTC=${fechaOrdenUTC} -> COINCIDE`);
      }
      
      return coincideFecha;
    });
    
    console.log(`🎯 Total órdenes encontradas para ${fecha}: ${ordenesFiltradas.length}`);
    console.log('Resumen de órdenes filtradas:');
    ordenesFiltradas.forEach((orden: any, index: number) => {
      console.log(`  ${index + 1}. Folio: ${orden.folio}, Total: $${orden.total}, FechaHora: ${orden.fechaHora}`);
    });
    
    setOrdenesDia(ordenesFiltradas);
    setDiaSeleccionado(fecha);
    setOrdenExpandida(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Reportes</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Análisis y estadísticas del restaurante</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={loadReports}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center text-sm"
          >
            <RefreshCw className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Actualizar</span>
            <span className="sm:hidden">Act.</span>
          </button>
          <button
            onClick={handleExportReport}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center text-sm"
          >
            <Download className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Exportar</span>
            <span className="sm:hidden">Exp.</span>
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
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex min-w-max space-x-2 sm:space-x-8 p-2 sm:px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-1 sm:space-x-2 py-2 sm:py-4 px-3 sm:px-4 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">{tab.name}</span>
                  <span className="sm:hidden">{tab.name.split(' ')[0]}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Date Filter */}
        {(activeTab === 'ventas' || activeTab === 'gastos') && (
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:space-x-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Período:</span>
                </div>
                <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2 sm:gap-4">
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="w-full sm:w-auto px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <span className="hidden sm:block text-gray-500">hasta</span>
                  <input
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="w-full sm:w-auto px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              
              {/* Create Expense Button - only show in gastos tab */}
              {activeTab === 'gastos' && (
                <button
                  onClick={() => setShowGastoModal(true)}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Gasto
                </button>
              )}
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                    <div className="bg-green-50 p-4 sm:p-6 rounded-lg border border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs sm:text-sm text-green-600">Total Ventas</p>
                          <p className="text-xl sm:text-2xl font-bold text-green-900">
                            ${getTotalVentas().toFixed(2)}
                          </p>
                        </div>
                        <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
                      </div>
                    </div>

                    <div className="bg-blue-50 p-4 sm:p-6 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-xs sm:text-sm text-blue-600">Total Caja</p>
                          <p className="text-xl sm:text-2xl font-bold text-blue-900">
                            ${getTotalCaja().toFixed(2)}
                          </p>
                          <p className="text-xs text-blue-500 mt-1">
                            Hoy: ${getCajaDiaActual().toFixed(2)}
                          </p>
                          {editandoCajaDiaActual ? (
                            <div className="flex items-center space-x-2 mt-2">
                              <input
                                type="number"
                                value={montoAgregarCaja}
                                onChange={(e) => setMontoAgregarCaja(parseFloat(e.target.value) || 0)}
                                className="w-24 px-2 py-1 border border-gray-300 rounded text-xs"
                                placeholder="Agregar..."
                                step="0.01"
                                min="0"
                                autoFocus
                              />
                              <button
                                onClick={confirmarAgregarCajaDiaActual}
                                className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
                                title="Agregar a caja de hoy"
                              >
                                ✓ Agregar
                              </button>
                              <button
                                onClick={cancelarEdicionCajaDiaActual}
                                className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                                title="Cancelar"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={iniciarEdicionCajaDiaActual}
                              className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 mt-2"
                              title="Agregar dinero a caja de hoy"
                            >
                              💰 Agregar a Caja
                            </button>
                          )}
                        </div>
                        <Package className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                      </div>
                    </div>
                    
                    <div className="bg-red-50 p-4 sm:p-6 rounded-lg border border-red-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs sm:text-sm text-red-600">Total Gastos</p>
                          <p className="text-xl sm:text-2xl font-bold text-red-900">
                            ${getTotalGastos().toFixed(2)}
                          </p>
                        </div>
                        <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
                      </div>
                    </div>
                    
                    <div className="bg-purple-50 p-4 sm:p-6 rounded-lg border border-purple-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs sm:text-sm text-purple-600">Utilidad Final</p>
                          <p className="text-xl sm:text-2xl font-bold text-purple-900">
                            ${getTotalUtilidad().toFixed(2)}
                          </p>
                          <p className="text-xs text-purple-500 mt-1">
                            (Ventas + Caja) - Gastos
                          </p>
                        </div>
                        <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
                      </div>
                    </div>
                  </div>

                  {/* Sales Summary Table */}
                  <div className="overflow-x-auto -mx-6 sm:mx-0">
                    <div className="inline-block min-w-full align-middle">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen por Día</h3>
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr className="text-xs sm:text-sm">
                            <th className="text-left py-2 sm:py-3 px-3 sm:px-4 font-medium text-gray-900">Fecha</th>
                            <th className="text-left py-2 sm:py-3 px-3 sm:px-4 font-medium text-gray-900">Ventas</th>
                            <th className="text-left py-2 sm:py-3 px-3 sm:px-4 font-medium text-gray-900">Caja</th>
                            <th className="text-left py-2 sm:py-3 px-3 sm:px-4 font-medium text-gray-900">Órdenes</th>
                            <th className="text-left py-2 sm:py-3 px-3 sm:px-4 font-medium text-gray-900">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {reporteVentas.map((reporte, index) => (
                            <tr key={index} className="text-xs sm:text-sm">
                              <td className="py-2 sm:py-3 px-3 sm:px-4 whitespace-nowrap">
                                {(() => {
                                  // Usar directamente la fecha del backend (ya procesada en UTC)
                                  // Esta fecha viene de ventasPorDia._id que usa $dateToString sin timezone (UTC)
                                  const [año, mes, dia] = reporte.fecha.split('-');
                                  const fechaFormateada = `${dia}/${mes}/${año}`;
                                  
                                  console.log(`📅 Fecha del backend (UTC): ${reporte.fecha} -> mostrada como: ${fechaFormateada}`);
                                  
                                  return fechaFormateada;
                                })()}
                              </td>
                              <td className="py-2 sm:py-3 px-3 sm:px-4 text-green-600 font-medium whitespace-nowrap">
                                ${reporte.ventasTotales.toFixed(2)}
                              </td>
                              <td className="py-2 sm:py-3 px-3 sm:px-4 whitespace-nowrap">
                                {editandoCaja === reporte.fecha ? (
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="number"
                                      value={montoTemporal}
                                      onChange={(e) => setMontoTemporal(parseFloat(e.target.value) || 0)}
                                      className="w-20 px-2 py-1 border border-gray-300 rounded text-xs"
                                      placeholder="0.00"
                                      step="0.01"
                                      min="0"
                                    />
                                    <button
                                      onClick={confirmarEdicionCaja}
                                      disabled={guardandoCaja === reporte.fecha}
                                      className="bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600 disabled:opacity-50"
                                    >
                                      {guardandoCaja === reporte.fecha ? '...' : '✓'}
                                    </button>
                                    <button
                                      onClick={cancelarEdicionCaja}
                                      className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center space-x-2">
                                    <span className="text-blue-600 font-medium">
                                      ${(montoCajaPorFecha[reporte.fecha] || 0).toFixed(2)}
                                    </span>
                                    <button
                                      onClick={() => iniciarEdicionCaja(reporte.fecha)}
                                      className="bg-gray-500 text-white px-2 py-1 rounded text-xs hover:bg-gray-600"
                                    >
                                      ✏️
                                    </button>
                                  </div>
                                )}
                              </td>
                              <td className="py-2 sm:py-3 px-3 sm:px-4 whitespace-nowrap">{reporte.ordenes}</td>
                              <td className="py-2 sm:py-3 px-3 sm:px-4">
                                <button
                                  className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
                                  onClick={() => {
                                    console.log('Haciendo clic en fecha:', reporte.fecha);
                                    console.log('Órdenes totales disponibles:', ordenes.length);
                                    mostrarOrdenesDeDia(reporte.fecha);
                                  }}
                                >
                                  Ver órdenes
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  {/* Tabla de órdenes del día */}
                  {diaSeleccionado && (
                    <div className="mt-6">
                      <h3 className="font-bold text-lg mb-2">
                        Órdenes del día {diaSeleccionado}
                        <button className="ml-4 text-sm text-gray-500" onClick={() => setDiaSeleccionado(null)}>
                          Cerrar
                        </button>
                      </h3>
                      <div className="overflow-x-auto w-full">
                        <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
                          <thead>
                            <tr>
                              <th className="text-left px-2 py-2 w-1/6 font-medium text-gray-900">Folio</th>
                              <th className="text-center px-2 py-2 w-1/6 font-medium text-gray-900">Cliente</th>
                              <th className="text-left px-2 py-2 w-1/6 font-medium text-gray-900">Mesa</th>
                              <th className="text-right px-2 py-2 w-1/6 font-medium text-gray-900">Total</th>
                              <th className="text-center px-2 py-2 w-1/6 font-medium text-gray-900">Hora</th>
                              <th className="text-center px-2 py-2 w-1/6 font-medium text-gray-900">Detalles</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ordenesDia.map(orden => {
                              const productosOrden = productos.filter(p => p.idOrden === orden._id);
                              const platillosOrden = platillos.filter(pl => {
                                // Verificar si el platillo pertenece a esta orden
                                // Comparar los primeros 7 caracteres para mayor flexibilidad
                                if (!pl.idSuborden || !orden._id) return false;
                                
                                // Primero intentar coincidencia exacta del idOrden si existe
                                if (pl.idOrden === orden._id) return true;
                                
                                // Si no, verificar por prefijo de suborden (timestamp similar)
                                const ordenPrefix = orden._id.slice(0, 7);
                                const subOrdenPrefix = pl.idSuborden.slice(0, 7);
                                return ordenPrefix === subOrdenPrefix;
                              });

                              // Crear un mapa de platillos con sus extras
                              const platillosConExtras = platillosOrden.map(platillo => {
                                const extrasDelPlatillo = extras.filter(extra => 
                                  extra.idOrdenDetallePlatillo === platillo._id
                                );
                                
                                // Debug específico para esta orden
                                if (orden._id === ordenExpandida) {
                                  console.log(`Platillo ${platillo.nombrePlatillo} (ID: ${platillo._id})`);
                                  console.log(`Extras encontrados: ${extrasDelPlatillo.length}`);
                                  if (extrasDelPlatillo.length > 0) {
                                    console.log('Extras:', extrasDelPlatillo);
                                  }
                                }
                                
                                return {
                                  ...platillo,
                                  extras: extrasDelPlatillo
                                };
                              });
                              
                              return (
                                <React.Fragment key={orden._id}>
                                  <tr>
                                    <td className="text-left px-2 py-2 w-1/6">{orden.folio}</td>
                                    <td className="text-center px-2 py-2 w-1/6">{orden.nombreCliente || 'Sin nombre'}</td>
                                    <td className="text-left px-2 py-2 w-1/6">
                                      {orden.idMesa ? `Mesa ${orden.idMesa}` : orden.nombreTipoOrden}
                                    </td>
                                    <td className="text-right px-2 py-2 w-1/6">${orden.total.toFixed(2)}</td>
                                    <td className="text-center px-2 py-2 w-1/6">{new Date(orden.fechaHora).toLocaleTimeString()}</td>
                                    <td className="text-center px-2 py-2 w-1/6">
                                      <button
                                        className="bg-orange-500 text-white px-2 py-1 rounded text-xs"
                                        onClick={() => setOrdenExpandida(orden._id === ordenExpandida ? null : orden._id)}
                                      >
                                        {orden._id === ordenExpandida ? 'Ocultar' : 'Ver Detalles'}
                                      </button>
                                    </td>
                                  </tr>
                                  {orden._id === ordenExpandida && (
                                    <tr>
                                      <td colSpan={6} className="p-0">
                                        <div className="bg-gray-50 p-2 sm:p-4 rounded-lg overflow-x-auto">
                                          <h4 className="font-semibold mb-2 text-xs sm:text-sm">Productos</h4>
                                          {productosOrden.length > 0 ? (
                                            <div className="overflow-x-auto">
                                              <table className="min-w-full mb-2 text-xs sm:text-sm">
                                                <thead>
                                                  <tr>
                                                    <th className="text-left px-2 py-2 w-1/2 font-medium text-gray-900">Nombre</th>
                                                    <th className="text-center px-2 py-2 w-1/4 font-medium text-gray-900">Cantidad</th>
                                                    <th className="text-right px-2 py-2 w-1/4 font-medium text-gray-900">Importe</th>
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {productosOrden.map(prod => (
                                                    <tr key={prod._id}>
                                                      <td className="text-left px-2 py-2 w-1/2">{prod.nombreProducto}</td>
                                                      <td className="text-center px-2 py-2 w-1/4">{prod.cantidad}</td>
                                                      <td className="text-right px-2 py-2 w-1/4">${prod.importe.toFixed(2)}</td>
                                                    </tr>
                                                  ))}
                                                  {productosOrden.length > 0 && (
                                                    <tr className="border-t border-gray-300 font-semibold bg-gray-50">
                                                      <td className="text-left px-2 py-2 w-1/2">Total Productos</td>
                                                      <td className="text-center px-2 py-2 w-1/4">
                                                        {productosOrden.reduce((sum, prod) => sum + prod.cantidad, 0)}
                                                      </td>
                                                      <td className="text-right px-2 py-2 w-1/4">
                                                        ${productosOrden.reduce((sum, prod) => sum + prod.importe, 0).toFixed(2)}
                                                      </td>
                                                    </tr>
                                                  )}
                                                </tbody>
                                              </table>
                                            </div>
                                          ) : (
                                            <p className="text-gray-500 text-xs sm:text-sm">No hay productos.</p>
                                          )}
                                          <h4 className="font-semibold mb-2 text-xs sm:text-sm">Platillos</h4>
                                          {platillosConExtras.length > 0 ? (
                                            <div className="overflow-x-auto">
                                              <table className="min-w-full text-xs sm:text-sm">
                                                <thead>
                                                  <tr>
                                                    <th className="text-left px-2 py-2 w-2/5 font-medium text-gray-900">Nombre</th>
                                                    <th className="text-left px-2 py-2 w-2/5 font-medium text-gray-900">Guiso</th>
                                                    <th className="text-center px-2 py-2 w-1/10 font-medium text-gray-900">Cantidad</th>
                                                    <th className="text-right px-2 py-2 w-1/10 font-medium text-gray-900">Importe</th>
                                                  </tr>
                                                </thead>
                                                <tbody>
                                                  {platillosConExtras.map(pl => (
                                                    <React.Fragment key={pl._id}>
                                                      <tr>
                                                        <td className="text-left px-2 py-2 w-2/5">{pl.nombrePlatillo}</td>
                                                        <td className="text-left px-2 py-2 w-2/5">{pl.nombreGuiso}</td>
                                                        <td className="text-center px-2 py-2 w-1/10">{pl.cantidad}</td>
                                                        <td className="text-right px-2 py-2 w-1/10">${pl.importe.toFixed(2)}</td>
                                                      </tr>
                                                      {/* Mostrar extras si existen */}
                                                      {pl.extras && pl.extras.length > 0 ? pl.extras.map((extra: any) => (
                                                        <tr key={extra._id} className="bg-purple-50">
                                                          <td className="text-left px-2 py-1 w-2/5 pl-6 text-purple-700 italic">
                                                            + {extra.nombreExtra}
                                                          </td>
                                                          <td className="text-left px-2 py-1 w-2/5 text-purple-600 italic">
                                                            Extra
                                                          </td>
                                                          <td className="text-center px-2 py-1 w-1/10 text-purple-700">
                                                            {extra.cantidad}
                                                          </td>
                                                          <td className="text-right px-2 py-1 w-1/10 text-purple-700">
                                                            ${extra.importe?.toFixed(2) || '0.00'}
                                                          </td>
                                                        </tr>
                                                      )) : (
                                                        <tr key={`${pl._id}-no-extras`} className="bg-gray-50">
                                                          <td className="text-left px-2 py-1 w-2/5 pl-6 text-gray-500 italic text-xs">
                                                            Sin extras
                                                          </td>
                                                          <td className="text-left px-2 py-1 w-2/5 text-gray-500 italic text-xs">
                                                            -
                                                          </td>
                                                          <td className="text-center px-2 py-1 w-1/10 text-gray-500 text-xs">
                                                            -
                                                          </td>
                                                          <td className="text-right px-2 py-1 w-1/10 text-gray-500 text-xs">
                                                            $0.00
                                                          </td>
                                                        </tr>
                                                      )}
                                                    </React.Fragment>
                                                  ))}
                                                  {platillosConExtras.length > 0 && (
                                                    <tr className="border-t border-gray-300 font-semibold bg-gray-50">
                                                      <td className="text-left px-2 py-2 w-2/5" colSpan={2}>Total Platillos</td>
                                                      <td className="text-center px-2 py-2 w-1/10">
                                                        {platillosConExtras.reduce((sum, pl) => sum + pl.cantidad, 0)}
                                                      </td>
                                                      <td className="text-right px-2 py-2 w-1/10">
                                                        ${platillosConExtras.reduce((sum, pl) => {
                                                          const platilloTotal = pl.importe || 0;
                                                          const extrasTotal = pl.extras?.reduce((extraSum: number, extra: any) => 
                                                            extraSum + (extra.importe || 0), 0) || 0;
                                                          return sum + platilloTotal + extrasTotal;
                                                        }, 0).toFixed(2)}
                                                      </td>
                                                    </tr>
                                                  )}
                                                </tbody>
                                              </table>
                                            </div>
                                          ) : (
                                            <p className="text-gray-500 text-xs sm:text-sm">No hay platillos.</p>
                                          )}
                                          
                                          {/* Mostrar extras independientes si los hay */}
                                          {(() => {
                                            const extrasIndependientes = extras.filter(extra => {
                                              // Verificar si el extra pertenece a esta orden pero no está vinculado a un platillo específico
                                              const pertenece = platillosConExtras.some(pl => 
                                                pl.extras?.some((e: any) => e._id === extra._id)
                                              );
                                              return !pertenece && (
                                                extra.idOrden === orden._id ||
                                                (orden._id && extra.idOrdenDetallePlatillo && 
                                                 extra.idOrdenDetallePlatillo.slice(0, 7) === orden._id.slice(0, 7))
                                              );
                                            });
                                            
                                            if (extrasIndependientes.length > 0) {
                                              return (
                                                <>
                                                  <h4 className="font-semibold mb-2 text-xs sm:text-sm mt-4">Extras Adicionales</h4>
                                                  <div className="overflow-x-auto">
                                                    <table className="min-w-full text-xs sm:text-sm">
                                                      <thead>
                                                        <tr>
                                                          <th className="text-left px-2 py-2 w-1/2 font-medium text-gray-900">Extra</th>
                                                          <th className="text-center px-2 py-2 w-1/4 font-medium text-gray-900">Cantidad</th>
                                                          <th className="text-right px-2 py-2 w-1/4 font-medium text-gray-900">Importe</th>
                                                        </tr>
                                                      </thead>
                                                      <tbody>
                                                        {extrasIndependientes.map(extra => (
                                                          <tr key={extra._id} className="bg-purple-50">
                                                            <td className="text-left px-2 py-2 w-1/2 text-purple-700">
                                                              {extra.nombreExtra}
                                                            </td>
                                                            <td className="text-center px-2 py-2 w-1/4 text-purple-700">
                                                              {extra.cantidad}
                                                            </td>
                                                            <td className="text-right px-2 py-2 w-1/4 text-purple-700">
                                                              ${extra.importe?.toFixed(2) || '0.00'}
                                                            </td>
                                                          </tr>
                                                        ))}
                                                      </tbody>
                                                    </table>
                                                  </div>
                                                </>
                                              );
                                            }
                                            return null;
                                          })()}
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
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
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Nombre</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Tipo</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Descripción</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Monto</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-900">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reporteGastos.map((gasto, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-3 px-4">{new Date(gasto.fecha).toLocaleDateString()}</td>
                          <td className="py-3 px-4 font-medium">{gasto.nombre}</td>
                          <td className="py-3 px-4">{gasto.nombreTipoGasto}</td>
                          <td className="py-3 px-4">{gasto.descripcion}</td>
                          <td className="py-3 px-4 text-red-600 font-medium">
                            ${gasto.gastoTotal?.toFixed(2) || '0.00'}
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => handleDeleteGasto(gasto._id, gasto.nombre)}
                              disabled={deletingGasto === gasto._id}
                              className="text-red-600 hover:text-red-800 disabled:opacity-50 transition-colors p-1"
                              title="Eliminar gasto"
                            >
                              {deletingGasto === gasto._id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                      {reporteGastos.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-gray-500">
                            No hay gastos registrados en este período
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create Expense Modal */}
      {showGastoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Crear Nuevo Gasto</h3>
              <button
                onClick={() => setShowGastoModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Gasto
                </label>
                <input
                  type="text"
                  value={nuevoGasto.nombre}
                  onChange={(e) => setNuevoGasto({ ...nuevoGasto, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Ej: Compra de ingredientes"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Gasto
                </label>
                <select
                  value={nuevoGasto.idTipoGasto}
                  onChange={(e) => setNuevoGasto({ ...nuevoGasto, idTipoGasto: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Selecciona un tipo</option>
                  {tiposGasto.map((tipo) => (
                    <option key={tipo._id} value={tipo._id}>
                      {tipo.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={nuevoGasto.gastoTotal}
                  onChange={(e) => setNuevoGasto({ ...nuevoGasto, gastoTotal: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción (Opcional)
                </label>
                <textarea
                  value={nuevoGasto.descripcion}
                  onChange={(e) => setNuevoGasto({ ...nuevoGasto, descripcion: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  rows={3}
                  placeholder="Detalles adicionales del gasto..."
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowGastoModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateGasto}
                disabled={savingGasto}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center"
              >
                {savingGasto ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Crear Gasto
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default Reportes;