import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Minus, 
  ShoppingCart, 
  Check,
  ArrowLeft,
  ArrowRight,
  ChefHat
} from 'lucide-react';
import { apiService } from '../services/api';
import { Mesa, Platillo, Guiso, OrderStep, ApiResponse } from '../types';

interface PlatilloSeleccionado {
  platillo: Platillo;
  guiso: Guiso;
  cantidad: number;
}

const NuevaOrden: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedMesa, setSelectedMesa] = useState<Mesa | null>(null);
  const [nombreSuborden, setNombreSuborden] = useState('');
  const [platillosSeleccionados, setPlatillosSeleccionados] = useState<PlatilloSeleccionado[]>([]);
  // Agrega estado para productos seleccionados
  const [productosSeleccionados, setProductosSeleccionados] = useState<any[]>([]);
  
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [mesasOcupadas, setMesasOcupadas] = useState<Set<string>>(new Set());
  const [ordenesActivas, setOrdenesActivas] = useState<any[]>([]);
  const [platillos, setPlatillos] = useState<Platillo[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [selectedProducto, setSelectedProducto] = useState<any | null>(null);
  const [cantidadProducto, setCantidadProducto] = useState(1);
  const [guisos, setGuisos] = useState<Guiso[]>([]);
  const [selectedPlatillo, setSelectedPlatillo] = useState<Platillo | null>(null);
  const [selectedGuiso, setSelectedGuiso] = useState<Guiso | null>(null);
  const [cantidad, setCantidad] = useState(1);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isOrderComplete, setIsOrderComplete] = useState(true); // For order validation

  const steps: OrderStep[] = [
    { step: 1, title: 'Seleccionar Mesa', completed: !!selectedMesa },
    { step: 2, title: 'Crear Suborden', completed: !!nombreSuborden },
    { step: 3, title: 'Agregar Items', completed: platillosSeleccionados.length > 0 || productosSeleccionados.length > 0 },
    { step: 4, title: 'Validar y Confirmar', completed: false },
  ];

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [mesasResponse, platillosResponse, guisosResponse, productosResponse, ordenesResponse] = await Promise.all([
        apiService.getCatalog<ApiResponse<Mesa>>('mesa'),
        apiService.getCatalog<ApiResponse<Platillo>>('platillo'),
        apiService.getCatalog<ApiResponse<Guiso>>('guiso'),
        apiService.getCatalog<ApiResponse<any>>('producto'),
        apiService.getOrdenes(),
      ]);

      setMesas(Array.isArray(mesasResponse.data?.items) ? mesasResponse.data.items : Array.isArray(mesasResponse.data) ? mesasResponse.data : []);
      setPlatillos(Array.isArray(platillosResponse.data?.items) ? platillosResponse.data.items : Array.isArray(platillosResponse.data) ? platillosResponse.data : []);
      setGuisos(Array.isArray(guisosResponse.data?.items) ? guisosResponse.data.items : Array.isArray(guisosResponse.data) ? guisosResponse.data : []);
      setProductos(Array.isArray(productosResponse.data?.items) ? productosResponse.data.items : Array.isArray(productosResponse.data) ? productosResponse.data : []);
      
      // Procesar órdenes activas para identificar mesas ocupadas
      if (ordenesResponse.success && ordenesResponse.data) {
        const ordenes = Array.isArray(ordenesResponse.data.ordenes) ? ordenesResponse.data.ordenes : [];
        
        // Filtrar órdenes que no están pagadas ni canceladas
        const ordenesActivas = ordenes.filter((orden: any) => 
          orden.estatus !== 'Pagada' && orden.estatus !== 'Cancelado'
        );
        
        // Identificar mesas ocupadas
        const mesasConOrdenes = new Set<string>();
        ordenesActivas.forEach((orden: any) => {
          if (orden.idMesa) {
            mesasConOrdenes.add(String(orden.idMesa));
          }
        });
        
        setOrdenesActivas(ordenesActivas);
        setMesasOcupadas(mesasConOrdenes);
      }
    } catch (error) {
      setError('Error cargando datos iniciales');
      setMesas([]);
      setPlatillos([]);
      setGuisos([]);
      setOrdenesActivas([]);
      setMesasOcupadas(new Set());
    }
  };

  const getMesaInfo = (mesaId: string | undefined) => {
    if (!mesaId) {
      return {
        isOcupada: false,
        totalOrdenes: 0,
        ordenes: [],
        estatusOrdenes: []
      };
    }
    
    const ordenesMesa = ordenesActivas.filter((orden: any) => String(orden.idMesa) === String(mesaId));
    const isOcupada = mesasOcupadas.has(String(mesaId));
    
    return {
      isOcupada,
      totalOrdenes: ordenesMesa.length,
      ordenes: ordenesMesa,
      estatusOrdenes: ordenesMesa.map((orden: any) => orden.estatus)
    };
  };

  const handleAddProducto = () => {
    if (!selectedProducto) {
      setError('Selecciona un producto');
      return;
    }
    const nuevo = {
      idProducto: selectedProducto._id,
      nombreProducto: selectedProducto.nombre,
      costoProducto: selectedProducto.costo,
      cantidad: cantidadProducto
    };
    setProductosSeleccionados(prev => [...prev, nuevo]);
    setSelectedProducto(null);
    setCantidadProducto(1);
  };

  const handleAddPlatillo = () => {
    if (!selectedPlatillo || !selectedGuiso) {
      setError('Selecciona un platillo y guiso');
      return;
    }

    const nuevo: PlatilloSeleccionado = {
      platillo: selectedPlatillo,
      guiso: selectedGuiso,
      cantidad,
    };

    setPlatillosSeleccionados(prev => [...prev, nuevo]);
    setSelectedPlatillo(null);
    setSelectedGuiso(null);
    setCantidad(1);
  };

  const handleRemovePlatillo = (index: number) => {
    setPlatillosSeleccionados(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitOrder = async () => {
    if (!selectedMesa || !nombreSuborden) {
      setError('Completa todos los campos');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Calcula el total en el frontend justo antes de crear la orden, usando el estado actual
      const estatus = isOrderComplete ? 'Recepcion' : 'Pendiente';
      // Calcula el total sumando platillos y productos seleccionados
      const totalPlatillos = platillosSeleccionados.reduce(
        (sum, item) => sum + ((item.platillo.costo ?? 0) * item.cantidad),
        0
      );
      const totalProductos = productosSeleccionados.reduce(
        (sum, item) => sum + (item.costoProducto * item.cantidad),
        0
      );
      const totalCalculado = totalPlatillos + totalProductos;
      const ordenData = {
        idMesa: selectedMesa._id,
        nombreMesa: selectedMesa.nombre,
        idTipoOrden: 1, // Mesa type
        nombreTipoOrden: 'Mesa',
        nombreCliente: nombreSuborden, // Usar nombreSuborden como nombre del cliente
        total: totalCalculado,
        estatus,
      };

      const ordenResponse = await apiService.createOrden(ordenData);
      const ordenDataWithId = ordenResponse.data as { _id: string } | undefined;
      if (!ordenResponse.success || !ordenDataWithId?._id) {
        setError('Error creando orden');
        setLoading(false);
        return;
      }
      const ordenId = ordenDataWithId._id;

      // 2. Crear la suborden
      const subordenData = { nombre: nombreSuborden };
      const subordenResponse = await apiService.addSuborden(ordenId, subordenData);
      if (
        !subordenResponse.success ||
        !(subordenResponse.data && (subordenResponse.data as { _id?: string })._id)
      ) {
        setError('Error creando suborden');
        setLoading(false);
        return;
      }

      const subordenId = (subordenResponse.data as { _id: string })._id;

      // 3. Agregar los platillos seleccionados a la suborden
      for (const item of platillosSeleccionados) {
        const platilloData = {
          idPlatillo: Number(item.platillo._id),
          nombrePlatillo: item.platillo.nombre,
          idGuiso: Number(item.guiso._id),
          nombreGuiso: item.guiso.nombre,
          costoPlatillo: item.platillo.costo,
          cantidad: item.cantidad
        };

        const platilloResponse = await apiService.addPlatillo(subordenId, platilloData);
        if (!platilloResponse.success) {
          setError(`Error agregando platillo: ${item.platillo.nombre}`);
          setLoading(false);
          return;
        }
      }

      // 4. Agregar los productos seleccionados a la orden
      for (const producto of productosSeleccionados) {
        const productoData = {
          ...producto,
          idOrden: ordenId
        };
        const productoResponse = await apiService.addProducto(ordenId, productoData);
        if (!productoResponse.success) {
          setError(`Error agregando producto: ${producto.nombreProducto || producto.nombre}`);
          setLoading(false);
          return;
        }
      }

      // Consultar la orden para obtener el total actualizado
      let totalFinal = 0;
      try {
        const ordenFinalResponse = await apiService.getOrden(ordenId);
        if (ordenFinalResponse.success && ordenFinalResponse.data) {
          totalFinal = ordenFinalResponse.data.total ?? 0;
        }
      } catch (e) {
        // Si falla, deja el total en 0
      }

      setSuccess(`Orden creada exitosamente. Total: $${(totalFinal ?? 0).toFixed(2)}`);
      setTimeout(() => {
        setCurrentStep(1);
        setSelectedMesa(null);
        setNombreSuborden('');
        setPlatillosSeleccionados([]);
        setSuccess('');
        setError('');
        loadInitialData(); // <-- Recarga los datos iniciales
      }, 2000);

    } catch (error) {
      console.error('Error al crear la orden:', error); // Debugging log
      setError('Error creando la orden');
    } finally {
      setLoading(false);
    }
  };


  const canProceedToNext = () => {
    switch (currentStep) {
      case 1: return !!selectedMesa;
      case 2: return !!nombreSuborden;
      case 3: return platillosSeleccionados.length > 0 || productosSeleccionados.length > 0;
      case 4: return true; // Validation step, always allow to proceed
      default: return false;
    }
  };

  const getTotalOrden = () => {
    return (
      platillosSeleccionados.reduce(
        (sum, item) => sum + ((item.platillo.costo ?? 0) * item.cantidad),
        0
      ) +
      productosSeleccionados.reduce(
        (sum, item) => sum + (item.costoProducto * item.cantidad),
        0
      )
    );
  };

  if (success) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">¡Orden Creada!</h2>
          <p className="text-gray-600">{success}</p>
        </div>
      </div>
    );
  }


  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Nueva Orden</h1>
        <p className="text-gray-600">Crea una nueva orden paso a paso</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between overflow-x-auto pb-2">
          {steps.map((step, index) => (
            <div key={step.step} className="flex items-center min-w-0 flex-shrink-0">
              <div
                className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 ${
                  step.step === currentStep
                    ? 'bg-orange-600 border-orange-600 text-white'
                    : step.completed
                    ? 'bg-green-600 border-green-600 text-white'
                    : 'border-gray-300 text-gray-500'
                }`}
              >
                {step.completed && step.step !== currentStep ? (
                  <Check className="w-5 h-5" />
                ) : (
                  step.step
                )}
              </div>
              <span
                className={`ml-2 text-xs sm:text-sm font-medium truncate ${
                  step.step === currentStep
                    ? 'text-orange-600'
                    : step.completed
                    ? 'text-green-600'
                    : 'text-gray-500'
                }`}
              >
                {step.title}
              </span>
              {index < steps.length - 1 && (
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300 mx-2 sm:mx-4 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        {/* Step 1: Select Table */}
        {currentStep === 1 && (
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Seleccionar Mesa</h2>
            <div className="mb-4">
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-100 border border-green-300 rounded mr-2"></div>
                  <span className="text-gray-600">Disponible</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-orange-100 border border-orange-300 rounded mr-2"></div>
                  <span className="text-gray-600">Con órdenes activas</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {mesas.filter(mesa => mesa.activo !== false).map((mesa) => {
                const mesaInfo = getMesaInfo(mesa._id);
                const isSelected = selectedMesa?._id === mesa._id;
                
                return (
                  <button
                    key={mesa._id}
                    onClick={() => setSelectedMesa(mesa)}
                    className={`relative p-3 sm:p-4 rounded-lg border-2 text-center transition-colors ${
                      isSelected
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : mesaInfo.isOcupada
                        ? 'border-orange-300 bg-orange-50 hover:border-orange-400 hover:bg-orange-100'
                        : 'border-gray-200 bg-green-50 hover:border-green-300 hover:bg-green-100'
                    }`}
                  >
                    {mesaInfo.isOcupada && (
                      <div className="absolute top-1 right-1">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      </div>
                    )}
                    <div className="text-base sm:text-lg font-semibold">{mesa.nombre}</div>
                    <div className={`text-xs sm:text-sm ${
                      mesaInfo.isOcupada ? 'text-orange-600' : 'text-green-600'
                    }`}>
                      {mesaInfo.isOcupada 
                        ? `${mesaInfo.totalOrdenes} orden${mesaInfo.totalOrdenes !== 1 ? 'es' : ''} activa${mesaInfo.totalOrdenes !== 1 ? 's' : ''}`
                        : 'Disponible'
                      }
                    </div>
                  </button>
                );
              })}
            </div>
            
            {selectedMesa && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-medium text-blue-900 mb-2">Mesa seleccionada: {selectedMesa.nombre}</h3>
                {(() => {
                  const mesaInfo = getMesaInfo(selectedMesa._id);
                  return mesaInfo.isOcupada ? (
                    <div className="space-y-2">
                      <p className="text-sm text-blue-800">
                        Esta mesa tiene {mesaInfo.totalOrdenes} orden{mesaInfo.totalOrdenes !== 1 ? 'es' : ''} activa{mesaInfo.totalOrdenes !== 1 ? 's' : ''}:
                      </p>
                      <div className="space-y-1">
                        {mesaInfo.ordenes.map((orden: any, index: number) => (
                          <div key={index} className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded">
                            Folio #{orden.folio || 'N/A'} - Estado: {orden.estatus} - Total: ${orden.total?.toFixed(2) || '0.00'}
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-blue-800 font-medium">
                        Puedes agregar una nueva orden a esta mesa.
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-blue-800">Mesa disponible - No hay órdenes activas.</p>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Create Suborder */}
        {currentStep === 2 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Crear Suborden</h2>
            <div className="mb-4">
              <p className="text-gray-600">Mesa seleccionada: <span className="font-medium">{selectedMesa?.nombre}</span></p>
            </div>
            <div>
              <label htmlFor="nombreSuborden" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del cliente
              </label>
              <input
                id="nombreSuborden"
                type="text"
                value={nombreSuborden}
                onChange={(e) => setNombreSuborden(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Nombre del cliente"
              />
            </div>
          </div>
        )}

        {/* Step 3: Add Dishes */}
        {currentStep === 3 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Agregar Platillos y Productos</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Add Dish Form */}
              <div className="space-y-4">
                {/* Platillo Form */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Platillo
                  </label>
                  <select
                    value={selectedPlatillo ? String(selectedPlatillo._id) : ''}
                    onChange={(e) => {
                      const platillo = platillos.find(p => String(p._id) === e.target.value);
                      setSelectedPlatillo(platillo || null);
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Seleccionar platillo</option>
                    {platillos.filter(p => p.activo).map((platillo) => (
                      <option key={platillo._id} value={platillo._id}>
                        {platillo.nombre} - ${platillo.costo}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Guiso
                  </label>
                  <select
                    value={selectedGuiso ? String(selectedGuiso._id) : ''}
                    onChange={(e) => {
                      const guiso = guisos.find(g => String(g._id) === e.target.value);
                      setSelectedGuiso(guiso || null);
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Seleccionar guiso</option>
                    {guisos.filter(g => g.activo).map((guiso) => (
                      <option key={guiso._id} value={guiso._id}>
                        {guiso.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cantidad
                  </label>
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                      className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-lg font-semibold w-12 text-center">{cantidad}</span>
                    <button
                      type="button"
                      onClick={() => setCantidad(cantidad + 1)}
                      className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleAddPlatillo}
                  disabled={!selectedPlatillo || !selectedGuiso}
                  className="w-full bg-orange-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-5 h-5 inline mr-2" />
                  Agregar Platillo
                </button>

                {/* Producto Form */}
                <div className="mt-8">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Producto
                  </label>
                  <select
                    value={selectedProducto ? String(selectedProducto._id) : ''}
                    onChange={(e) => {
                      const prod = productos.find(p => String(p._id) === e.target.value);
                      setSelectedProducto(prod || null);
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Seleccionar producto</option>
                    {productos.filter(p => p.activo).map((producto) => (
                      <option key={producto._id} value={producto._id}>
                        {producto.nombre} - ${producto.costo}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cantidad
                  </label>
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => setCantidadProducto(Math.max(1, cantidadProducto - 1))}
                      className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-lg font-semibold w-12 text-center">{cantidadProducto}</span>
                    <button
                      type="button"
                      onClick={() => setCantidadProducto(cantidadProducto + 1)}
                      className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleAddProducto}
                  disabled={!selectedProducto}
                  className="w-full bg-green-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus className="w-5 h-5 inline mr-2" />
                  Agregar Producto
                </button>
              </div>

              {/* Selected Items List */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Platillos Seleccionados ({platillosSeleccionados.length})
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {platillosSeleccionados.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.platillo.nombre}</h4>
                        <p className="text-sm text-gray-600">
                          {item.guiso.nombre} • Cantidad: {item.cantidad}
                        </p>
                        <p className="text-sm font-medium text-green-600">
                          ${((item.platillo.costo ?? 0) * item.cantidad).toFixed(2)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemovePlatillo(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <h3 className="text-lg font-medium text-gray-900 mt-8 mb-4">
                  Productos Seleccionados ({productosSeleccionados.length})
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {productosSeleccionados.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.nombreProducto}</h4>
                        <p className="text-sm text-gray-600">
                          Cantidad: {item.cantidad}
                        </p>
                        <p className="text-sm font-medium text-green-600">
                          ${(item.costoProducto * item.cantidad).toFixed(2)}
                        </p>
                      </div>
                      <button
                        onClick={() => setProductosSeleccionados(prev => prev.filter((_, i) => i !== index))}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                {(platillosSeleccionados.length > 0 || productosSeleccionados.length > 0) && (
                  <div className="mt-4 p-4 bg-orange-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">Total:</span>
                      <span className="text-xl font-bold text-orange-600">
                        ${(
                          platillosSeleccionados.reduce((sum, item) => sum + ((item.platillo.costo ?? 0) * item.cantidad), 0) +
                          productosSeleccionados.reduce((sum, item) => sum + (item.costoProducto * item.cantidad), 0)
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Confirm Order */}
        {currentStep === 4 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Validar y Confirmar Orden</h2>
            
            <div className="space-y-6">
              {/* Order Validation Section */}
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <h3 className="font-medium text-blue-900 mb-4">Validación de Orden</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-800">¿La orden está completa?</span>
                    <div className="flex space-x-3">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="orderComplete"
                          checked={isOrderComplete}
                          onChange={() => setIsOrderComplete(true)}
                          className="mr-2 text-blue-600"
                        />
                        <span className="text-sm text-blue-800">Sí, completa</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="orderComplete"
                          checked={!isOrderComplete}
                          onChange={() => setIsOrderComplete(false)}
                          className="mr-2 text-orange-600"
                        />
                        <span className="text-sm text-blue-800">No, pendiente</span>
                      </label>
                    </div>
                  </div>
                  <div className={`p-3 rounded-md ${isOrderComplete ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                    <p className="text-sm">
                      {isOrderComplete 
                        ? '✓ La orden será enviada directamente a preparación (Estado: Recepción)'
                        : '⚠ La orden será marcada como pendiente para revisión (Estado: Pendiente)'
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-4">Resumen de la Orden</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Mesa:</span>
                    <span className="ml-2 font-medium">{selectedMesa?.nombre}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Suborden:</span>
                    <span className="ml-2 font-medium">{nombreSuborden}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Platillos:</span>
                    <span className="ml-2 font-medium">{platillosSeleccionados.length} items</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Productos:</span>
                    <span className="ml-2 font-medium">{productosSeleccionados.length} items</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Total:</span>
                    <span className="ml-2 font-medium text-orange-600">${getTotalOrden().toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Estado:</span>
                    <span className={`ml-2 font-medium ${isOrderComplete ? 'text-green-600' : 'text-orange-600'}`}>
                      {isOrderComplete ? 'Recepción' : 'Pendiente'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Detalle de Platillos</h4>
                <div className="space-y-2">
                  {platillosSeleccionados.map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span>{item.cantidad}x {item.platillo.nombre} ({item.guiso.nombre})</span>
                      <span className="font-medium">${((item.platillo.costo ?? 0) * item.cantidad).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <h4 className="font-medium text-gray-900 mt-6 mb-3">Detalle de Productos</h4>
                <div className="space-y-2">
                  {productosSeleccionados.length === 0 ? (
                    <span className="text-sm text-gray-500">No hay productos agregados</span>
                  ) : (
                    productosSeleccionados.map((item, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span>{item.cantidad}x {item.nombreProducto}</span>
                        <span className="font-medium">${(item.costoProducto * item.cantidad).toFixed(2)}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <button
                onClick={handleSubmitOrder}
                disabled={loading || !selectedMesa || !nombreSuborden || (platillosSeleccionados.length === 0 && productosSeleccionados.length === 0)}
                className="w-full bg-green-600 text-white px-6 py-4 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                ) : (
                  <ChefHat className="w-5 h-5 mr-2" />
                )}
                {loading ? 'Creando Orden...' : 'Confirmar y Crear Orden'}
              </button>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Anterior
          </button>

          {currentStep < 4 && (
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!canProceedToNext()}
              className="flex items-center px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
              <ArrowRight className="w-4 h-4 ml-2" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NuevaOrden;