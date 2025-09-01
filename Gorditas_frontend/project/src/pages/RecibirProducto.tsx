import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Scan, 
  Search, 
  Plus, 
  Check,
  AlertCircle,
  Barcode
} from 'lucide-react';
import { apiService } from '../services/api';
import { Producto } from '../types';

interface ProductoRecibido {
  producto: Producto;
  cantidadRecibida: number;
  costoUnitario: number;
}

const RecibirProductos: React.FC = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [productosRecibidos, setProductosRecibidos] = useState<ProductoRecibido[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [barcode, setBarcode] = useState('');
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [costo, setCosto] = useState(0);
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadProductos();
  }, []);

  const loadProductos = async () => {
  try {
    const response = await apiService.getCatalog<{ productos: Producto[] }>('producto');
      if (response.success) {
        setProductos(response.data?.productos ?? []); // accedes directo a la propiedad
      } else {
        setProductos([]);
      }
  } catch (error) {
    setError('Error cargando productos');
    setProductos([]);
  } finally {
    setLoading(false);
  }
};


  const handleBarcodeSearch = () => {
    if (!barcode.trim()) {
      setError('Ingresa un código de barras');
      return;
    }

    const producto = productos.find(p => p.codigoBarras === barcode.trim());
    if (producto) {
      setSelectedProducto(producto);
      setCosto(producto.costo);
      setBarcode('');
      setError('');
    } else {
      setError('Producto no encontrado con ese código de barras');
    }
  };

  const handleManualSearch = () => {
    if (!searchTerm.trim()) {
      setError('Ingresa un término de búsqueda');
      return;
    }

    const producto = productos.find(p => 
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.codigoBarras?.includes(searchTerm)
    );
    
    if (producto) {
      setSelectedProducto(producto);
      setCosto(producto.costo);
      setSearchTerm('');
      setError('');
    } else {
      setError('Producto no encontrado');
    }
  };

  const handleAddProducto = () => {
    if (!selectedProducto || cantidad <= 0 || costo <= 0) {
      setError('Completa todos los campos');
      return;
    }

    const nuevoProducto: ProductoRecibido = {
      producto: selectedProducto,
      cantidadRecibida: cantidad,
      costoUnitario: costo,
    };

    setProductosRecibidos(prev => [...prev, nuevoProducto]);
    setSelectedProducto(null);
    setCantidad(1);
    setCosto(0);
    setShowManualAdd(false);
    setError('');
  };

  const handleRemoveProducto = (index: number) => {
    setProductosRecibidos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveRecepcion = async () => {
    if (productosRecibidos.length === 0) {
      setError('Agrega al menos un producto');
      return;
    }

    setSaving(true);
    try {
      const recepcionData = {
        productos: productosRecibidos.map(pr => ({
          productoId: pr.producto._id,
          cantidad: pr.cantidadRecibida,
          costoUnitario: pr.costoUnitario,
        }))
      };

      const response = await apiService.recibirProductos(recepcionData);
      
      if (response.success) {
        setSuccess('Productos recibidos exitosamente');
        setProductosRecibidos([]);
        await loadProductos(); // Refresh product list
      } else {
        setError('Error al recibir productos');
      }
    } catch (error) {
      setError('Error al recibir productos');
    } finally {
      setSaving(false);
    }
  };

  const filteredProductos = Array.isArray(productos) 
  ? productos.filter(p =>
      p.activo && p.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    )
  : [];

  const getTotalRecepcion = () => {
    return productosRecibidos.reduce(
      (total, pr) => total + (pr.cantidadRecibida * pr.costoUnitario),
      0
    );
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
          <h1 className="text-3xl font-bold text-gray-900">Recibir Productos</h1>
          <p className="text-gray-600 mt-1">Registra la entrada de productos al inventario</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowManualAdd(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Search className="w-4 h-4 mr-2" />
            Búsqueda Manual
          </button>
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
        {/* Barcode Scanner & Product Selection */}
        <div className="space-y-6">
          {/* Barcode Scanner */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Barcode className="w-5 h-5 text-orange-600" />
              <h2 className="text-lg font-semibold text-gray-900">Escaneo de Código de Barras</h2>
            </div>
            
            <div className="flex space-x-3">
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleBarcodeSearch()}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Escanea o ingresa código de barras"
              />
              <button
                onClick={handleBarcodeSearch}
                className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <Scan className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Selected Product */}
          {selectedProducto && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Producto Seleccionado</h2>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <h3 className="font-medium text-gray-900">{selectedProducto.nombre}</h3>
                <p className="text-sm text-gray-600">Código: {selectedProducto.codigoBarras}</p>
                <p className="text-sm text-gray-600">Stock actual: {selectedProducto.cantidad}</p>
                <p className="text-sm text-gray-600">Costo actual: ${selectedProducto.costo.toFixed(2)}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cantidad Recibida
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={cantidad}
                    onChange={(e) => setCantidad(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Costo Unitario
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={costo}
                    onChange={(e) => setCosto(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setSelectedProducto(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddProducto}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-4 h-4 inline mr-2" />
                  Agregar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Products Received */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-orange-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Productos Recibidos ({productosRecibidos.length})
              </h2>
            </div>
            {productosRecibidos.length > 0 && (
              <button
                onClick={handleSaveRecepcion}
                disabled={saving}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Guardar Recepción
                  </>
                )}
              </button>
            )}
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {productosRecibidos.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No hay productos agregados</p>
              </div>
            ) : (
              productosRecibidos.map((pr, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{pr.producto.nombre}</h4>
                    <p className="text-sm text-gray-600">
                      Cantidad: {pr.cantidadRecibida} • Costo: ${pr.costoUnitario.toFixed(2)}
                    </p>
                    <p className="text-sm font-medium text-green-600">
                      Subtotal: ${(pr.cantidadRecibida * pr.costoUnitario).toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveProducto(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <AlertCircle className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {productosRecibidos.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">Total:</span>
                <span className="text-xl font-bold text-green-600">
                  ${getTotalRecepcion().toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Manual Search Modal */}
      {showManualAdd && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Búsqueda Manual de Productos</h3>
            
            <div className="mb-4">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Buscar por nombre o código de barras"
              />
            </div>

            <div className="space-y-2 mb-6 max-h-48 overflow-y-auto">
              {filteredProductos.map((producto) => (
                <div
                  key={producto._id}
                  onClick={() => {
                    setSelectedProducto(producto);
                    setCosto(producto.costo);
                    setShowManualAdd(false);
                  }}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-orange-50 hover:border-orange-300 cursor-pointer transition-colors"
                >
                  <h4 className="font-medium text-gray-900">{producto.nombre}</h4>
                  <p className="text-sm text-gray-600">
                    Código: {producto.codigoBarras} • Stock: {producto.cantidad} • Costo: ${producto.costo.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowManualAdd(false)}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecibirProductos;