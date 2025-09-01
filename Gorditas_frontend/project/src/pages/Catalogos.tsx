import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Plus, 
  Edit3, 
  Trash2, 
  Save,
  X,
  Search,
  Filter
} from 'lucide-react';
import { apiService } from '../services/api';
import { BaseEntity } from '../types';

interface CatalogItem extends BaseEntity {
  nombre: string;
  descripcion?: string;
  [key: string]: any;
}

const catalogModels = [
  { id: 'guiso', name: 'Guisos', fields: ['nombre', 'descripcion'], hasActivo: true },
  { id: 'tipoproducto', name: 'Tipos de Producto', fields: ['nombre', 'descripcion'], hasActivo: true },
  { id: 'producto', name: 'Productos', fields: ['nombre', 'idTipoProducto', 'nombreTipoProducto', 'cantidad', 'costo'], hasActivo: true },
  { id: 'tipoplatillo', name: 'Tipos de Platillo', fields: ['nombre', 'descripcion'], hasActivo: true },
  { id: 'platillo', name: 'Platillos', fields: ['nombre', 'idTipoPlatillo', 'nombreTipoPlatillo', 'descripcion', 'costo'], hasActivo: true },
  { id: 'tipousuario', name: 'Tipos de Usuario', fields: ['nombre', 'descripcion'], hasActivo: false },
  { id: 'usuario', name: 'Usuarios', fields: ['nombre', 'email', 'password', 'idTipoUsuario', 'nombreTipoUsuario'], hasActivo: true },
  { id: 'tipoorden', name: 'Tipos de Orden', fields: ['nombre'], hasActivo: true },
  { id: 'mesa', name: 'Mesas', fields: ['nombre'], hasActivo: false },
  { id: 'tipogasto', name: 'Tipos de Gasto', fields: ['nombre'], hasActivo: true },
];

