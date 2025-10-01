  // Estado y función para eliminar orden

import React, { useState, useEffect, useRef } from 'react';
import { 
  Edit3, 
  Plus, 
  Minus, 
  Trash2, 
  Save,
  Search,
  ShoppingCart,
  AlertCircle,
  RefreshCw,
  StickyNote,
  ChevronDown,
  ChevronRight,
  Users,
  X
} from 'lucide-react';
import { apiService } from '../services/api';
import { Orden, Suborden, OrdenDetallePlatillo, OrdenDetalleProducto, Platillo, Guiso, Producto, MesaAgrupada, Extra, TipoExtra } from '../types';

const EditarOrden: React.FC = () => {
  // Estado para la cantidad de extras de C/queso
  const [cantidadQueso, setCantidadQueso] = useState(0);
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [mesasAgrupadas, setMesasAgrupadas] = useState<MesaAgrupada[]>([]);
  const [expandedMesas, setExpandedMesas] = useState<Set<number>>(new Set());
  const [selectedOrden, setSelectedOrden] = useState<Orden | null>(null);
  const [nombreCliente, setNombreCliente] = useState('');
  const [subordenes, setSubordenes] = useState<Suborden[]>([]);
  const [platillosDetalle, setPlatillosDetalle] = useState<OrdenDetallePlatillo[]>([]);
  const [productosDetalle, setProductosDetalle] = useState<OrdenDetalleProducto[]>([]);
  
  const [platillos, setPlatillos] = useState<Platillo[]>([]);
  const [guisos, setGuisos] = useState<Guiso[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  
  const [showAddPlatillo, setShowAddPlatillo] = useState(false);
  const [showAddProducto, setShowAddProducto] = useState(false);
  const [selectedPlatillo, setSelectedPlatillo] = useState<string>('');
  const [selectedGuiso, setSelectedGuiso] = useState<string>('');
  const [selectedProducto, setSelectedProducto] = useState<string>('');
  const [cantidad, setCantidad] = useState(1);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasNewOrders, setHasNewOrders] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());

  // Ensure the component always returns JSX

  // Estados para extras
  const [extras, setExtras] = useState<Extra[]>([]);
  const [tiposExtras, setTiposExtras] = useState<TipoExtra[]>([]);
  const [showExtrasModal, setShowExtrasModal] = useState(false);
  const [selectedPlatilloForExtras, setSelectedPlatilloForExtras] = useState<string | null>(null);
  const [tempExtras, setTempExtras] = useState<{platilloId: string, extraId: string, cantidad: number}[]>([]);

  // Confirmación para eliminar platillo/producto
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'platillo' | 'producto'; id: string } | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // Estados para editar notas de platillos
  const [editingNota, setEditingNota] = useState<string | null>(null);
  const [tempNota, setTempNota] = useState('');
  const [savingNota, setSavingNota] = useState(false);

  // Ref for order details section
  const orderDetailsRef = useRef<HTMLDivElement>(null);

  // Removed duplicate loadData and useEffect block
  const [deletingOrder, setDeletingOrder] = useState(false);
  const [showDeleteOrderModal, setShowDeleteOrderModal] = useState(false);
  const handleDeleteOrder = (orden: Orden) => {
    console.log('Abriendo modal de eliminar orden para:', orden._id);
    setSelectedOrden(orden);
    setShowDeleteOrderModal(true);
  };
  const confirmDeleteOrder = async () => {
    if (!selectedOrden) return;
    console.log('Intentando eliminar orden:', selectedOrden._id);
    setDeletingOrder(true);
    setError('');
    try {
      const response = await apiService.deleteOrden(selectedOrden._id!);
      console.log('Respuesta deleteOrden:', response);
      if (response.success) {
        setSuccess('Orden eliminada exitosamente');
        setSelectedOrden(null);
        await loadData();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Error eliminando la orden');
      }
    } catch (error) {
      setError('Error eliminando la orden');
      console.error('Error en confirmDeleteOrder:', error);
    } finally {
      setDeletingOrder(false);
      setShowDeleteOrderModal(false);
    }
  };

  // Function to group orders by table
  const groupOrdersByTable = (ordenes: Orden[]): MesaAgrupada[] => {
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

  useEffect(() => {
    loadData();
    // Set up polling for real-time updates
    const interval = setInterval(loadData, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
  try {
    const [ordenesRes, platillosRes, guisosRes, productosRes, extrasRes, tiposExtrasRes] = await Promise.all([
  apiService.getOrdenesActivas(),
      apiService.getCatalog<Platillo>('platillo'),
      apiService.getCatalog<Guiso>('guiso'),
      apiService.getCatalog<Producto>('producto'),
      apiService.getCatalog<Extra>('extra'),
      apiService.getCatalog<TipoExtra>('tipoextra')
    ]);

    // Filtrar órdenes editables
    if (ordenesRes.success) {
      const ordenesArray = Array.isArray(ordenesRes.data?.ordenes)
        ? ordenesRes.data.ordenes
        : Array.isArray(ordenesRes.data)
        ? ordenesRes.data
        : [];
      const ordenesEditables = ordenesArray.filter((orden: Orden) =>
        ['Recepcion', 'Preparacion', 'Pendiente', 'Surtida', 'Entregada'].includes(orden.estatus)
      );
      
      // Detectar nuevas órdenes editables
      const currentOrderIds = ordenes.map(o => o._id);
      const newOrderIds = ordenesEditables.map((o: any) => o._id);
      const hasNewData = newOrderIds.some((id: any) => !currentOrderIds.includes(id));
      
      if (hasNewData && ordenes.length > 0) {
        setHasNewOrders(true);
        setSuccess('Nuevas órdenes editables detectadas');
        setTimeout(() => {
          setHasNewOrders(false);
          setSuccess('');
        }, 5000);
      }
      
      setOrdenes(ordenesEditables);
      setLastUpdateTime(new Date());
      
      // Group orders by table
      const grouped = groupOrdersByTable(ordenesEditables);
      setMesasAgrupadas(grouped);
    }

    // Filtrar y adaptar catálogos
    if (platillosRes.success) {
      const platillosData = platillosRes.data?.items || platillosRes.data || [];
      setPlatillos(platillosData.filter((p: Platillo) => p.activo));
    }

    if (guisosRes.success) {
      const guisosData = guisosRes.data?.items || guisosRes.data || [];
      setGuisos(guisosData.filter((g: Guiso) => g.activo));
    }

    if (productosRes.success) {
      const productosData = productosRes.data?.items || productosRes.data || [];
      setProductos(productosData.filter((p: Producto) => p.activo));
    }

    if (extrasRes.success) {
      const extrasData = extrasRes.data?.items || extrasRes.data || [];
      const extrasActivos = extrasData.filter((e: Extra) => e.activo);
      setExtras(extrasActivos);
    }

    if (tiposExtrasRes.success) {
      const tiposExtrasData = tiposExtrasRes.data?.items || tiposExtrasRes.data || [];
      const tiposExtrasActivos = tiposExtrasData.filter((te: TipoExtra) => te.activo);
      setTiposExtras(tiposExtrasActivos);
    }
  } catch (error) {
    setError('Error cargando datos');
  } finally {
    setLoading(false);
  }
};

  // Función para gestionar cambios en extras
  const handleExtraChange = async (idExtra: string, isSelected: boolean) => {
    if (!selectedPlatilloForExtras) return;

    // Verificar si el platillo está entregado
    const platilloDetalle = platillosDetalle.find(p => p._id === selectedPlatilloForExtras);
    if (platilloDetalle?.entregado) {
      setError('No se pueden agregar extras a platillos entregados');
      return;
    }


    try {
      if (isSelected) {
        // Buscar la información del extra en el catálogo
        const extra = extras.find(e => e._id === idExtra);
        if (!extra) {
          setError('Extra no encontrado en el catálogo');
          return;
        }

        const response = await apiService.addDetalleExtra({
          idOrdenDetallePlatillo: selectedPlatilloForExtras,
          idExtra,
          nombreExtra: extra.nombre,
          costoExtra: extra.costo,
          cantidad: 1
        });
        
        
        if (response.success) {
          setSuccess('Extra agregado exitosamente');
          // Recargar los detalles de la orden
          if (selectedOrden) {
            await loadOrdenDetails(selectedOrden);
          }
          setTimeout(() => setSuccess(''), 3000);
        } else {
          setError('Error agregando extra: ' + (response.error || 'Error desconocido'));
        }
      } else {
        // Remover extra
        const platilloDetalle = platillosDetalle
          .find((d: any) => d._id === selectedPlatilloForExtras);
        
        const extraToRemove = platilloDetalle?.extras?.find((e: any) => e.idExtra === idExtra);
        
        
        if (extraToRemove && extraToRemove._id) {
          const response = await apiService.removeDetalleExtra(extraToRemove._id);
          
          
          if (response.success) {
            setSuccess('Extra removido exitosamente');
            // Recargar los detalles de la orden
            if (selectedOrden) {
              await loadOrdenDetails(selectedOrden);
            }
            setTimeout(() => setSuccess(''), 3000);
          } else {
            setError('Error removiendo extra: ' + (response.error || 'Error desconocido'));
          }
        } else {
          setError('No se encontró el extra para remover');
        }
      }
    } catch (error) {
      console.error('Error al gestionar extra:', error);
      setError('Error de conexión al gestionar extra');
    }
  };


  const loadOrdenDetails = async (orden: Orden) => {
    try {
      setSelectedOrden(orden);
      setNombreCliente(orden.nombreCliente || '');
      const response = await apiService.getOrdenDetails(orden._id!);
      
      if (response.success) {
        setSubordenes(response.data.subordenes || []);
        setPlatillosDetalle(response.data.platillos || []);
        setProductosDetalle(response.data.productos || []);

        // Scroll to order details on mobile
        setTimeout(() => {
          if (orderDetailsRef.current && window.innerWidth < 1280) { // xl breakpoint
            orderDetailsRef.current.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          }
        }, 100);
      } else {
        setError('Error cargando detalles de la orden');
        setSubordenes([]);
        setPlatillosDetalle([]);
        setProductosDetalle([]);
      }
    } catch (error) {
      setError('Error cargando detalles de la orden');
      setSubordenes([]);
      setPlatillosDetalle([]);
      setProductosDetalle([]);
    }
  };

  useEffect(() => {
    // Removed debug logs for cleaner code
  }, [platillos, guisos]);

  const handleRefresh = async () => {
    await loadData();
    if (selectedOrden) {
      await loadOrdenDetails(selectedOrden);
    }
  };

  const handleAddPlatillo = async () => {
  if (!selectedOrden || !selectedPlatillo || !selectedGuiso) {
    setError('Selecciona platillo y guiso');
    return;
  }

  setSaving(true);
  try {
    // Convertir los valores seleccionados a números
    const platilloId = Number(selectedPlatillo);
    const guisoId = Number(selectedGuiso);

    const platillo = platillos.find(p => Number(p._id) === platilloId);
    const guiso = guisos.find(g => Number(g._id) === guisoId);

    if (!platillo || !guiso) {
      setError('Platillo o guiso no válido');
      return;
    }

    let subordenId = '';
    if (subordenes.length === 0) {
      const subordenData = { nombre: 'Suborden 1' };
      const subordenResponse = await apiService.addSuborden(selectedOrden._id!, subordenData);
      if (subordenResponse.success) {
        subordenId = subordenResponse.data._id;
        setSubordenes([subordenResponse.data]);
      } else {
        setError('Error creando suborden');
        return;
      }
    } else {
      subordenId = subordenes[0]._id!;
    }

    const platilloData = {
      idPlatillo: platilloId,
      nombrePlatillo: platillo.nombre,
      idGuiso: guisoId,
      nombreGuiso: guiso.nombre,
      costoPlatillo: platillo.precio || platillo.costo,
      cantidad
    };

    const response = await apiService.addPlatillo(subordenId, platilloData);

    if (response.success) {
      if (selectedOrden.estatus !== 'Recepcion') {
        await apiService.updateOrdenStatus(selectedOrden._id!, 'Recepcion');
      }

      setSuccess('Platillo agregado exitosamente');
      await loadOrdenDetails(selectedOrden);
      setShowAddPlatillo(false);
      setSelectedPlatillo('');
      setSelectedGuiso('');
      setCantidad(1);
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError('Error agregando platillo');
    }
  } catch (error) {
    setError('Error agregando platillo');
  } finally {
    setSaving(false);
  }
};

  const handleAddProducto = async () => {
    if (!selectedOrden || !selectedProducto) {
      setError('Selecciona un producto');
      return;
    }

    setSaving(true);
    try {
      // Convertir el valor seleccionado a número
      const productoId = Number(selectedProducto);
      const producto = productos.find(p => Number(p._id) === productoId);
      if (!producto) {
        setError('Producto no válido');
        return;
      }

      const productoData = {
        idOrden: selectedOrden._id!,
        idProducto: productoId,
        nombreProducto: producto.nombre,
        costoProducto: producto.costo,
        cantidad
      };

      const response = await apiService.addProducto(selectedOrden._id!, productoData);

      if (response.success) {
        if (selectedOrden.estatus !== 'Recepcion') {
          await apiService.updateOrdenStatus(selectedOrden._id!, 'Recepcion');
        }

        setSuccess('Producto agregado exitosamente');
        await loadOrdenDetails(selectedOrden);
        setShowAddProducto(false);
        setSelectedProducto('');
        setCantidad(1);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Error agregando producto');
      }
    } catch (error) {
      setError('Error agregando producto');
    } finally {
      setSaving(false);
    }
  };

  const handleRemovePlatillo = async (id: string) => {
    setConfirmDelete({ type: 'platillo', id });
  };

  const handleRemoveProducto = async (id: string) => {
    setConfirmDelete({ type: 'producto', id });
  };

  const confirmDeleteAction = async () => {
    if (!selectedOrden || !confirmDelete) return;
    setSaving(true);
    setError('');
    try {
      let response;
      if (confirmDelete.type === 'platillo') {
        response = await apiService.removePlatillo(confirmDelete.id);
      } else {
        response = await apiService.removeProducto(confirmDelete.id);
      }
      if (response.success) {
        setSuccess(
          confirmDelete.type === 'platillo'
            ? 'Platillo eliminado exitosamente'
            : 'Producto eliminado exitosamente'
        );
        await loadOrdenDetails(selectedOrden);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(
          confirmDelete.type === 'platillo'
            ? 'Error eliminando platillo'
            : 'Error eliminando producto'
        );
      }
    } catch (error) {
      setError(
        confirmDelete.type === 'platillo'
          ? 'Error eliminando platillo'
          : 'Error eliminando producto'
      );
    } finally {
      setSaving(false);
      setConfirmDelete(null);
    }
  };

  // Funciones para manejar la edición de notas
  const handleEditNota = (platilloId: string, currentNota: string) => {
    setEditingNota(platilloId);
    setTempNota(currentNota || '');
  };

  const handleSaveNota = async (platilloId: string) => {
    if (!selectedOrden) return;
    
    setSavingNota(true);
    setError('');
    
    try {
      const response = await apiService.updatePlatilloNota(platilloId, tempNota);
      
      if (response.success) {
        setSuccess('Nota actualizada exitosamente');
        await loadOrdenDetails(selectedOrden);
        setEditingNota(null);
        setTempNota('');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Error actualizando la nota');
      }
    } catch (error) {
      setError('Error actualizando la nota');
    } finally {
      setSavingNota(false);
    }
  };

  const handleCancelEditNota = () => {
    setEditingNota(null);
    setTempNota('');
  };

  const handleUpdateStatus = async (ordenId: string, newStatus: string) => {
    setUpdatingStatus(ordenId);
    setError('');
    try {
      const response = await apiService.updateOrdenStatus(ordenId, newStatus);
      if (response.success) {
        setSuccess(`Orden actualizada a ${newStatus} exitosamente`);
        await loadData();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Error actualizando el estatus de la orden');
      }
    } catch (error) {
      setError('Error actualizando el estatus de la orden');
    } finally {
      setUpdatingStatus(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-3 sm:space-y-6 p-2 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-3 sm:mb-6">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">Editar Orden</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Selecciona una orden para ver detalles y modificar</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex-shrink-0 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center disabled:opacity-50"
          title="Actualizar"
        >
          <RefreshCw className={`w-4 h-4 mr-2 flex-shrink-0 ${loading ? 'animate-spin' : ''}`} />
          <span className="truncate">Actualizar</span>
        </button>
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

      <div className="grid gap-3 sm:gap-6 grid-cols-1 xl:grid-cols-2">
        {/* Orders List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-6 min-w-0">
          <div className="flex items-center space-x-2 mb-3 sm:mb-6">
            <Edit3 className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 flex-shrink-0" />
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 break-words">Órdenes Editables</h2>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {mesasAgrupadas.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                <p className="text-gray-500 text-sm sm:text-base">No hay órdenes disponibles para editar</p>
              </div>
            ) : (
              mesasAgrupadas.map((mesa) => (
                <div key={mesa.idMesa} className="bg-white rounded-xl shadow-sm border border-gray-200">
                  {/* Mesa Header - Clickable to expand/collapse */}
                  <div 
                    className="p-3 sm:p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleMesaExpansion(mesa.idMesa)}
                  >
                    <div className="flex items-center justify-between gap-2 sm:gap-3">
                      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 break-words hyphens-auto">
                            {mesa.nombreMesa}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">
                            {mesa.totalOrdenes} {mesa.totalOrdenes === 1 ? 'orden' : 'órdenes'}
                          </p>
                          {/* Lista de clientes de las órdenes en la mesa */}
                          {Object.keys(mesa.clientes).length > 0 && (
                            <ul className="mt-1 text-xs sm:text-sm text-gray-700 flex flex-wrap gap-1">
                              {Object.keys(mesa.clientes).map((cliente, idx) => (
                                <li key={cliente + idx} className="bg-gray-100 rounded px-2 py-0.5">
                                  {cliente}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                        <div className="text-right">
                          <p className="text-xs sm:text-base font-semibold text-green-600 whitespace-nowrap">
                            ${mesa.totalMonto.toFixed(2)}
                          </p>
                          <p className="text-[10px] sm:text-xs text-gray-600 whitespace-nowrap">Total</p>
                        </div>
                        {expandedMesas.has(mesa.idMesa) ? (
                          <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Orders grouped by client - Expanded view */}
                  {expandedMesas.has(mesa.idMesa) && (
                    <div className="p-3 sm:p-4">
                      <div className="space-y-3 sm:space-y-4">
                        {Object.entries(mesa.clientes).map(([cliente, ordenesCliente]) => (
                          <div key={cliente} className="bg-gray-50 rounded-lg p-3 sm:p-4">
                            <h4 className="font-medium text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base break-words">
                              Cliente: {cliente} ({ordenesCliente.length} {ordenesCliente.length === 1 ? 'orden' : 'órdenes'})
                            </h4>
                            <div className="grid grid-cols-1 gap-3 sm:gap-4">
                              {ordenesCliente.map((orden) => (
                                <div
                                  key={orden._id}
                                  className={`bg-white rounded-lg border p-3 sm:p-4 transition-colors ${
                                    selectedOrden?._id === orden._id
                                      ? 'border-orange-500 bg-orange-50'
                                      : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                                  }`}
                                >
                                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                                    <div 
                                      onClick={() => loadOrdenDetails(orden)}
                                      className="flex-1 cursor-pointer min-w-0"
                                    >
                                      <h5 className="font-medium text-gray-900 text-sm sm:text-base break-words">
                                        Orden #{orden._id?.toString().slice(-6)}
                                      </h5>
                                      {orden.notas && (
                                        <div className="flex items-start space-x-1 mt-1">
                                          <StickyNote className="w-3 h-3 text-yellow-600 mt-0.5 flex-shrink-0" />
                                          <p className="text-xs text-gray-700 italic line-clamp-2 break-words">
                                            {orden.notas}
                                          </p>
                                        </div>
                                      )}
                                      <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                        {new Date(orden.fechaHora ?? orden.fecha ?? '').toLocaleTimeString('es-ES', {
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </p>
                                      <p className="text-sm font-medium text-green-600 mt-1">
                                        Total: ${orden.total.toFixed(2)}
                                      </p>
                                    </div>
                                    <div className="flex flex-row sm:flex-col items-center sm:items-end space-x-2 sm:space-x-0 sm:space-y-2 flex-shrink-0">
                                      <span className="px-2 sm:px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 whitespace-nowrap">
                                        {orden.estatus}
                                      </span>
                                      {orden.estatus === 'Pendiente' && (
                                        <button
                                          onClick={() => handleUpdateStatus(orden._id!, 'Recepcion')}
                                          disabled={updatingStatus === orden._id}
                                          className="px-2 sm:px-3 py-1 text-xs bg-green-600 text-white rounded-full hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center whitespace-nowrap"
                                        >
                                          {updatingStatus === orden._id ? (
                                            <>
                                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1 flex-shrink-0"></div>
                                              <span className="hidden sm:inline">Actualizando...</span>
                                              <span className="sm:hidden">...</span>
                                            </>
                                          ) : (
                                            <span className="hidden sm:inline">Confirmar orden</span>
                                          )}
                                        </button>
                                      )}
                                      {/* Botón eliminar orden, solo para la orden seleccionada */}
                                      {selectedOrden?._id === orden._id && (
                                        <button
                                          onClick={() => handleDeleteOrder(orden)}
                                          disabled={deletingOrder}
                                          className="px-2 sm:px-3 py-1 text-xs bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors flex items-center whitespace-nowrap disabled:opacity-50"
                                          title="Eliminar orden"
                                        >
                                          {deletingOrder ? (
                                            <span className="flex items-center"><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></span>Eliminando...</span>
                                          ) : (
                                            <>
                                              <Trash2 className="w-3 h-3 mr-1 inline" /> Eliminar
                                            </>
                                          )}
                                        </button>
                                      )}
                                    </div>
                                  </div>
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
        <div ref={orderDetailsRef} className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-6 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-6 gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 break-words">
                {selectedOrden
                  ? `${selectedOrden.nombreMesa || 'Sin mesa'} | Folio: ${selectedOrden.folio}`
                  : 'Selecciona una orden'}
              </h2>
              {selectedOrden && selectedOrden.nombreCliente && (
                <p className="text-xs sm:text-sm text-gray-600 mt-1 break-words">
                  Cliente: <span className="font-medium">{selectedOrden.nombreCliente}</span>
                </p>
              )}
            </div>
            {selectedOrden && (
              <div className="flex flex-row space-x-2 flex-shrink-0">
                <button
                  onClick={() => setShowAddPlatillo(true)}
                  className="px-2 sm:px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-xs sm:text-sm flex items-center"
                >
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                  <span className="truncate">Platillo</span>
                </button>
                <button
                  onClick={() => setShowAddProducto(true)}
                  className="px-2 sm:px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm flex items-center"
                >
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                  <span className="truncate">Producto</span>
                </button>
              </div>
            )}
          </div>

          {!selectedOrden ? (
            <div className="text-center py-8 sm:py-12">
              <ShoppingCart className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
              <p className="text-gray-500 text-sm sm:text-base">Selecciona una orden para ver los detalles</p>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {/* Platillos */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">Platillos</h3>
                <div className="space-y-2">
                    {platillosDetalle.length === 0 ? (
                      <p className="text-gray-500 text-xs sm:text-sm">No hay platillos agregados</p>
                    ) : (
                      platillosDetalle.map((detalle, index) => (
                        <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{detalle.nombrePlatillo || detalle.platillo || `Platillo ${index + 1}`}</p>
                            
                            {/* Sección de notas - editable */}
                            {editingNota === detalle._id ? (
                              <div className="flex items-center space-x-2 mt-2">
                                <input
                                  type="text"
                                  value={tempNota}
                                  onChange={(e) => setTempNota(e.target.value)}
                                  className="flex-1 px-2 py-1 text-xs border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  placeholder="Escribe una nota..."
                                  disabled={savingNota}
                                />
                                <button
                                  onClick={() => handleSaveNota(detalle._id!)}
                                  disabled={savingNota}
                                  className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                                >
                                  {savingNota ? 'Guardando...' : 'Guardar'}
                                </button>
                                <button
                                  onClick={handleCancelEditNota}
                                  disabled={savingNota}
                                  className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
                                >
                                  Cancelar
                                </button>
                              </div>
                            ) : (
                              <div className="mt-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-start space-x-1 flex-1">
                                    <StickyNote className="w-3 h-3 text-yellow-600 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      {detalle.notas ? (
                                        <p className="text-xs text-blue-600 italic break-words">
                                          Notas: {detalle.notas}
                                        </p>
                                      ) : (
                                        <p className="text-xs text-gray-400 italic">
                                          Sin notas
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleEditNota(detalle._id!, detalle.notas || '')}
                                    className="ml-2 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex-shrink-0"
                                    title={detalle.notas ? "Editar nota" : "Agregar nota"}
                                  >
                                    {detalle.notas ? "Editar" : "Agregar"} nota
                                  </button>
                                </div>
                              </div>
                            )}
                            
                            <p className="text-xs sm:text-sm text-gray-600 truncate mt-1">Tipo: {detalle.idPlatillo ? detalle.idPlatillo : 'N/A'}</p>
                            <p className="text-xs sm:text-sm text-gray-600 truncate">Guiso: {detalle.nombreGuiso || detalle.guiso}</p>
                            <p className="text-xs sm:text-sm text-gray-600">Cantidad: {detalle.cantidad}</p>
                            
                            {/* Mostrar extras del platillo */}
                            {detalle.extras && detalle.extras.length > 0 && (
                              <div className="mt-2 p-2 bg-purple-50 rounded-md border border-purple-200">
                                <p className="text-xs font-medium text-purple-800 mb-1">Extras:</p>
                                <div className="space-y-1">
                                  {detalle.extras.map((extra, extraIndex) => (
                                    <div key={extraIndex} className="flex justify-between items-center text-xs">
                                      <span className="text-purple-700">
                                        {extra.nombreExtra} (x{extra.cantidad})
                                      </span>
                                      <span className="font-medium text-purple-600">
                                        ${(extra.costoExtra * extra.cantidad).toFixed(2)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Status indicators for dispatched items */}
                            <div className="flex flex-wrap gap-1 sm:gap-2 mt-2">
                              {detalle.listo && (
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full whitespace-nowrap">
                                  Listo
                                </span>
                              )}
                              {detalle.entregado && (
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full whitespace-nowrap">
                                  Entregado
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-end flex-shrink-0 space-x-2">
                            <button
                              onClick={() => {
                                setSelectedPlatilloForExtras(detalle._id!);
                                setShowExtrasModal(true);
                              }}
                              disabled={detalle.entregado}
                              className={`p-2 rounded-lg transition-colors ${
                                detalle.entregado 
                                  ? 'text-gray-400 cursor-not-allowed bg-gray-100' 
                                  : 'text-purple-600 hover:bg-purple-50'
                              }`}
                              title={detalle.entregado ? "No se pueden agregar extras a platillos entregados" : (detalle.extras && detalle.extras.length > 0 ? "Editar extras" : "Agregar extras")}
                            >
                              {detalle.extras && detalle.extras.length > 0 ? (
                                <Edit3 className="w-4 h-4" />
                              ) : (
                                <Plus className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleRemovePlatillo(detalle._id!)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Eliminar platillo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                </div>
              </div>

              {/* Productos */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">Productos</h3>
                <div className="space-y-2">
                    {productosDetalle.length === 0 ? (
                      <p className="text-gray-500 text-xs sm:text-sm">No hay productos agregados</p>
                    ) : (
                      productosDetalle.map((detalle, index) => (
                        <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{detalle.nombreProducto || detalle.producto || `Producto ${index + 1}`}</p>
                            <p className="text-xs sm:text-sm text-gray-600 truncate">Tipo: {detalle.idProducto ? detalle.idProducto : 'N/A'}</p>
                            <p className="text-xs sm:text-sm text-gray-600">Cantidad: {detalle.cantidad}</p>
                            {/* Status indicators for dispatched items */}
                            <div className="flex flex-wrap gap-1 sm:gap-2 mt-2">
                              {detalle.listo && (
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full whitespace-nowrap">
                                  Listo
                                </span>
                              )}
                              {detalle.entregado && (
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full whitespace-nowrap">
                                  Entregado
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-end flex-shrink-0">
                            <button
                              onClick={() => handleRemoveProducto(detalle._id!)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Eliminar producto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Platillo Modal */}
      {showAddPlatillo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl p-3 sm:p-6 w-full max-w-md">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Agregar Platillo</h3>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Platillo</label>
                <select
                  value={selectedPlatillo}
                  onChange={(e) => setSelectedPlatillo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                >
                  <option value="">Seleccionar platillo</option>
                  {(platillos || []).filter(p => p.activo).map((platillo) => (
                    <option key={platillo._id} value={platillo._id}>
                      {platillo.nombre} - ${platillo.precio || platillo.costo}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Guiso</label>
                <select
                  value={selectedGuiso}
                  onChange={(e) => setSelectedGuiso(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                >
                  <option value="">Seleccionar guiso</option>
                  {(guisos || []).filter(g => g.activo).map((guiso) => (
                    <option key={guiso._id} value={guiso._id}>
                      {guiso.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Cantidad</label>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                    className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 flex-shrink-0"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-base sm:text-lg font-semibold w-12 text-center">{cantidad}</span>
                  <button
                    onClick={() => setCantidad(cantidad + 1)}
                    className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 flex-shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {/* Input para cantidad de extras de queso */}
              <div className="flex flex-col gap-1 mt-2">
                <div className="flex items-center gap-2">
                  <label htmlFor="cantidad-queso" className="text-sm text-gray-700 select-none cursor-pointer">
                    Num. de platillos c/queso
                  </label>
                  <input
                    id="cantidad-queso"
                    type="number"
                    min={0}
                    max={cantidad}
                    value={cantidadQueso}
                    onChange={e => {
                      const val = Math.max(0, Math.min(Number(e.target.value), cantidad));
                      setCantidadQueso(val);
                    }}
                    className="w-16 px-2 py-1 border border-purple-300 rounded text-sm text-center"
                  />
                </div>
                {cantidadQueso > cantidad && (
                  <div className="text-xs text-red-600 bg-red-50 rounded px-2 py-1 mt-1">
                    No puedes agregar más extras de queso que el total de platillos ({cantidad}).
                  </div>
                )}
                {cantidadQueso > 0 && cantidadQueso <= cantidad ? (
                  <div className="text-xs text-purple-700 bg-purple-50 rounded px-2 py-1 mt-1">
                    Se agregarán {cantidadQueso} platillo(s) del total de creados, con queso.
                  </div>
                ) : cantidadQueso === 0 ? (
                  <div className="text-xs text-gray-500 px-2 py-1">
                    Puedes agregar extras de queso después desde el botón de extras.
                  </div>
                ) : null}
              </div>
              {/* Sección de extras eliminada. Ahora los extras se gestionan después de agregar el platillo. */}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
              <button
                onClick={() => setShowAddPlatillo(false)}
                className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm sm:text-base"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  await handleAddPlatillo();
                  // Después de agregar el platillo, si hay cantidad de queso, agregar ese número de extras automáticamente
                  if (selectedOrden && selectedPlatillo && selectedGuiso && cantidadQueso > 0) {
                    const response = await apiService.getOrdenDetails(selectedOrden._id!);
                    if (response.success) {
                      const platillos = response.data.platillos || [];
                      // Buscar el platillo más reciente con el idPlatillo y guiso seleccionados
                      const nuevoPlatillo = platillos.reverse().find((p: any) =>
                        String(p.idPlatillo) === String(selectedPlatillo) &&
                        String(p.idGuiso) === String(selectedGuiso)
                      );
                      if (nuevoPlatillo) {
                        const extraQueso = extras.find(e => e.nombre.toLowerCase().includes('queso'));
                        if (extraQueso) {
                          await apiService.addDetalleExtra({
                            idOrdenDetallePlatillo: nuevoPlatillo._id,
                            idExtra: extraQueso._id!,
                            nombreExtra: extraQueso.nombre,
                            costoExtra: extraQueso.costo,
                            cantidad: cantidadQueso
                          });
                          await loadOrdenDetails(selectedOrden);
                        }
                      }
                    }
                  }
                  setCantidadQueso(0); // Resetear el input
                }}
                disabled={saving || !selectedPlatillo || !selectedGuiso}
                className="flex-1 px-3 sm:px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 text-sm sm:text-base"
              >
                {saving ? 'Agregando...' : 'Agregar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Producto Modal */}
      {showAddProducto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl p-3 sm:p-6 w-full max-w-md">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Agregar Producto</h3>
            
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Producto</label>
                <select
                  value={selectedProducto}
                  onChange={(e) => setSelectedProducto(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                >
                  <option value="">Seleccionar producto</option>
                  {(productos || []).filter(p => p.activo).map((producto) => (
                    <option key={producto._id} value={producto._id}>
                      {producto.nombre} - ${producto.costo}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Cantidad</label>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                    className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 flex-shrink-0"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-base sm:text-lg font-semibold w-12 text-center">{cantidad}</span>
                  <button
                    onClick={() => setCantidad(cantidad + 1)}
                    className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 flex-shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
              <button
                onClick={() => setShowAddProducto(false)}
                className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm sm:text-base"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddProducto}
                disabled={saving || !selectedProducto}
                className="flex-1 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm sm:text-base"
              >
                {saving ? 'Agregando...' : 'Agregar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar platillo/producto */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl p-3 sm:p-6 w-full max-w-sm">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
              ¿Estás seguro que deseas eliminar este {confirmDelete.type === 'platillo' ? 'platillo' : 'producto'}?
            </h3>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm sm:text-base"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteAction}
                disabled={saving}
                className="flex-1 px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm sm:text-base"
              >
                {saving ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

  {/* Modal de Extras */}
  {showExtrasModal && selectedPlatilloForExtras && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-lg p-3 sm:p-6 max-w-md w-full max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-purple-700">
                Gestionar Extras - {platillosDetalle.find(p => p._id === selectedPlatilloForExtras)?.nombrePlatillo}
              </h3>
              <button
                onClick={() => {
                  setShowExtrasModal(false);
                  setSelectedPlatilloForExtras(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {tiposExtras.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500">No hay tipos de extras disponibles</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Tipos de extras: {tiposExtras.length}, Extras: {extras.length}
                  </p>
                </div>
              ) : (
                tiposExtras.map(tipo => {
                  const extrasDelTipo = extras.filter(e => e.idTipoExtra === tipo._id);
                  if (extrasDelTipo.length === 0) return null;

                  return (
                    <div key={tipo._id} className="border-b pb-3">
                      <h4 className="font-semibold text-purple-600 mb-2">{tipo.nombre}</h4>
                      <div className="grid gap-2">
                        {extrasDelTipo.map(extra => {
                          const platilloDetalle = platillosDetalle.find((d: any) => d._id === selectedPlatilloForExtras);
                          return (
                            <ExtraCantidadControl
                              key={extra._id}
                              extra={extra}
                              platilloDetalle={platilloDetalle}
                              selectedPlatilloForExtras={selectedPlatilloForExtras}
                              setError={setError}
                              setSuccess={setSuccess}
                              selectedOrden={selectedOrden}
                              loadOrdenDetails={loadOrdenDetails}
                              apiService={apiService}
                              setShowExtrasModal={setShowExtrasModal}
                              setSelectedPlatilloForExtras={setSelectedPlatilloForExtras}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* ...eliminado el botón 'Cerrar' de la parte inferior... */}
          </div>
        </div>
      )}
    </div>
    {/* Modal de confirmación para eliminar orden (dentro del fragmento raíz) */}
    {showDeleteOrderModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
        <div className="bg-white rounded-xl p-3 sm:p-6 w-full max-w-sm">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
            ¿Estás seguro que deseas eliminar esta orden? Esta acción no se puede deshacer.
          </h3>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
            <button
              onClick={() => setShowDeleteOrderModal(false)}
              disabled={deletingOrder}
              className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm sm:text-base"
            >
              Cancelar
            </button>
            <button
              onClick={() => { console.log('Click en botón Eliminar del modal'); confirmDeleteOrder(); }}
              disabled={deletingOrder}
              className="flex-1 px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm sm:text-base"
            >
              {deletingOrder ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </div>
      </div>
    )}
  </>
);
};

// Componente para controlar la cantidad de un extra (fuera del componente principal)
type ExtraCantidadControlProps = {
  extra: Extra;
  platilloDetalle: any;
  selectedPlatilloForExtras: string;
  setError: (msg: string) => void;
  setSuccess: (msg: string) => void;
  selectedOrden: Orden | null;
  loadOrdenDetails: (orden: Orden) => Promise<void>;
  apiService: typeof apiService;
  setShowExtrasModal: (show: boolean) => void;
  setSelectedPlatilloForExtras: (id: string | null) => void;
};

function ExtraCantidadControl(props: ExtraCantidadControlProps) {
  const {
    extra,
    platilloDetalle,
    selectedPlatilloForExtras,
    setError,
    setSuccess,
    selectedOrden,
    loadOrdenDetails,
    apiService,
    setShowExtrasModal,
    setSelectedPlatilloForExtras
  } = props;
  const extraDetalle = platilloDetalle?.extras?.find(function(e: any) { return e.idExtra === extra._id; });
  const cantidadExtra = extraDetalle?.cantidad || 0;
  const [inputCantidad, setInputCantidad] = React.useState(cantidadExtra);

  // El botón Guardar solo se habilita si la cantidad cambió respecto al guardado
  const cantidadCambiada = Number(inputCantidad) !== cantidadExtra;

  React.useEffect(function() {
    setInputCantidad(cantidadExtra);
  }, [cantidadExtra]);

  function handleCantidadChange(val: number) {
    if (platilloDetalle?.entregado) {
      setError('No se pueden modificar extras de platillos entregados');
      return;
    }
    if (val < 0) return;
    setInputCantidad(val);
  }

  async function guardarCantidad() {
    if (platilloDetalle?.entregado) {
      setError('No se pueden modificar extras de platillos entregados');
      return;
    }
    var nuevaCantidad = Number(inputCantidad);
    if (isNaN(nuevaCantidad) || nuevaCantidad < 0) return;
    if (nuevaCantidad === cantidadExtra) return;
    if (nuevaCantidad === 0 && extraDetalle && extraDetalle._id) {
      // Eliminar extra
      var response = await apiService.removeDetalleExtra(extraDetalle._id);
      if (response.success) {
        setSuccess('Extra removido exitosamente');
        if (selectedOrden) await loadOrdenDetails(selectedOrden);
        setTimeout(function() { setSuccess(''); }, 3000);
        setShowExtrasModal(false);
        setSelectedPlatilloForExtras(null);
      } else {
        setError('Error removiendo extra: ' + (response.error || 'Error desconocido'));
      }
    } else if (nuevaCantidad > 0) {
      // Si ya existe, elimina y agrega con la nueva cantidad
      if (extraDetalle && extraDetalle._id) {
        await apiService.removeDetalleExtra(extraDetalle._id);
      }
      var response2 = await apiService.addDetalleExtra({
        idOrdenDetallePlatillo: selectedPlatilloForExtras,
        idExtra: String(extra._id),
        nombreExtra: extra.nombre,
        costoExtra: extra.costo,
        cantidad: nuevaCantidad
      });
      if (response2.success) {
        setSuccess('Cantidad actualizada');
        if (selectedOrden) await loadOrdenDetails(selectedOrden);
        setTimeout(function() { setSuccess(''); }, 3000);
        setShowExtrasModal(false);
        setSelectedPlatilloForExtras(null);
      } else {
        setError('Error actualizando cantidad: ' + (response2.error || 'Error desconocido'));
      }
    }
  }

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center space-x-2">
        <span className="text-sm">{extra.nombre}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-sm font-semibold text-purple-600">
          +${extra.costo}
        </span>
        <button
          className="p-1 bg-gray-200 rounded"
          onClick={function() { handleCantidadChange(Number(inputCantidad) - 1); }}
          disabled={platilloDetalle?.entregado || Number(inputCantidad) <= 0}
        >
          <Minus className="w-3 h-3" />
        </button>
        <input
          type="number"
          min={0}
          value={inputCantidad}
          onChange={function(e) { handleCantidadChange(Number(e.target.value)); }}
          className="w-12 text-center border border-purple-300 rounded px-1 py-0.5 text-xs"
          disabled={platilloDetalle?.entregado}
        />
        <button
          className="p-1 bg-gray-200 rounded"
          onClick={function() { handleCantidadChange(Number(inputCantidad) + 1); }}
          disabled={platilloDetalle?.entregado}
        >
          <Plus className="w-3 h-3" />
        </button>
        <button
          className="ml-2 px-2 py-1 bg-purple-600 text-white rounded text-xs font-bold hover:bg-purple-700"
          onClick={guardarCantidad}
          disabled={platilloDetalle?.entregado || !cantidadCambiada}
        >
          Guardar
        </button>
      </div>
    </div>
  );
}

export default EditarOrden;