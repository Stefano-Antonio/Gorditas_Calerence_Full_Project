import React, { useState, useEffect } from 'react';
import { 
  Edit3, 
  Plus, 
  Minus, 
  Trash2, 
  Save,
  Search,
  ShoppingCart,
  AlertCircle
} from 'lucide-react';
import { apiService } from '../services/api';
import { Orden, Suborden, OrdenDetallePlatillo, OrdenDetalleProducto, Platillo, Guiso, Producto } from '../types';

const EditarOrden: React.FC = () => {
  const [ordenes, setOrdenes] = useState<Orden[]>([]);
  const [selectedOrden, setSelectedOrden] = useState<Orden | null>(null);
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

  // Confirmación para eliminar platillo/producto
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'platillo' | 'producto'; id: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
  try {
    const [ordenesRes, platillosRes, guisosRes, productosRes] = await Promise.all([
      apiService.getOrdenes(),
      apiService.getCatalog<Platillo>('platillo'),
      apiService.getCatalog<Guiso>('guiso'),
      apiService.getCatalog<Producto>('producto')
    ]);

    // Filtrar órdenes editables
    if (ordenesRes.success) {
      const ordenesArray = Array.isArray(ordenesRes.data?.ordenes)
        ? ordenesRes.data.ordenes
        : Array.isArray(ordenesRes.data)
        ? ordenesRes.data
        : [];
      const ordenesEditables = ordenesArray.filter((orden: Orden) =>
        ['Recepcion', 'Preparacion', 'Pendiente', 'Surtida'].includes(orden.estatus)
      );
      setOrdenes(ordenesEditables);
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
  } catch (error) {
    setError('Error cargando datos');
  } finally {
    setLoading(false);
  }
};


  const loadOrdenDetails = async (orden: Orden) => {
    try {
      setSelectedOrden(orden);
      const response = await apiService.getOrdenDetails(orden._id!);
      
      if (response.success) {
        setSubordenes(response.data.subordenes || []);
        setPlatillosDetalle(response.data.platillos || []);
        setProductosDetalle(response.data.productos || []);
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
    console.log('Platillos disponibles:', platillos);
    console.log('Guisos disponibles:', guisos);
  }, [platillos, guisos]);

  const handleAddPlatillo = async () => {
  console.log('Inicio de handleAddPlatillo');
  console.log('Platillos disponibles:', platillos);
  console.log('Guisos disponibles:', guisos);
  console.log('Platillo seleccionado:', selectedPlatillo);
  console.log('Guiso seleccionado:', selectedGuiso);
  console.log('Cantidad seleccionada:', cantidad);

  if (!selectedOrden || !selectedPlatillo || !selectedGuiso) {
    console.warn('No se encontró platillo o guiso:', { selectedPlatillo, selectedGuiso, platillos, guisos });
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

    console.log('Llamando a apiService.addPlatillo con:', subordenId, platilloData);
    const response = await apiService.addPlatillo(subordenId, platilloData);
    console.log('Respuesta del backend:', response);

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
    console.log('Fin de handleAddPlatillo');
  }
};

  const handleAddProducto = async () => {
    console.log('Inicio de handleAddProducto');
    console.log('Productos disponibles:', productos);
    console.log('Producto seleccionado:', selectedProducto);
    console.log('Cantidad seleccionada:', cantidad);

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

      console.log('Llamando a apiService.addProducto con:', selectedOrden._id, productoData);
      const response = await apiService.addProducto(selectedOrden._id!, productoData);
      console.log('Respuesta del backend:', response);

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
      console.log('Fin de handleAddProducto');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Editar Orden</h1>
          <p className="text-gray-600 mt-1">Selecciona una orden para ver detalles y modificar</p>
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
            <Edit3 className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-gray-900">Órdenes en Recepción</h2>
          </div>

          <div className="space-y-4">
            {ordenes.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No hay órdenes disponibles para editar</p>
              </div>
            ) : (
              ordenes.map((orden) => (
                <div
                  key={orden._id}
                  onClick={() => loadOrdenDetails(orden)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    selectedOrden?._id === orden._id
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {orden.nombreMesa || 'Sin Mesa'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {new Date(orden.fechaHora ?? orden.fecha ?? '').toLocaleDateString()}
                      </p>
                      <p className="text-sm font-medium text-green-600">
                        Total: ${orden.total.toFixed(2)}
                      </p>
                    </div>
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                      {orden.estatus}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedOrden
                ? `Detalles - ${selectedOrden.nombreMesa || selectedOrden.mesa || 'Sin nombre'} | Folio: ${selectedOrden.folio}`
                : 'Selecciona una orden'}
            </h2>
            {selectedOrden && (
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowAddPlatillo(true)}
                  className="px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
                >
                  <Plus className="w-4 h-4 inline mr-1" />
                  Platillo
                </button>
                <button
                  onClick={() => setShowAddProducto(true)}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Plus className="w-4 h-4 inline mr-1" />
                  Producto
                </button>
              </div>
            )}
          </div>

          {!selectedOrden ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Selecciona una orden para ver los detalles</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Platillos */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Platillos</h3>
                <div className="space-y-2">
                    {platillosDetalle.length === 0 ? (
                      <p className="text-gray-500 text-sm">No hay platillos agregados</p>
                    ) : (
                      platillosDetalle.map((detalle, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{detalle.nombrePlatillo || detalle.platillo || `Platillo ${index + 1}`}</p>
                            <p className="text-sm text-gray-600">Tipo: {detalle.idPlatillo ? detalle.idPlatillo : 'N/A'}</p>
                            <p className="text-sm text-gray-600">Guiso: {detalle.nombreGuiso || detalle.guiso}</p>
                            <p className="text-sm text-gray-600">Cantidad: {detalle.cantidad}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleRemovePlatillo(detalle._id!)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
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
                <h3 className="font-medium text-gray-900 mb-3">Productos</h3>
                <div className="space-y-2">
                    {productosDetalle.length === 0 ? (
                      <p className="text-gray-500 text-sm">No hay productos agregados</p>
                    ) : (
                      productosDetalle.map((detalle, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{detalle.nombreProducto || detalle.producto || `Producto ${index + 1}`}</p>
                            <p className="text-sm text-gray-600">Tipo: {detalle.idProducto ? detalle.idProducto : 'N/A'}</p>
                            <p className="text-sm text-gray-600">Cantidad: {detalle.cantidad}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleRemoveProducto(detalle._id!)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
      {/* Modal de confirmación para eliminar platillo/producto */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">¿Estás seguro que deseas eliminar este {confirmDelete.type === 'platillo' ? 'platillo' : 'producto'}?</h3>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteAction}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {saving ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Agregar Platillo</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Platillo</label>
                <select
                  value={selectedPlatillo}
                  onChange={(e) => setSelectedPlatillo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Guiso</label>
                <select
                  value={selectedGuiso}
                  onChange={(e) => setSelectedGuiso(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad</label>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                    className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-lg font-semibold w-12 text-center">{cantidad}</span>
                  <button
                    onClick={() => setCantidad(cantidad + 1)}
                    className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddPlatillo(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  console.log('Botón Agregar Platillo presionado');
                  handleAddPlatillo();
                }}
                disabled={saving || !selectedPlatillo || !selectedGuiso}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
              >
                {saving ? 'Agregando...' : 'Agregar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Producto Modal */}
      {showAddProducto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Agregar Producto</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Producto</label>
                <select
                  value={selectedProducto}
                  onChange={(e) => setSelectedProducto(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad</label>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                    className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-lg font-semibold w-12 text-center">{cantidad}</span>
                  <button
                    onClick={() => setCantidad(cantidad + 1)}
                    className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddProducto(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddProducto}
                disabled={saving || !selectedProducto}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Agregando...' : 'Agregar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditarOrden;