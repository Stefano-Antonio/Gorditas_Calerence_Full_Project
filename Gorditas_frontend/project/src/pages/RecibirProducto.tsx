import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  Minus,
  Edit3,
  Trash2,
  Save,
  X,
  Filter,
  ShoppingCart
} from 'lucide-react';
import { apiService } from '../services/api';
import { Producto } from '../types';

interface ProductoInventario {
  _id: string;
  nombre: string;
  codigoBarras?: string;
  cantidad: number;
  costo: number;
  activo?: boolean;
  cantidadNueva?: number;
  costoNuevo?: number;
  activoNuevo?: boolean;
  editando?: boolean;
}

const RecibirProductos: React.FC = () => {
  const [productos, setProductos] = useState<ProductoInventario[]>([]);
  const [filteredProductos, setFilteredProductos] = useState<ProductoInventario[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: '',
    codigoBarras: '',
    cantidad: 0,
    costo: 0,
    idTipoProducto: ''
  });
  const [tiposProducto, setTiposProducto] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadProductos();
    loadTiposProducto();
  }, []);

  useEffect(() => {
    filterProductos();
  }, [productos, searchTerm, showActiveOnly]);

  const loadProductos = async () => {
    setLoading(true);
    try {
      const response = await apiService.getCatalog<{ items: Producto[] }>('producto');
      if (response.success && response.data) {
        // El backend devuelve la estructura: { items: [...], pagination: {...} }
        const productosData = response.data.items || [];
        
        const productosInventario: ProductoInventario[] = productosData.map((p: any) => ({
          _id: p._id,
          nombre: p.nombre,
          codigoBarras: p.codigoBarras,
          cantidad: p.cantidad,
          costo: p.costo,
          activo: p.activo
        }));
        
        setProductos(productosInventario);
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

  const loadTiposProducto = async () => {
    try {
      const response = await apiService.getCatalog('tipoproducto');
      if (response.success && response.data) {
        // El backend devuelve la estructura: { items: [...], pagination: {...} }
        const tiposData = response.data.items || [];
        setTiposProducto(tiposData);
      }
    } catch (error) {
      console.error('Error loading tipos de producto:', error);
    }
  };

  const filterProductos = () => {
    let filtered = [...productos];
    
    if (showActiveOnly) {
      filtered = filtered.filter(producto => producto.activo !== false);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(producto =>
        producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (producto.codigoBarras && producto.codigoBarras.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    setFilteredProductos(filtered);
  };

  const handleEdit = (producto: ProductoInventario) => {
    const updatedProductos = productos.map(p => 
      p._id === producto._id 
        ? { ...p, editando: true, cantidadNueva: p.cantidad, costoNuevo: p.costo, activoNuevo: p.activo }
        : { ...p, editando: false }
    );
    setProductos(updatedProductos);
  };

  const handleSave = async (producto: ProductoInventario) => {
    setSaving(true);
    try {
      const updatedData = {
        cantidad: producto.cantidadNueva || producto.cantidad,
        costo: producto.costoNuevo || producto.costo,
        activo: producto.activoNuevo !== undefined ? producto.activoNuevo : producto.activo
      };

      const response = await apiService.updateCatalogItem('producto', producto._id, updatedData);
      
      if (response.success) {
        setSuccess('Producto actualizado exitosamente');
        await loadProductos();
      } else {
        setError('Error actualizando el producto');
      }
    } catch (error) {
      setError('Error actualizando el producto');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = (producto: ProductoInventario) => {
    const updatedProductos = productos.map(p => 
      p._id === producto._id 
        ? { ...p, editando: false, cantidadNueva: undefined, costoNuevo: undefined, activoNuevo: undefined }
        : p
    );
    setProductos(updatedProductos);
  };

  const handleAgregarCantidad = (producto: ProductoInventario, cantidad: number) => {
    const updatedProductos = productos.map(p => 
      p._id === producto._id 
        ? { ...p, cantidadNueva: (p.cantidadNueva || p.cantidad) + cantidad }
        : p
    );
    setProductos(updatedProductos);
  };

  const handleQuitarCantidad = (producto: ProductoInventario, cantidad: number) => {
    const updatedProductos = productos.map(p => 
      p._id === producto._id 
        ? { ...p, cantidadNueva: Math.max(0, (p.cantidadNueva || p.cantidad) - cantidad) }
        : p
    );
    setProductos(updatedProductos);
  };

  const handleDelete = async (producto: ProductoInventario) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) return;
    
    try {
      const response = await apiService.deleteCatalogItem('producto', producto._id);
      
      if (response.success) {
        setSuccess('Producto eliminado exitosamente');
        await loadProductos();
      } else {
        setError('Error eliminando el producto');
      }
    } catch (error) {
      setError('Error eliminando el producto');
    }
  };

  const handleCreateProducto = async () => {
    if (!nuevoProducto.nombre.trim() || !nuevoProducto.idTipoProducto) {
      setError('Completa todos los campos obligatorios');
      return;
    }

    setSaving(true);
    try {
      const response = await apiService.createCatalogItem('producto', nuevoProducto);
      
      if (response.success) {
        setSuccess('Producto creado exitosamente');
        setShowModal(false);
        setNuevoProducto({
          nombre: '',
          codigoBarras: '',
          cantidad: 0,
          costo: 0,
          idTipoProducto: ''
        });
        await loadProductos();
      } else {
        setError('Error creando el producto');
      }
    } catch (error) {
      setError('Error creando el producto');
    } finally {
      setSaving(false);
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
    <div className="max-w-7xl mx-auto space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">Gestión de Inventario</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Administra el stock y precios de los productos</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex-shrink-0 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2 flex-shrink-0" />
          <span className="truncate">Nuevo Producto</span>
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

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <div className="flex items-center space-x-2 min-w-0 flex-1 sm:flex-initial">
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="min-w-0 flex-1 sm:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                placeholder="Buscar productos..."
              />
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <label className="flex items-center whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={showActiveOnly}
                  onChange={(e) => setShowActiveOnly(e.target.checked)}
                  className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <span className="ml-2 text-sm text-gray-700">Solo activos</span>
              </label>
            </div>
          </div>
          <div className="text-sm text-gray-600 whitespace-nowrap flex-shrink-0">
            Total productos: {filteredProductos.length}
          </div>
        </div>
      </div>

      {/* Lista de Productos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center space-x-2 mb-6">
          <Package className="w-5 h-5 text-orange-600 flex-shrink-0" />
          <h2 className="text-lg font-semibold text-gray-900 truncate">Inventario de Productos</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-2 sm:px-4 font-medium text-gray-900 text-sm sm:text-base">Producto</th>
                <th className="text-left py-3 px-2 sm:px-4 font-medium text-gray-900 text-sm sm:text-base">Stock</th>
                <th className="text-left py-3 px-2 sm:px-4 font-medium text-gray-900 text-sm sm:text-base">Costo</th>
                <th className="text-left py-3 px-2 sm:px-4 font-medium text-gray-900 text-sm sm:text-base">Estado</th>
                <th className="text-left py-3 px-2 sm:px-4 font-medium text-gray-900 text-sm sm:text-base">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredProductos.map((producto) => (
                <tr key={producto._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-2 sm:px-4">
                    <div className="font-medium text-gray-900 text-sm sm:text-base truncate">{producto.nombre}</div>
                  </td>
                  <td className="py-3 px-2 sm:px-4">
                    {producto.editando ? (
                      <div className="flex items-center space-x-1 sm:space-x-2">
                        <button
                          onClick={() => handleQuitarCantidad(producto, 1)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded flex-shrink-0"
                          disabled={saving}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <input
                          type="number"
                          value={producto.cantidadNueva || producto.cantidad}
                          onChange={(e) => {
                            const updatedProductos = productos.map(p => 
                              p._id === producto._id 
                                ? { ...p, cantidadNueva: parseInt(e.target.value) || 0 }
                                : p
                            );
                            setProductos(updatedProductos);
                          }}
                          className="w-16 sm:w-20 px-1 sm:px-2 py-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                          min="0"
                        />
                        <button
                          onClick={() => handleAgregarCantidad(producto, 1)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded flex-shrink-0"
                          disabled={saving}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className={`font-medium text-sm sm:text-base ${
                        producto.cantidad < 10 ? 'text-red-600' : 'text-gray-900'
                      }`}>
                        {producto.cantidad}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-2 sm:px-4">
                    {producto.editando ? (
                      <input
                        type="number"
                        value={producto.costoNuevo || producto.costo}
                        onChange={(e) => {
                          const updatedProductos = productos.map(p => 
                            p._id === producto._id 
                              ? { ...p, costoNuevo: parseFloat(e.target.value) || 0 }
                              : p
                          );
                          setProductos(updatedProductos);
                        }}
                        className="w-20 sm:w-24 px-1 sm:px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                        min="0"
                        step="0.01"
                      />
                    ) : (
                      <span className="font-medium text-green-600 text-sm sm:text-base whitespace-nowrap">
                        ${producto.costo.toFixed(2)}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-2 sm:px-4">
                    {producto.editando ? (
                      <select
                        value={producto.activoNuevo !== undefined ? (producto.activoNuevo ? 'true' : 'false') : (producto.activo !== false ? 'true' : 'false')}
                        onChange={(e) => {
                          const updatedProductos = productos.map(p => 
                            p._id === producto._id 
                              ? { ...p, activoNuevo: e.target.value === 'true' }
                              : p
                          );
                          setProductos(updatedProductos);
                        }}
                        className="px-1 sm:px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="true">Activo</option>
                        <option value="false">Inactivo</option>
                      </select>
                    ) : (
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                          producto.activo !== false
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {producto.activo !== false ? 'Activo' : 'Inactivo'}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-2 sm:px-4">
                    <div className="flex space-x-1 sm:space-x-2">
                      {producto.editando ? (
                        <>
                          <button
                            onClick={() => handleSave(producto)}
                            disabled={saving}
                            className="p-1 text-green-600 hover:bg-green-50 rounded disabled:opacity-50 flex-shrink-0"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleCancel(producto)}
                            disabled={saving}
                            className="p-1 text-gray-600 hover:bg-gray-50 rounded disabled:opacity-50 flex-shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEdit(producto)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded flex-shrink-0"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(producto)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded flex-shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredProductos.length === 0 && (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No se encontraron productos</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal para crear producto */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 truncate">
              Nuevo Producto
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 truncate">
                  Nombre*
                </label>
                <input
                  type="text"
                  value={nuevoProducto.nombre}
                  onChange={(e) => setNuevoProducto({...nuevoProducto, nombre: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                  placeholder="Nombre del producto"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 truncate">
                  Tipo de Producto*
                </label>
                <select
                  value={nuevoProducto.idTipoProducto}
                  onChange={(e) => setNuevoProducto({...nuevoProducto, idTipoProducto: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                >
                  <option value="">Selecciona tipo</option>
                  {tiposProducto.map(tipo => (
                    <option key={tipo._id} value={tipo._id}>{tipo.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 truncate">
                  Código de Barras
                </label>
                <input
                  type="text"
                  value={nuevoProducto.codigoBarras}
                  onChange={(e) => setNuevoProducto({...nuevoProducto, codigoBarras: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                  placeholder="Código de barras"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 truncate">
                    Cantidad Inicial
                  </label>
                  <input
                    type="number"
                    value={nuevoProducto.cantidad}
                    onChange={(e) => setNuevoProducto({...nuevoProducto, cantidad: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 truncate">
                    Costo
                  </label>
                  <input
                    type="number"
                    value={nuevoProducto.costo}
                    onChange={(e) => setNuevoProducto({...nuevoProducto, costo: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateProducto}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Guardando...' : 'Crear Producto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecibirProductos;