import React, { useState, useEffect, useRef } from 'react';
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
import { useAuth } from '../context/AuthContext';
import { BaseEntity } from '../types';

interface CatalogItem extends BaseEntity {
  nombre: string;
  descripcion?: string;
  [key: string]: any;
}

const catalogModels = [
  { id: 'guiso', name: 'Guisos', fields: ['nombre', 'descripcion'], hasActivo: true },
  { id: 'tipoproducto', name: 'Tipos de Producto', fields: ['nombre', 'descripcion'], hasActivo: true },
  { id: 'producto', name: 'Productos', fields: ['nombre', 'idTipoProducto', 'cantidad', 'costo'], hasActivo: true },
  { id: 'tipoplatillo', name: 'Tipos de Platillo', fields: ['nombre', 'descripcion'], hasActivo: true },
  { id: 'platillo', name: 'Platillos', fields: ['nombre', 'idTipoPlatillo', 'descripcion', 'costo'], hasActivo: true },
  { id: 'tipoextra', name: 'Tipos de Extra', fields: ['nombre', 'descripcion'], hasActivo: true },
  { id: 'extra', name: 'Extras', fields: ['nombre', 'idTipoExtra', 'descripcion', 'costo'], hasActivo: true },
  { id: 'tipogasto', name: 'Tipos de Gasto', fields: ['nombre'], hasActivo: true },
  { id: 'tipousuario', name: 'Tipos de Usuario', fields: ['nombre', 'descripcion'], hasActivo: false },
  { id: 'usuario', name: 'Usuarios', fields: ['nombre', 'email', 'password', 'nombreTipoUsuario'], hasActivo: true },
  { id: 'mesa', name: 'Mesas', fields: ['nombre'], hasActivo: false },
];

const Catalogos: React.FC = () => {
  // Contexto de usuario logueado
  const { user } = useAuth();

  // Tipos dinámicos para selects
  const [tiposPlatillo, setTiposPlatillo] = useState<any[]>([]);
  const [tiposProducto, setTiposProducto] = useState<any[]>([]);
  const [tiposExtra, setTiposExtra] = useState<any[]>([]);
  // Tipos fijos para usuarios
  const tiposUsuarioFijos = [
    {
      value: 'Despachador',
      label: 'Despachador',
      descripcion: 'Atiende y despacha órdenes. Acceso: Surtir Orden, Despachar, Catálogos.'
    },
    {
      value: 'Mesero',
      label: 'Mesero',
      descripcion: 'Toma pedidos y atiende mesas. Acceso: Nueva Orden, Editar Orden.'
    },
    {
      value: 'Encargado',
      label: 'Encargado',
      descripcion: 'Gestiona inventario y reportes. Acceso: Inventario, Recibir Producto.'
    },
    {
      value: 'Admin',
      label: 'Administrador',
      descripcion: 'Acceso total a todos los componentes y configuraciones del sistema.'
    }
  ];
  const [tiposUsuario, setTiposUsuario] = useState<any[]>(tiposUsuarioFijos);

  const [selectedModel, setSelectedModel] = useState(catalogModels[0]);
  
  // Ref for items list section
  const itemsListRef = useRef<HTMLDivElement>(null);

  // Handle model selection with scroll functionality
  const handleModelSelect = (model: any) => {
    setSelectedModel(model);
    
    // Scroll to items list in mobile view
    if (window.innerWidth < 640 && itemsListRef.current) {
      setTimeout(() => {
        itemsListRef.current!.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100);
    }
  };
  useEffect(() => {
    // Cargar tipos para selects dinámicos
    const fetchTipos = async () => {
      if (selectedModel.id === 'platillo') {
        const res = await apiService.getCatalog('tipoplatillo');
        if (res.success && res.data) {
          if (Array.isArray(res.data.items)) {
            setTiposPlatillo(res.data.items);
          } else if (Array.isArray(res.data)) {
            setTiposPlatillo(res.data);
          } else {
            setTiposPlatillo([]);
          }
        } else {
          setTiposPlatillo([]);
        }
      }
      if (selectedModel.id === 'producto') {
        const res = await apiService.getCatalog('tipoproducto');
        if (res.success && res.data) {
          if (Array.isArray(res.data.items)) {
            setTiposProducto(res.data.items);
          } else if (Array.isArray(res.data)) {
            setTiposProducto(res.data);
          } else {
            setTiposProducto([]);
          }
        } else {
          setTiposProducto([]);
        }
      }
      if (selectedModel.id === 'extra') {
        const res = await apiService.getCatalog('tipoextra');
        if (res.success && res.data) {
          if (Array.isArray(res.data.items)) {
            setTiposExtra(res.data.items);
          } else if (Array.isArray(res.data)) {
            setTiposExtra(res.data);
          } else {
            setTiposExtra([]);
          }
        } else {
          setTiposExtra([]);
        }
      }
      if (selectedModel.id === 'usuario') {
        setTiposUsuario(tiposUsuarioFijos);
      }
    };
    fetchTipos();
  }, [selectedModel]);
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
    if (selectedModel.id === 'platillo') {
      initialData.precio = 0; // Set default value for precio
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
      if (selectedModel.id === 'platillo') {
        // Map 'costo' to 'precio' for platillo creation
        formData.precio = formData.costo;
        if (!formData.costo || formData.costo <= 0) {
          setError('El campo "costo" es obligatorio y debe ser mayor a 0.');
          setSaving(false);
          return;
        }
      }

      if (selectedModel.id === 'extra') {
        if (!formData.costo || formData.costo <= 0) {
          setError('El campo "costo" es obligatorio y debe ser mayor a 0.');
          setSaving(false);
          return;
        }
      }


      // Validación de usuario: correo y contraseña
      let dataToSend = { ...formData };
      if (selectedModel.id === 'usuario') {
        // Validar formato de correo
        const emailRegex = /^[\w-.]+@[\w-]+\.[a-zA-Z]{2,}$/;
        if (!formData.email || !emailRegex.test(formData.email)) {
          setError('El correo electrónico no es válido.');
          setSaving(false);
          return;
        }
        // Validar contraseña solo si se está creando o si se está editando y se ingresó una nueva
        if ((!editingItem && (!formData.password || formData.password.length < 6)) ||
            (editingItem && formData.password && formData.password.length > 0 && formData.password.length < 6)) {
          setError('La contraseña debe tener al menos 6 caracteres.');
          setSaving(false);
          return;
        }
        // Si se está editando y el campo password está vacío, no enviar password
        if (editingItem) {
          if (!formData.password || formData.password.length === 0) {
            // Eliminar password para no enviarlo
            delete dataToSend.password;
          }
        }
      }

      let response;
      if (editingItem) {
        response = await apiService.updateCatalogItem(selectedModel.id, editingItem._id!, dataToSend);
      } else {
        response = await apiService.createCatalogItem(selectedModel.id, dataToSend);
      }

      if (response.success) {
        setSuccess(editingItem ? 'Item actualizado exitosamente' : 'Item creado exitosamente');
        setError(''); // Clear error message after successful creation
        setShowModal(false);
        await loadItems();
      } else {
        // Mostrar advertencia específica si la contraseña es demasiado corta
        if (response.error && response.error.toString().includes('Path `password`') && response.error.toString().includes('minimum allowed length')) {
          setError('La contraseña debe tener al menos 6 caracteres.');
        } else if (response.error && response.error.toString().toLowerCase().includes('email')) {
          setError('El correo electrónico no es válido o ya está en uso.');
        } else {
          setError('Error guardando el item');
        }
        console.error('Error al guardar el item:', response.error);
      }
    } catch (error) {
      console.error('Error inesperado al guardar el item:', error);
      setError('Error guardando el item');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: CatalogItem) => {
    // Restringir eliminación de admin/encargado por mesero/despachador
    if (
      selectedModel.id === 'usuario' &&
      (item.nombreTipoUsuario === 'Admin' || item.nombreTipoUsuario === 'Encargado') &&
      user && (user.nombreTipoUsuario === 'Mesero' || user.nombreTipoUsuario === 'Despachador')
    ) {
      setError('No tienes permiso para eliminar usuarios tipo Administrador o Encargado.');
      return;
    }
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
      case 'nombreTipoUsuario': {
        // Restringir selección de tipo Admin/Encargado para Mesero/Despachador
        const esMeseroODespachador = user && (user.nombreTipoUsuario === 'Mesero' || user.nombreTipoUsuario === 'Despachador');
        // Si es edición y el usuario editado es Admin/Encargado, bloquear el select
        const esAdminOEncargadoEdit = editingItem && (editingItem.nombreTipoUsuario === 'Admin' || editingItem.nombreTipoUsuario === 'Encargado');
        // Opciones permitidas
        const opciones = esMeseroODespachador
          ? tiposUsuario.filter(tipo => tipo.value !== 'Admin' && tipo.value !== 'Encargado')
          : tiposUsuario;
        return (
          <div>
            <select
              value={value || ''}
              onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              disabled={!!esAdminOEncargadoEdit && !!esMeseroODespachador}
            >
              <option value="">Selecciona tipo de usuario</option>
              {opciones.map(tipo => (
                <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
              ))}
            </select>
            {/* Mensaje si no puede editar tipo de usuario */}
            {esAdminOEncargadoEdit && esMeseroODespachador && (
              <div className="text-xs text-red-600 mt-1">No puedes cambiar el tipo de usuario de un Administrador o Encargado.</div>
            )}
            {/* Mensaje si está creando y no puede crear admin/encargado */}
            {!editingItem && esMeseroODespachador && (
              <div className="text-xs text-orange-600 mt-1">No puedes crear usuarios tipo Administrador o Encargado.</div>
            )}
          </div>
        );
      }
      case 'idTipoPlatillo': {
        // Mostrar solo tipos de platillo existentes
        return (
          <select
            value={value || ''}
            onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">Selecciona tipo de platillo</option>
            {(Array.isArray(tiposPlatillo) ? tiposPlatillo : []).map(tipo => (
              <option key={tipo._id} value={tipo._id}>{tipo.nombre}</option>
            ))}
          </select>
        );
      }
      case 'idTipoExtra': {
        // Mostrar solo tipos de extra existentes
        return (
          <select
            value={value || ''}
            onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">Selecciona tipo de extra</option>
            {(Array.isArray(tiposExtra) ? tiposExtra : []).map(tipo => (
              <option key={tipo._id} value={tipo._id}>{tipo.nombre}</option>
            ))}
          </select>
        );
      }
      case 'idTipoProducto': {
        // Mostrar solo tipos de producto existentes
        return (
          <select
            value={value || ''}
            onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">Selecciona tipo de producto</option>
            {(Array.isArray(tiposProducto) ? tiposProducto : []).map(tipo => (
              <option key={tipo._id} value={tipo._id}>{tipo.nombre}</option>
            ))}
          </select>
        );
      }
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
      case 'password': {
        // Si es edición de usuario, mostrar campo para cambiar contraseña opcional
        if (selectedModel.id === 'usuario' && editingItem) {
          const esAdminOEncargado = editingItem.nombreTipoUsuario === 'Admin' || editingItem.nombreTipoUsuario === 'Encargado';
          const esMeseroODespachador = user && (user.nombreTipoUsuario === 'Mesero' || user.nombreTipoUsuario === 'Despachador');
          const noPuedeEditar = esAdminOEncargado && esMeseroODespachador;
          return (
            <div>
              <input
                type="password"
                value={value || ''}
                onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Dejar vacío para no cambiar"
                disabled={!!noPuedeEditar}
              />
              {noPuedeEditar && (
                <div className="text-xs text-red-600 mt-1">No puedes editar la contraseña de un Administrador o Encargado.</div>
              )}
              {value && value.length > 0 && value.length < 6 && !noPuedeEditar && (
                <div className="text-xs text-red-600 mt-1">La contraseña debe tener al menos 6 caracteres.</div>
              )}
              {!noPuedeEditar && (
                <div className="text-xs text-gray-500 mt-1">Dejar vacío para mantener la contraseña actual.</div>
              )}
            </div>
          );
        }
        // Si es creación de usuario o edición de otro modelo
        return (
          <div>
            <input
              type="password"
              value={value || ''}
              onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder={`Ingresa ${field}`}
            />
            {selectedModel.id === 'usuario' && value && value.length > 0 && value.length < 6 && (
              <div className="text-xs text-red-600 mt-1">La contraseña debe tener al menos 6 caracteres.</div>
            )}
          </div>
        );
      }
      case 'email': {
        // Validación visual de formato de correo solo en crear usuario
        const emailRegex = /^[\w-.]+@[\w-]+\.[a-zA-Z]{2,}$/;
        const isUsuario = selectedModel.id === 'usuario';
        const showEmailFormatError = isUsuario && value && !emailRegex.test(value);
        let noPuedeEditarCorreo = false;
        if (isUsuario && editingItem) {
          const esAdminOEncargado = editingItem.nombreTipoUsuario === 'Admin' || editingItem.nombreTipoUsuario === 'Encargado';
          const esMeseroODespachador = !!user && (user.nombreTipoUsuario === 'Mesero' || user.nombreTipoUsuario === 'Despachador');
          noPuedeEditarCorreo = !!(esAdminOEncargado && esMeseroODespachador);
        }
        return (
          <div>
            <input
              type="email"
              value={value || ''}
              onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder={`Ingresa ${field}`}
              pattern="^[\w-.]+@[\w-]+\.[a-zA-Z]{2,}$"
              required={isUsuario}
              disabled={!!noPuedeEditarCorreo}
            />
            {noPuedeEditarCorreo && (
              <div className="text-xs text-red-600 mt-1">No puedes editar el correo de un Administrador o Encargado.</div>
            )}
            {showEmailFormatError && !noPuedeEditarCorreo && (
              <div className="text-xs text-red-600 mt-1">Formato: ejemplo@gmail.com</div>
            )}
          </div>
        );
      }
      case 'numero':
      case 'cantidad':
      case 'capacidad':
      case 'costo':
      case 'precio':
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
      idTipoProducto: 'Tipo de Producto',
      idTipoExtra: 'Tipo de Extra',
      cantidad: 'Cantidad',
      costo: 'Costo',
      precio: 'Precio',
      idTipoPlatillo: 'Tipo de Platillo',
      permisos: 'Permisos',
      email: 'Email',
      password: 'Contraseña',
      nombreTipoUsuario: 'Tipo de Usuario',
      telefono: 'Teléfono',
      numero: 'Número',
      capacidad: 'Capacidad',
      ubicacion: 'Ubicación',
      activo: 'Activo'
    };
    return labels[field] || field;
  };

  return (
      <div className="max-w-7xl mx-auto space-y-6 px-1 py-2 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">Catálogos</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Gestiona los catálogos maestros del sistema</p>
          </div>
          {/* Solo mostrar botón de nuevo si NO es tipos de usuario */}
          {selectedModel.id !== 'tipousuario' && (
            <button
              onClick={handleCreate}
              className="flex-shrink-0 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center"
            >
              <Plus className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">Nuevo {selectedModel.name.slice(0, -1)}</span>
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-1 py-2 sm:px-4 sm:py-3 rounded-lg text-sm break-words">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-1 py-2 sm:px-4 sm:py-3 rounded-lg text-sm break-words">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-2 sm:gap-6">
          {/* Model Selection */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-1 py-2 sm:p-6">
            <div className="flex items-center space-x-2 mb-2 sm:mb-4">
              <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 flex-shrink-0" />
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 truncate">Catálogos</h2>
            </div>
            
            <div className="space-y-1 sm:space-y-2">
              {catalogModels.map((model) => (
                <button
                  key={model.id}
                  onClick={() => handleModelSelect(model)}
                  className={`w-full text-left px-2 py-1 sm:px-3 sm:py-2 rounded-lg transition-colors truncate text-sm sm:text-base ${
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
          <div ref={itemsListRef} className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-200 px-1 py-2 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-3 sm:mb-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{selectedModel.name}</h2>
              {/* Solo mostrar búsqueda y filtro si NO es tipos de usuario */}
              {selectedModel.id !== 'tipousuario' && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
                  <div className="flex items-center space-x-1 sm:space-x-2 min-w-0 flex-1 sm:flex-initial">
                    <Search className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="min-w-0 flex-1 sm:w-48 px-2 py-1 sm:px-3 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs sm:text-sm"
                      placeholder="Buscar..."
                    />
                  </div>
                  {selectedModel.hasActivo && (
                    <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                      <Filter className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                      <label className="flex items-center whitespace-nowrap text-xs sm:text-sm">
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
              )}
            </div>

            {/* Panel especial para tipos de usuario */}
            {selectedModel.id === 'tipousuario' ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-1 sm:py-3 sm:px-4 font-medium text-gray-900 text-xs sm:text-base">Tipo de Usuario</th>
                      <th className="text-left py-2 px-1 sm:py-3 sm:px-4 font-medium text-gray-900 text-xs sm:text-base">Descripción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tiposUsuarioFijos.map(tipo => (
                      <tr key={tipo.value} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2 px-1 sm:py-3 sm:px-4 font-medium text-gray-900 text-xs sm:text-base truncate">{tipo.label}</td>
                        <td className="py-2 px-1 sm:py-3 sm:px-4 text-gray-700 text-xs sm:text-base break-words hyphens-auto">{tipo.descripcion}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              // ...existing code for other models...
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-1 sm:py-3 sm:px-4 font-medium text-gray-900 text-xs sm:text-base">Nombre</th>
                      <th className="text-left py-2 px-1 sm:py-3 sm:px-4 font-medium text-gray-900 text-xs sm:text-base">Estado</th>
                      {(selectedModel.id === 'producto' || selectedModel.id === 'platillo' || selectedModel.id === 'extra') && (
                        <th className="text-left py-2 px-1 sm:py-3 sm:px-4 font-medium text-gray-900 text-xs sm:text-base">Precio</th>
                      )}
                      <th className="text-left py-2 px-1 sm:py-3 sm:px-4 font-medium text-gray-900 text-xs sm:text-base">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => (
                      <tr key={item._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2 px-1 sm:py-3 sm:px-4">
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 text-xs sm:text-base truncate break-words hyphens-auto">{item.nombre}</p>
                            {item.descripcion && (
                              <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 break-words hyphens-auto">{item.descripcion}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-1 sm:py-3 sm:px-4">
                          {selectedModel.hasActivo ? (
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                                item.activo
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {item.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 whitespace-nowrap">
                              N/A
                            </span>
                          )}
                        </td>
                        {(selectedModel.id === 'producto' || selectedModel.id === 'platillo' || selectedModel.id === 'extra') && (
                          <td className="py-2 px-1 sm:py-3 sm:px-4">
                            <span className="font-medium text-green-600 text-xs sm:text-base whitespace-nowrap">
                              ${((item as any).costo || (item as any).precio || 0).toFixed(2)}
                            </span>
                          </td>
                        )}
                        <td className="py-2 px-1 sm:py-3 sm:px-4">
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded flex-shrink-0"
                            >
                              <Edit3 className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded flex-shrink-0"
                            >
                              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
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

        {/* Modal solo si NO es tipos de usuario */}
        {showModal && selectedModel.id !== 'tipousuario' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-1 py-2 sm:p-4">
            <div className="bg-white rounded-xl px-2 py-3 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-4 truncate break-words hyphens-auto">
                {editingItem ? 'Editar' : 'Crear'} {selectedModel.name.slice(0, -1)}
              </h3>
              
              <div className="space-y-2 sm:space-y-4">
                {selectedModel.fields.map((field) => (
                  <div key={field}>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2 truncate break-words">
                      {getFieldLabel(field)}
                    </label>
                    {renderField(field, formData[field])}
                  </div>
                ))}
                
                {selectedModel.hasActivo && (
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      Estado
                    </label>
                    {renderField('activo', formData.activo)}
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mt-3 sm:mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-2 py-1 sm:px-4 sm:py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-xs sm:text-base"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 px-2 py-1 sm:px-4 sm:py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors text-xs sm:text-base"
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