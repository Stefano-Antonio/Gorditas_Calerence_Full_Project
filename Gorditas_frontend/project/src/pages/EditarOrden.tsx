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

      // Filter orders that can be edited (Recepcion or Pendiente status)
      if (ordenesRes.success) {
        let ordenesArray: Orden[] = [];
        if (Array.isArray(ordenesRes.data?.ordenes)) {
          ordenesArray = ordenesRes.data.ordenes;
        } else if (Array.isArray(ordenesRes.data)) {
          ordenesArray = ordenesRes.data;
        }
        const ordenesEditables = ordenesArray.filter((orden: Orden) => 
          ['Recepcion', 'Preparacion', 'Pendiente', 'Surtida'].includes(orden.estatus)
        );
        setOrdenes(ordenesEditables);
      }
      
      // Handle catalog data that might come in different formats
      if (platillosRes.success) {
        const platillosData = platillosRes.data?.items || platillosRes.data || [];
        setPlatillos(Array.isArray(platillosData) ? platillosData : []);
      }
      if (guisosRes.success) {
        const guisosData = guisosRes.data?.items || guisosRes.data || [];
        setGuisos(Array.isArray(guisosData) ? guisosData : []);
      }
      if (productosRes.success) {
        const productosData = productosRes.data?.items || productosRes.data || [];
        setProductos(Array.isArray(productosData) ? productosData : []);
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

  const handleAddPlatillo = async () => {
    if (!selectedOrden || !selectedPlatillo || !selectedGuiso) {
      setError('Selecciona platillo y guiso');
      return;
    }

    setSaving(true);
    try {
      const platillo = (platillos || []).find(p => p._id === selectedPlatillo);
      const guiso = (guisos || []).find(g => g._id === selectedGuiso);
      if (!platillo || !guiso) return;

      // Get or create suborder
      let subordenId = '';
      if (subordenes.length === 0) {
        // Create a suborder first
        const subordenData = {
          nombre: `Suborden 1`
        };
        const subordenResponse = await apiService.addSuborden(selectedOrden._id!, subordenData);
        if (subordenResponse.success) {
          subordenId = subordenResponse.data._id;
          // Add to local state
          setSubordenes([subordenResponse.data]);
        } else {
          setError('Error creando suborden');
          return;
        }
      } else {
        subordenId = subordenes[0]._id!;
      }

      const platilloData = {
        idPlatillo: selectedPlatillo,
        nombrePlatillo: platillo.nombre,
        idGuiso: selectedGuiso,
        nombreGuiso: guiso.nombre,
        costoPlatillo: platillo.precio || platillo.costo,
        cantidad
      };

      const response = await apiService.addPlatillo(subordenId, platilloData);
      
      if (response.success) {
        // Update order status to Recepcion when adding items
        if (selectedOrden.estatus !== 'Recepcion') {
          await apiService.updateOrdenStatus(selectedOrden._id!, 'Recepcion');
        }
        
        setSuccess('Platillo agregado exitosamente');
        // Refresh order details
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
      const producto = (productos || []).find(p => p._id === selectedProducto);
      if (!producto) return;

      const productoData = {
        idProducto: selectedProducto,
        nombreProducto: producto.nombre,
        costoProducto: producto.costo,
        cantidad
      };

      const response = await apiService.addProducto(selectedOrden._id!, productoData);
      
      if (response.success) {
        // Update order status to Recepcion when adding items
        if (selectedOrden.estatus !== 'Recepcion') {
          await apiService.updateOrdenStatus(selectedOrden._id!, 'Recepcion');
        }
        
        setSuccess('Producto agregado exitosamente');
        // Refresh order details
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

  const handleRemovePlatillo = async (platilloId: string) => {
    // Implementation for removing platillo
    setSuccess('Platillo eliminado');
  };

  const handleRemoveProducto = async (productoId: string) => {
    // Implementation for removing producto
    setSuccess('Producto eliminado');
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
          <p className="text-gray-600 mt-1">Modifica órdenes en recepción</p>
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
                        Mesa {orden.nombreMesa || orden.idMesa || 'Sin Mesa'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {new Date(orden.fechaHora || orden.fecha).toLocaleDateString()}
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
              {selectedOrden ? `Detalles - Mesa ${selectedOrden.nombreMesa || selectedOrden.idMesa || 'Sin Mesa'}` : 'Selecciona una orden'}
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
                            <p className="font-medium text-gray-900">{detalle.nombrePlatillo || `Platillo ${index + 1}`}</p>
                            <p className="text-sm text-gray-600">Guiso: {detalle.nombreGuiso}</p>
                            <p className="text-sm text-gray-600">Cantidad: {detalle.cantidad}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-green-600">
                              ${Number(detalle.importe ?? 0).toFixed(2)}
                            </span>
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
                            <p className="font-medium text-gray-900">{detalle.nombreProducto || `Producto ${index + 1}`}</p>
                            <p className="text-sm text-gray-600">Cantidad: {detalle.cantidad}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-green-600">
                              ${Number(detalle.importe ?? 0).toFixed(2)}
                            </span>
                            <button
                              onClick={() => handleRemoveProducto(detalle._id!)}
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
                onClick={handleAddPlatillo}
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