const Catalogos: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState(catalogModels[0]);
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<CatalogItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadItems();
  }, [selectedModel]);

  useEffect(() => {
    filterItems();
  }, [items, searchTerm, showActiveOnly]);

  const loadItems = async () => {
    setLoading(true);
    try {
      const response = await apiService.getCatalog<CatalogItem>(selectedModel.id);
      if (response.success && response.data) {
        // Backend returns {items: [], pagination: {}} structure
        const data = response.data as any;
        if (data.items && Array.isArray(data.items)) {
          setItems(data.items);
        } else if (Array.isArray(response.data)) {
          // Fallback in case backend returns array directly
          setItems(response.data);
        } else {
          setItems([]);
        }
      } else {
        setItems([]);
      }
    } catch (error) {
      setError('Error cargando datos');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const filterItems = () => {
    let filtered = Array.isArray(items) ? items : [];
    
    if (showActiveOnly && selectedModel.hasActivo) {
      filtered = filtered.filter(item => item.activo);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.descripcion && item.descripcion.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    setFilteredItems(filtered);
  };

  const handleCreate = () => {
    setEditingItem(null);
    const initialData: any = {};
    if (selectedModel.hasActivo) {
      initialData.activo = true;
    }
    setFormData(initialData);
    setShowModal(true);
  };

  const handleEdit = (item: CatalogItem) => {
    setEditingItem(item);
    setFormData({ ...item });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let response;
      
      if (editingItem) {
        response = await apiService.updateCatalogItem(selectedModel.id, editingItem._id!, formData);
      } else {
        response = await apiService.createCatalogItem(selectedModel.id, formData);
      }
      
      if (response.success) {
        setSuccess(editingItem ? 'Item actualizado exitosamente' : 'Item creado exitosamente');
        setShowModal(false);
        await loadItems();
      } else {
        setError('Error guardando el item');
      }
    } catch (error) {
      setError('Error guardando el item');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: CatalogItem) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este item?')) return;
    
    try {
      const response = await apiService.deleteCatalogItem(selectedModel.id, item._id!);
      
      if (response.success) {
        setSuccess('Item eliminado exitosamente');
        await loadItems();
      } else {
        setError('Error eliminando el item');
      }
    } catch (error) {
      setError('Error eliminando el item');
    }
  };

  const handleToggleActive = async (item: CatalogItem) => {
    try {
      const response = await apiService.updateCatalogItem(selectedModel.id, item._id!, {
        ...item,
        activo: !item.activo
      });
      
      if (response.success) {
        setSuccess(`Item ${item.activo ? 'desactivado' : 'activado'} exitosamente`);
        await loadItems();
      } else {
        setError('Error actualizando el item');
      }
    } catch (error) {
      setError('Error actualizando el item');
    }
  };

  const renderField = (field: string, value: any) => {
    switch (field) {
      case 'activo':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => setFormData({ ...formData, [field]: e.target.checked })}
              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            />
            <label className="ml-2 text-sm text-gray-700">Activo</label>
          </div>
        );
      case 'password':
        return (
          <input
            type="password"
            value={value || ''}
            onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder={`Ingresa ${field}`}
          />
        );
      case 'email':
        return (
          <input
            type="email"
            value={value || ''}
            onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder={`Ingresa ${field}`}
          />
        );
      case 'numero':
      case 'cantidad':
      case 'capacidad':
      case 'costo':
      case 'precio':
      case 'idTipoProducto':
      case 'idTipoPlatillo':
      case 'idTipoUsuario':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => setFormData({ ...formData, [field]: parseFloat(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder={`Ingresa ${field}`}
            min="0"
            step={field === 'costo' || field === 'precio' ? '0.01' : '1'}
          />
        );
      case 'descripcion':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder={`Ingresa ${field}`}
            rows={3}
          />
        );
      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder={`Ingresa ${field}`}
          />
        );
    }
  };

  const getFieldLabel = (field: string) => {
    const labels: { [key: string]: string } = {
      nombre: 'Nombre',
      descripcion: 'Descripción',
      codigoBarras: 'Código de Barras',
      idTipoProducto: 'ID Tipo de Producto',
      nombreTipoProducto: 'Nombre Tipo de Producto',
      cantidad: 'Cantidad',
      costo: 'Costo',
      precio: 'Precio',
      idTipoPlatillo: 'ID Tipo de Platillo',
      nombreTipoPlatillo: 'Nombre Tipo de Platillo',
      permisos: 'Permisos',
      email: 'Email',
      password: 'Contraseña',
      idTipoUsuario: 'ID Tipo de Usuario',
      nombreTipoUsuario: 'Nombre Tipo de Usuario',
      telefono: 'Teléfono',
      numero: 'Número',
      capacidad: 'Capacidad',
      ubicacion: 'Ubicación',
      activo: 'Activo'
    };
    return labels[field] || field;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Catálogos</h1>
          <p className="text-gray-600 mt-1">Gestiona los catálogos maestros del sistema</p>
        </div>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo {selectedModel.name.slice(0, -1)}
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Model Selection */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Settings className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-gray-900">Catálogos</h2>
          </div>
          
          <div className="space-y-2">
            {catalogModels.map((model) => (
              <button
                key={model.id}
                onClick={() => setSelectedModel(model)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  selectedModel.id === model.id
                    ? 'bg-orange-100 text-orange-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {model.name}
              </button>
            ))}
          </div>
        </div>

        {/* Items List */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">{selectedModel.name}</h2>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Buscar..."
                />
              </div>
              {selectedModel.hasActivo && (
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={showActiveOnly}
                      onChange={(e) => setShowActiveOnly(e.target.checked)}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Solo activos</span>
                  </label>
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Nombre</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Estado</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{item.nombre}</p>
                          {item.descripcion && (
                            <p className="text-sm text-gray-600">{item.descripcion}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {selectedModel.hasActivo ? (
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              item.activo
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {item.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                            N/A
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {selectedModel.hasActivo && (
                            <button
                              onClick={() => handleToggleActive(item)}
                              className={`p-1 rounded ${
                                item.activo
                                  ? 'text-red-600 hover:bg-red-50'
                                  : 'text-green-600 hover:bg-green-50'
                              }`}
                            >
                              {item.activo ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(item)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredItems.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No se encontraron items</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingItem ? 'Editar' : 'Crear'} {selectedModel.name.slice(0, -1)}
            </h3>
            
            <div className="space-y-4">
              {selectedModel.fields.map((field) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {getFieldLabel(field)}
                  </label>
                  {renderField(field, formData[field])}
                </div>
              ))}
              
              {selectedModel.hasActivo && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado
                  </label>
                  {renderField('activo', formData.activo)}
                </div>
              )}
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Catalogos;