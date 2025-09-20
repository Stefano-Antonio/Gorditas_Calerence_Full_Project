import React, { useState, useEffect } from 'react';
import {
  Plus,
  Minus,
  Check,
  ArrowLeft,
  ArrowRight,
  ChefHat
} from 'lucide-react';
import { apiService } from '../services/api';
import { Mesa, Platillo, Guiso, OrderStep, ApiResponse, Extra, TipoExtra } from '../types';

interface PlatilloSeleccionado {
  platillo: Platillo;
  guiso: Guiso;
  cantidad: number;
  extras: any[];
  notas: string; // Notas específicas del platillo
}

interface OrdenEnProceso {
  nombreCliente: string;
  notas: string;
  platillos: PlatilloSeleccionado[];
  productos: any[];
  total: number;
}

const NuevaOrden: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedMesa, setSelectedMesa] = useState<Mesa | null>(null);
  const [nombreSuborden, setNombreSuborden] = useState('');
  const [platillosSeleccionados, setPlatillosSeleccionados] = useState<PlatilloSeleccionado[]>([]);
  // Agrega estado para productos seleccionados
  const [productosSeleccionados, setProductosSeleccionados] = useState<any[]>([]);
  // Estado temporal para extras antes de vincularlos a un platillo
  const [extrasTemporales, setExtrasTemporales] = useState<any[]>([]);
  // Estado para acumular múltiples órdenes de la misma mesa
  const [ordenesEnProceso, setOrdenesEnProceso] = useState<OrdenEnProceso[]>([]);
  
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [mesasOcupadas, setMesasOcupadas] = useState<Set<string>>(new Set());
  const [ordenesActivas, setOrdenesActivas] = useState<any[]>([]);
  const [platillos, setPlatillos] = useState<Platillo[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [tiposExtras, setTiposExtras] = useState<TipoExtra[]>([]);
  const [selectedProducto, setSelectedProducto] = useState<any | null>(null);
  const [cantidadProducto, setCantidadProducto] = useState(1);
  const [selectedExtra, setSelectedExtra] = useState<Extra | null>(null);
  const [cantidadExtra, setCantidadExtra] = useState(1);
  const [selectedTipoExtra, setSelectedTipoExtra] = useState<TipoExtra | null>(null);
  const [guisos, setGuisos] = useState<Guiso[]>([]);
  const [selectedPlatillo, setSelectedPlatillo] = useState<Platillo | null>(null);
  const [selectedGuiso, setSelectedGuiso] = useState<Guiso | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [notasPlatillo, setNotasPlatillo] = useState(''); // Campo para notas del platillo individual
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isOrderComplete, setIsOrderComplete] = useState(true); // For order validation
  const [notas, setNotas] = useState(''); // Field for order notes

  const steps: OrderStep[] = [
    { step: 1, title: 'Seleccionar Mesa', completed: !!selectedMesa },
    { step: 2, title: 'Crear Suborden', completed: !!nombreSuborden },
    { step: 3, title: 'Agregar Items', completed: platillosSeleccionados.length > 0 || productosSeleccionados.length > 0 },
    { step: 4, title: 'Validar y Confirmar', completed: false },
  ];

  // Función para guardar la orden actual en el array de órdenes en proceso
  const guardarOrdenActual = () => {
    if (!nombreSuborden || (platillosSeleccionados.length === 0 && productosSeleccionados.length === 0)) {
      setError('Complete todos los campos antes de agregar otra orden');
      return false;
    }

    const totalOrden = getTotalOrden();
    const nuevaOrden: OrdenEnProceso = {
      nombreCliente: nombreSuborden,
      notas: notas,
      platillos: [...platillosSeleccionados],
      productos: [...productosSeleccionados],
      total: totalOrden
    };

    setOrdenesEnProceso(prev => [...prev, nuevaOrden]);
    return true;
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [mesasResponse, platillosResponse, guisosResponse, productosResponse, extrasResponse, tiposExtrasResponse, ordenesResponse] = await Promise.all([
        apiService.getCatalog<ApiResponse<Mesa>>('mesa'),
        apiService.getCatalog<ApiResponse<Platillo>>('platillo'),
        apiService.getCatalog<ApiResponse<Guiso>>('guiso'),
        apiService.getCatalog<ApiResponse<any>>('producto'),
        apiService.getCatalog<ApiResponse<Extra>>('extra'),
        apiService.getCatalog<ApiResponse<TipoExtra>>('tipoextra'),
        apiService.getOrdenes(),
      ]);

      setMesas(Array.isArray(mesasResponse.data?.items) ? mesasResponse.data.items : Array.isArray(mesasResponse.data) ? mesasResponse.data : []);
      setPlatillos(Array.isArray(platillosResponse.data?.items) ? platillosResponse.data.items : Array.isArray(platillosResponse.data) ? platillosResponse.data : []);
      setGuisos(Array.isArray(guisosResponse.data?.items) ? guisosResponse.data.items : Array.isArray(guisosResponse.data) ? guisosResponse.data : []);
      setProductos(Array.isArray(productosResponse.data?.items) ? productosResponse.data.items : Array.isArray(productosResponse.data) ? productosResponse.data : []);
      setExtras(Array.isArray(extrasResponse.data?.items) ? extrasResponse.data.items : Array.isArray(extrasResponse.data) ? extrasResponse.data : []);
      setTiposExtras(Array.isArray(tiposExtrasResponse.data?.items) ? tiposExtrasResponse.data.items : Array.isArray(tiposExtrasResponse.data) ? tiposExtrasResponse.data : []);
      
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

    // Validar que la cantidad sea suficiente
    if (selectedProducto.cantidad < cantidadProducto) {
      setError('Stock insuficiente para el producto seleccionado');
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
    setError('');
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
      extras: [...extrasTemporales], // Incluir extras vinculados al platillo
      notas: notasPlatillo, // Incluir notas del platillo
    };

    setPlatillosSeleccionados(prev => [...prev, nuevo]);
    setSelectedPlatillo(null);
    setSelectedGuiso(null);
    setCantidad(1);
    setNotasPlatillo(''); // Limpiar notas después de agregar el platillo
    // Limpiar extras después de agregar el platillo
    setExtrasTemporales([]);
    setSelectedExtra(null);
    setSelectedTipoExtra(null);
    setCantidadExtra(1);
  };

  const handleAddExtra = () => {
    if (!selectedExtra) {
      setError('Selecciona un extra');
      return;
    }

    const nuevo = {
      idExtra: selectedExtra._id,
      nombreExtra: selectedExtra.nombre,
      costoExtra: selectedExtra.costo,
      idTipoExtra: selectedExtra.idTipoExtra,
      cantidad: cantidadExtra
    };

    setExtrasTemporales(prev => [...prev, nuevo]);
    setSelectedExtra(null);
    setSelectedTipoExtra(null); // Also clear the tipo extra
    setCantidadExtra(1);
    setError('');
  };

  const handleRemoveExtra = (index: number) => {
    setExtrasTemporales(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemovePlatillo = (index: number) => {
    setPlatillosSeleccionados(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitOrder = async () => {
    if (!selectedMesa || !nombreSuborden) {
      setError('Completa todos los campos');
      return;
    }

    // Guardar la orden actual antes de procesarlas
    const ordenActualGuardada = guardarOrdenActual();
    if (!ordenActualGuardada) return;

    // Combinar la orden actual con las órdenes en proceso
    const todasLasOrdenes = [
      ...ordenesEnProceso,
      {
        nombreCliente: nombreSuborden,
        notas: notas,
        platillos: [...platillosSeleccionados],
        productos: [...productosSeleccionados],
        total: getTotalOrden()
      }
    ];

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Procesar cada orden por separado
      for (const ordenData of todasLasOrdenes) {
        const estatus = isOrderComplete ? 'Recepcion' : 'Pendiente';
        
        const nuevaOrdenData = {
          idMesa: selectedMesa._id,
          nombreMesa: selectedMesa.nombre,
          idTipoOrden: 1,
          nombreTipoOrden: 'Mesa',
          nombreCliente: ordenData.nombreCliente,
          total: ordenData.total,
          estatus,
          notas: ordenData.notas || undefined
        };

        const ordenResponse = await apiService.createOrden(nuevaOrdenData);
        const ordenDataWithId = ordenResponse.data as { _id: string } | undefined;
        if (!ordenResponse.success || !ordenDataWithId?._id) {
          setError(`Error creando orden para ${ordenData.nombreCliente}`);
          setLoading(false);
          return;
        }
        const ordenId = ordenDataWithId._id;

        // Crear la suborden
        const subordenData = { nombre: ordenData.nombreCliente };
        const subordenResponse = await apiService.addSuborden(ordenId, subordenData);
        if (!subordenResponse.success || !(subordenResponse.data && (subordenResponse.data as { _id?: string })._id)) {
          setError(`Error creando suborden para ${ordenData.nombreCliente}`);
          setLoading(false);
          return;
        }

        const subordenId = (subordenResponse.data as { _id: string })._id;

        // Agregar platillos
        for (const item of ordenData.platillos) {
          const platilloData = {
            idPlatillo: Number(item.platillo._id),
            nombrePlatillo: item.platillo.nombre,
            idGuiso: Number(item.guiso._id),
            nombreGuiso: item.guiso.nombre,
            costoPlatillo: item.platillo.costo,
            cantidad: item.cantidad,
            notas: item.notas // Incluir las notas del platillo
          };

          const platilloResponse = await apiService.addPlatillo(subordenId, platilloData);
          if (!platilloResponse.success) {
            setError(`Error agregando platillo: ${item.platillo.nombre} para ${ordenData.nombreCliente}`);
            setLoading(false);
            return;
          }

          // Agregar extras del platillo si existen
          if (item.extras && item.extras.length > 0) {
            const platilloId = (platilloResponse.data as { _id: string })._id;
            for (const extra of item.extras) {
              const extraData = {
                idExtra: Number(extra.idExtra),
                nombreExtra: extra.nombreExtra,
                costoExtra: extra.costoExtra,
                cantidad: extra.cantidad
              };

              const extraResponse = await apiService.addExtra(platilloId, extraData);
              if (!extraResponse.success) {
                setError(`Error agregando extra: ${extra.nombreExtra} para ${ordenData.nombreCliente}`);
                setLoading(false);
                return;
              }
            }
          }
        }

        // Agregar productos
        for (const producto of ordenData.productos) {
          const productoData = {
            ...producto,
            idOrden: ordenId
          };
          const productoResponse = await apiService.addProducto(ordenId, productoData);
          if (!productoResponse.success) {
            setError(`Error agregando producto: ${producto.nombreProducto || producto.nombre} para ${ordenData.nombreCliente}, stock insuficiente`);
            setOrdenesEnProceso(prev => prev.filter(o => o.nombreCliente !== ordenData.nombreCliente));
            setLoading(false);
            return;
          }
        }

        // Ensure the order is not added to resumen if stock is insufficient
        if (error.includes('stock insuficiente')) {
          setOrdenesEnProceso(prev => prev.filter(o => o.nombreCliente !== ordenData.nombreCliente));
          continue;
        }
      }

      const totalTodasLasOrdenes = todasLasOrdenes.reduce((sum, orden) => sum + orden.total, 0);
      setSuccess(`${todasLasOrdenes.length} orden${todasLasOrdenes.length > 1 ? 'es' : ''} creada${todasLasOrdenes.length > 1 ? 's' : ''} exitosamente. Total: $${totalTodasLasOrdenes.toFixed(2)}`);
      
      setTimeout(() => {
        setCurrentStep(1);
        setSelectedMesa(null);
        setNombreSuborden('');
        setNotas('');
        setPlatillosSeleccionados([]);
        setProductosSeleccionados([]);
        setExtrasTemporales([]);
        setOrdenesEnProceso([]); // Limpiar órdenes en proceso
        setSelectedPlatillo(null);
        setSelectedGuiso(null);
        setSelectedProducto(null);
        setSelectedExtra(null);
        setNotasPlatillo(''); // Limpiar notas del platillo
        setCantidad(1);
        setCantidadProducto(1);
        setCantidadExtra(1);
        setCantidadProducto(1);
        setIsOrderComplete(true);
        setSuccess('');
        setError('');
        loadInitialData();
      }, 3000);

    } catch (error) {
      console.error('Error al crear las órdenes:', error);
      setError('Error creando las órdenes');
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
        (sum, item) => sum + (
          (item.platillo.costo ?? 0) * item.cantidad +
          item.extras.reduce((extraSum, extra) => extraSum + (extra.costoExtra * extra.cantidad), 0)
        ),
        0
      ) +
      productosSeleccionados.reduce(
        (sum, item) => sum + (item.costoProducto * item.cantidad),
        0
      )
    );
  };

  const getTotalTodasLasOrdenes = () => {
    const totalOrdenesEnProceso = ordenesEnProceso.reduce((sum, orden) => sum + orden.total, 0);
    const totalOrdenActual = getTotalOrden();
    return totalOrdenesEnProceso + totalOrdenActual;
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
    <div className="max-w-4xl mx-auto px-2 sm:px-4 lg:px-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Nueva Orden</h1>
        <p className="text-sm sm:text-base text-gray-600">Crea una nueva orden paso a paso</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center justify-between overflow-x-auto pb-2 px-1">
          {steps.map((step, index) => (
            <div key={step.step} className="flex items-center min-w-0 flex-shrink-0">
              <div
                className={`flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-full border-2 ${
                  step.step === currentStep
                    ? 'bg-orange-600 border-orange-600 text-white'
                    : step.completed
                    ? 'bg-green-600 border-green-600 text-white'
                    : 'border-gray-300 text-gray-500'
                }`}
              >
                {step.completed && step.step !== currentStep ? (
                  <Check className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                ) : (
                  <span className="text-xs sm:text-sm lg:text-base">{step.step}</span>
                )}
              </div>
              <span
                className={`ml-1 sm:ml-2 text-[10px] sm:text-xs lg:text-sm font-medium truncate max-w-[60px] sm:max-w-[80px] lg:max-w-none ${
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
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-gray-300 mx-1 sm:mx-2 lg:mx-4 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-3 sm:px-4 py-2 sm:py-3 rounded-lg mb-4 sm:mb-6 text-sm">
          <span className="block truncate">{error}</span>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6">
        {/* Step 1: Select Table */}
        {currentStep === 1 && (
          <div>
            <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Seleccionar Mesa</h2>
            <div className="mb-3 sm:mb-4">
              <div className="flex items-center space-x-3 sm:space-x-4 text-xs sm:text-sm">
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
              {mesas.filter(mesa => mesa.activo !== false).map((mesa) => {
                const mesaInfo = getMesaInfo(mesa._id);
                const isSelected = selectedMesa?._id === mesa._id;
                
                return (
                  <button
                    key={mesa._id}
                    onClick={() => setSelectedMesa(mesa)}
                    className={`relative p-2 sm:p-3 lg:p-4 rounded-lg border-2 text-center transition-colors min-w-0 ${
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
                    <div className="text-sm sm:text-base lg:text-lg font-semibold truncate">{mesa.nombre}</div>
                    <div className={`text-[10px] sm:text-xs lg:text-sm truncate ${
                      mesaInfo.isOcupada ? 'text-orange-600' : 'text-green-600'
                    }`}>
                      {mesaInfo.isOcupada 
                        ? `${mesaInfo.totalOrdenes} orden${mesaInfo.totalOrdenes !== 1 ? 'es' : ''}`
                        : 'Disponible'
                      }
                    </div>
                  </button>
                );
              })}
            </div>
            
            {selectedMesa && (
              <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-medium text-blue-900 mb-2 text-sm sm:text-base truncate">Mesa seleccionada: {selectedMesa.nombre}</h3>
                {(() => {
                  const mesaInfo = getMesaInfo(selectedMesa._id);
                  return mesaInfo.isOcupada ? (
                    <div className="space-y-2">
                      <p className="text-xs sm:text-sm text-blue-800">
                        Esta mesa tiene {mesaInfo.totalOrdenes} orden{mesaInfo.totalOrdenes !== 1 ? 'es' : ''} activa{mesaInfo.totalOrdenes !== 1 ? 's' : ''}:
                      </p>
                      <div className="space-y-1">
                        {mesaInfo.ordenes.map((orden: any, index: number) => (
                          <div key={index} className="text-[10px] sm:text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded break-words">
                            <span className="block truncate">Folio #{orden.folio || 'N/A'} - Cliente: {orden.nombreCliente || 'Sin nombre'}</span>
                            <span className="block truncate">Estado: {orden.estatus} - Total: ${orden.total?.toFixed(2) || '0.00'}</span>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs sm:text-sm text-blue-800 font-medium">
                        Puedes agregar una nueva orden a esta mesa.
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs sm:text-sm text-blue-800">Mesa disponible - No hay órdenes activas.</p>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Create Suborden */}
        {currentStep === 2 && (
          <div>
            <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Crear Suborden</h2>
            <div className="mb-3 sm:mb-4">
              <p className="text-sm sm:text-base text-gray-600">Mesa seleccionada: <span className="font-medium truncate">{selectedMesa?.nombre}</span></p>
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
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
                placeholder="Nombre del cliente"
              />
            </div>
          </div>
        )}

        {/* Step 3: Add Dishes */}
        {currentStep === 3 && (
          <div>
            <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Agregar Platillos y Productos</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Add Dish Form */}
              <div className="space-y-3 sm:space-y-4">
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
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm sm:text-base"
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
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm sm:text-base"
                  >
                    <option value="">Seleccionar guiso</option>
                    {guisos.filter(g => g.activo).map((guiso) => (
                      <option key={guiso._id} value={guiso._id}>
                        {guiso.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Extra Form - Simplified */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Extra
                  </label>
                  <select
                    value={selectedExtra ? String(selectedExtra._id) : ''}
                    onChange={(e) => {
                      const extra = extras.find(ex => String(ex._id) === e.target.value);
                      setSelectedExtra(extra || null);
                      // Automatically set the tipo extra when extra is selected
                      if (extra) {
                        const tipoExtra = tiposExtras.find(t => String(t._id) === String(extra.idTipoExtra));
                        setSelectedTipoExtra(tipoExtra || null);
                      }
                    }}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm sm:text-base"
                  >
                    <option value="">Seleccionar extra</option>
                    {extras.filter(ex => ex.activo).map((extra) => {
                      // Find the tipo extra name for display
                      const tipoExtra = tiposExtras.find(t => String(t._id) === String(extra.idTipoExtra));
                      return (
                        <option key={extra._id} value={extra._id}>
                          {extra.nombre} ({tipoExtra?.nombre || 'Sin categoría'}) - ${extra.costo}
                        </option>
                      );
                    })}
                  </select>
                </div>
                {selectedExtra && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cantidad Extra
                      </label>
                      <div className="flex items-center space-x-3">
                        <button
                          type="button"
                          onClick={() => setCantidadExtra(Math.max(1, cantidadExtra - 1))}
                          className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="text-lg font-semibold w-12 text-center">{cantidadExtra}</span>
                        <button
                          type="button"
                          onClick={() => setCantidadExtra(cantidadExtra + 1)}
                          className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={handleAddExtra}
                      disabled={!selectedExtra}
                      className="w-full bg-purple-600 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
                    >
                      <Plus className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2" />
                      <span className="hidden sm:inline">Agregar Extra</span>
                      <span className="sm:hidden">Extra</span>
                    </button>
                  </>
                )}

                {/* Lista de extras temporales */}
                {extrasTemporales.length > 0 && (
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <h4 className="text-sm font-medium text-purple-800 mb-2">
                      Extras para este platillo ({extrasTemporales.length}):
                    </h4>
                    <div className="space-y-2">
                      {extrasTemporales.map((extra, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="text-purple-700">
                            {extra.nombreExtra} (x{extra.cantidad}) - ${(extra.costoExtra * extra.cantidad).toFixed(2)}
                          </span>
                          <button
                            onClick={() => handleRemoveExtra(index)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
                
                {/* Campo para notas del platillo */}
                <div>
                  <label htmlFor="notasPlatillo" className="block text-sm font-medium text-gray-700 mb-2">
                    Notas del platillo (opcional)
                  </label>
                  <textarea
                    id="notasPlatillo"
                    value={notasPlatillo}
                    onChange={(e) => setNotasPlatillo(e.target.value)}
                    maxLength={200}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none text-sm"
                    placeholder="Ej: Sin cebolla, extra salsa, etc."
                  />
                  <p className="text-xs text-gray-500 mt-1">{notasPlatillo.length}/200 caracteres</p>
                </div>
                
                <button
                  onClick={handleAddPlatillo}
                  disabled={!selectedPlatillo || !selectedGuiso}
                  className="w-full bg-orange-600 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2" />
                  <span className="hidden sm:inline">Agregar Platillo</span>
                  <span className="sm:hidden">Platillo</span>
                </button>

                {/* Producto Form */}
                <div className="mt-6 sm:mt-8">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Producto
                  </label>
                  <select
                    value={selectedProducto ? String(selectedProducto._id) : ''}
                    onChange={(e) => {
                      const prod = productos.find(p => String(p._id) === e.target.value);
                      setSelectedProducto(prod || null);
                    }}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm sm:text-base"
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
                  className="w-full bg-green-600 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2" />
                  <span className="hidden sm:inline">Agregar Producto</span>
                  <span className="sm:hidden">Producto</span>
                </button>
              </div>

              {/* Selected Items List */}
              <div>
                <h3 className="text-sm sm:text-base lg:text-lg font-medium text-gray-900 mb-3 sm:mb-4">
                  Platillos Seleccionados ({platillosSeleccionados.length})
                </h3>
                <div className="space-y-2 sm:space-y-3 max-h-80 sm:max-h-96 overflow-y-auto">
                  {platillosSeleccionados.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start justify-between p-3 sm:p-4 bg-gray-50 rounded-lg gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900">{item.platillo.nombre}</h4>
                        <p className="text-sm text-gray-600">
                          {item.guiso.nombre} • Cantidad: {item.cantidad}
                        </p>
                        {item.extras.length > 0 && (
                          <div className="mt-1">
                            <p className="text-xs text-purple-600 font-medium">Extras:</p>
                            {item.extras.map((extra, extraIndex) => (
                              <p key={extraIndex} className="text-xs text-purple-500">
                                • {extra.nombreExtra} (x{extra.cantidad}) - ${(extra.costoExtra * extra.cantidad).toFixed(2)}
                              </p>
                            ))}
                          </div>
                        )}
                        {item.notas && (
                          <div className="mt-1">
                            <p className="text-xs text-blue-600 font-medium">Notas:</p>
                            <p className="text-xs text-blue-500 italic">
                              "{item.notas}"
                            </p>
                          </div>
                        )}
                        <div className="text-sm font-medium text-green-600">
                          {item.extras.length > 0 ? (
                            <div>
                              <div className="text-xs text-gray-500">
                                Platillo: ${((item.platillo.costo ?? 0) * item.cantidad).toFixed(2)} + 
                                Extras: ${item.extras.reduce((sum, extra) => sum + (extra.costoExtra * extra.cantidad), 0).toFixed(2)}
                              </div>
                              <div className="font-bold">
                                Total: ${(
                                  (item.platillo.costo ?? 0) * item.cantidad + 
                                  item.extras.reduce((sum, extra) => sum + (extra.costoExtra * extra.cantidad), 0)
                                ).toFixed(2)}
                              </div>
                            </div>
                          ) : (
                            <div>
                              ${((item.platillo.costo ?? 0) * item.cantidad).toFixed(2)}
                            </div>
                          )}
                        </div>
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
                <h3 className="text-sm sm:text-base lg:text-lg font-medium text-gray-900 mt-6 sm:mt-8 mb-3 sm:mb-4">
                  Productos Seleccionados ({productosSeleccionados.length})
                </h3>
                <div className="space-y-2 sm:space-y-3 max-h-80 sm:max-h-96 overflow-y-auto">
                  {productosSeleccionados.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start justify-between p-3 sm:p-4 bg-gray-50 rounded-lg gap-3"
                    >
                      <div className="flex-1 min-w-0">
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
                  <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-orange-50 rounded-lg">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                      <span className="text-base sm:text-lg font-semibold text-gray-900">Total:</span>
                      <span className="text-base sm:text-lg font-medium text-orange-600">${getTotalOrden().toFixed(2)}</span>
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
            <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Validar y Confirmar Orden</h2>
            
            <div className="space-y-4 sm:space-y-6">
              {/* Order Validation Section */}
              <div className="bg-blue-50 p-3 sm:p-4 lg:p-6 rounded-lg border border-blue-200">
                <h3 className="font-medium text-blue-900 mb-3 sm:mb-4 text-sm sm:text-base">Validación de Orden</h3>
                <div className="space-y-3">
                  <div className="flex flex-col gap-3">
                    <span className="text-xs sm:text-sm text-blue-800">¿La orden está completa?</span>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="orderComplete"
                          checked={isOrderComplete}
                          onChange={() => setIsOrderComplete(true)}
                          className="mr-2 text-blue-600 flex-shrink-0"
                        />
                        <span className="text-xs sm:text-sm text-blue-800">Sí, completa</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="orderComplete"
                          checked={!isOrderComplete}
                          onChange={() => setIsOrderComplete(false)}
                          className="mr-2 text-orange-600 flex-shrink-0"
                        />
                        <span className="text-xs sm:text-sm text-blue-800">No, pendiente</span>
                      </label>
                    </div>
                  </div>
                  <div className={`p-2 sm:p-3 rounded-md ${isOrderComplete ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                    <p className="text-xs sm:text-sm break-words">
                      {isOrderComplete 
                        ? '✓ La orden será enviada directamente a preparación (Estado: Recepción)'
                        : '⚠ La orden será marcada como pendiente para revisión (Estado: Pendiente)'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes field */}
              <div className="bg-gray-50 p-3 sm:p-4 lg:p-6 rounded-lg border border-gray-200">
                <h3 className="font-medium text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Notas de la Orden</h3>
                <div>
                  <label htmlFor="notas" className="block text-sm font-medium text-gray-700 mb-2">
                    Comentarios generales (opcional)
                  </label>
                  <textarea
                    id="notas"
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    maxLength={500}
                    rows={3}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none text-sm sm:text-base"
                    placeholder="Comentarios especiales, instrucciones de cocina, alergias, etc."
                  />
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">{notas.length}/500 caracteres</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Resumen de las Órdenes</h3>
                
                {/* Órdenes ya guardadas en proceso */}
                {ordenesEnProceso.map((orden, index) => (
                  <div key={index} className="mb-3 sm:mb-4 p-3 sm:p-4 bg-white rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-700 mb-2 sm:mb-3 text-xs sm:text-sm truncate">Orden #{index + 1} - {orden.nombreCliente}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 lg:gap-4 text-xs sm:text-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center min-w-0">
                        <span className="text-gray-600 flex-shrink-0">Platillos:</span>
                        <span className="sm:ml-2 font-medium truncate">{orden.platillos.length} items</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center min-w-0">
                        <span className="text-gray-600 flex-shrink-0">Productos:</span>
                        <span className="sm:ml-2 font-medium truncate">{orden.productos.length} items</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center min-w-0">
                        <span className="text-gray-600 flex-shrink-0">Total:</span>
                        <span className="sm:ml-2 font-medium text-green-600">${orden.total.toFixed(2)}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center min-w-0">
                        <span className="text-gray-600 flex-shrink-0">Notas:</span>
                        <span className="sm:ml-2 text-xs sm:text-sm truncate">{orden.notas || 'Sin notas'}</span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Orden actual */}
                <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-white rounded-lg border border-orange-200">
                  <h4 className="font-medium text-orange-700 mb-2 sm:mb-3 text-xs sm:text-sm truncate">Orden Actual - {nombreSuborden}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 lg:gap-4 text-xs sm:text-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center min-w-0">
                      <span className="text-gray-600 flex-shrink-0">Mesa:</span>
                      <span className="sm:ml-2 font-medium truncate">{selectedMesa?.nombre}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center min-w-0">
                      <span className="text-gray-600 flex-shrink-0">Cliente:</span>
                      <span className="sm:ml-2 font-medium truncate">{nombreSuborden}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center min-w-0">
                      <span className="text-gray-600 flex-shrink-0">Platillos:</span>
                      <span className="sm:ml-2 font-medium">{platillosSeleccionados.length} items</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center min-w-0">
                      <span className="text-gray-600 flex-shrink-0">Productos:</span>
                      <span className="sm:ml-2 font-medium">{productosSeleccionados.length} items</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center min-w-0">
                      <span className="text-gray-600 flex-shrink-0">Total orden:</span>
                      <span className="sm:ml-2 font-medium text-orange-600">${getTotalOrden().toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center min-w-0">
                      <span className="text-gray-600 flex-shrink-0">Estado:</span>
                      <span className={`sm:ml-2 font-medium ${isOrderComplete ? 'text-green-600' : 'text-orange-600'}`}>
                        {isOrderComplete ? 'Recepción' : 'Pendiente'}
                      </span>
                    </div>
                  </div>
                  {notas && (
                    <div className="mt-2 sm:mt-3 p-2 bg-orange-50 rounded border border-orange-100">
                      <div className="flex flex-col sm:flex-row min-w-0">
                        <span className="text-gray-600 text-xs sm:text-sm font-medium flex-shrink-0">Notas:</span>
                        <span className="sm:ml-2 text-xs sm:text-sm break-words">{notas}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Total general */}
                <div className="p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <span className="text-sm sm:text-base lg:text-lg font-semibold text-blue-900">
                      Total General ({ordenesEnProceso.length + 1} orden{ordenesEnProceso.length + 1 > 1 ? 'es' : ''}):
                    </span>
                    <span className="text-base sm:text-lg lg:text-xl font-bold text-blue-600">
                      ${getTotalTodasLasOrdenes().toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                {/* Detalles de órdenes guardadas */}
                {ordenesEnProceso.map((orden, ordenIndex) => (
                  <div key={ordenIndex} className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-800 mb-3">
                      Detalle Orden #{ordenIndex + 1} - {orden.nombreCliente}
                    </h4>
                    
                    <h5 className="font-medium text-gray-900 mb-2">Platillos:</h5>
                    <div className="space-y-1 mb-4">
                      {orden.platillos.length === 0 ? (
                        <span className="text-sm text-gray-500">No hay platillos</span>
                      ) : (
                        orden.platillos.map((item, index) => (
                          <div key={index} className="space-y-1">
                            <div className="flex justify-between items-center text-sm">
                              <span>{item.cantidad}x {item.platillo.nombre} ({item.guiso.nombre})</span>
                              <span className="font-medium">${((item.platillo.costo ?? 0) * item.cantidad).toFixed(2)}</span>
                            </div>
                            {item.notas && (
                              <div className="ml-4 text-xs text-blue-600 italic">
                                Notas: {item.notas}
                              </div>
                            )}
                            {item.extras.length > 0 && (
                              <div className="ml-4 space-y-1">
                                {item.extras.map((extra, extraIndex) => (
                                  <div key={extraIndex} className="flex justify-between items-center text-xs text-purple-600">
                                    <span>+ {extra.cantidad}x {extra.nombreExtra}</span>
                                    <span className="font-medium">${(extra.costoExtra * extra.cantidad).toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    <h5 className="font-medium text-gray-900 mb-2">Productos:</h5>
                    <div className="space-y-1 mb-4">
                      {orden.productos.length === 0 ? (
                        <span className="text-sm text-gray-500">No hay productos</span>
                      ) : (
                        orden.productos.map((item, index) => (
                          <div key={index} className="flex justify-between items-center text-sm">
                            <span>{item.cantidad}x {item.nombreProducto}</span>
                            <span className="font-medium">${(item.costoProducto * item.cantidad).toFixed(2)}</span>
                          </div>
                        ))
                      )}
                    </div>

                    {orden.notas && (
                      <div className="mt-2 p-2 bg-green-100 rounded">
                        <span className="text-sm font-medium text-green-800">Notas: </span>
                        <span className="text-sm text-green-700">{orden.notas}</span>
                      </div>
                    )}
                  </div>
                ))}

                {/* Detalles de la orden actual */}
                <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <h4 className="font-medium text-orange-800 mb-3">
                    Detalle Orden Actual - {nombreSuborden}
                  </h4>
                  
                  <h5 className="font-medium text-gray-900 mb-2">Platillos:</h5>
                  <div className="space-y-1 mb-4">
                    {platillosSeleccionados.length === 0 ? (
                      <span className="text-sm text-gray-500">No hay platillos</span>
                    ) : (
                      platillosSeleccionados.map((item, index) => (
                        <div key={index} className="space-y-1">
                          <div className="flex justify-between items-center text-sm">
                            <span>{item.cantidad}x {item.platillo.nombre} ({item.guiso.nombre})</span>
                            <span className="font-medium">${((item.platillo.costo ?? 0) * item.cantidad).toFixed(2)}</span>
                          </div>
                          {item.notas && (
                            <div className="ml-4 text-xs text-blue-600 italic">
                              Notas: {item.notas}
                            </div>
                          )}
                          {item.extras.length > 0 && (
                            <div className="ml-4 space-y-1">
                              {item.extras.map((extra, extraIndex) => (
                                <div key={extraIndex} className="flex justify-between items-center text-xs text-purple-600">
                                  <span>+ {extra.cantidad}x {extra.nombreExtra}</span>
                                  <span className="font-medium">${(extra.costoExtra * extra.cantidad).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <h5 className="font-medium text-gray-900 mb-2">Productos:</h5>
                  <div className="space-y-1 mb-4">
                    {productosSeleccionados.length === 0 ? (
                      <span className="text-sm text-gray-500">No hay productos</span>
                    ) : (
                      productosSeleccionados.map((item, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span>{item.cantidad}x {item.nombreProducto}</span>
                          <span className="font-medium">${(item.costoProducto * item.cantidad).toFixed(2)}</span>
                        </div>
                      ))
                    )}
                  </div>

                  {notas && (
                    <div className="mt-2 p-2 bg-orange-100 rounded">
                      <span className="text-sm font-medium text-orange-800">Notas: </span>
                      <span className="text-sm text-orange-700">{notas}</span>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleSubmitOrder}
                disabled={loading || !selectedMesa || !nombreSuborden || (platillosSeleccionados.length === 0 && productosSeleccionados.length === 0)}
                className="w-full bg-green-600 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center text-sm sm:text-base"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2"></div>
                ) : (
                  <ChefHat className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                )}
                <span className="truncate">
                  {loading ? 'Creando Orden...' : 'Confirmar y Crear Orden'}
                </span>
              </button>

              {/* Button to add another order for the same table */}
              <button
                onClick={() => {
                  // Guardar la orden actual antes de limpiar
                  const guardada = guardarOrdenActual();
                  if (guardada) {
                    // Reset form but keep the selected table and saved orders
                    setCurrentStep(2);
                    setNombreSuborden('');
                    setNotas('');
                    setPlatillosSeleccionados([]);
                    setProductosSeleccionados([]);
                    setExtrasTemporales([]);
                    setSelectedPlatillo(null);
                    setSelectedGuiso(null);
                    setSelectedProducto(null);
                    setSelectedExtra(null);
                    setNotasPlatillo(''); // Limpiar notas del platillo
                    setCantidad(1);
                    setCantidadProducto(1);
                    setCantidadExtra(1);
                    setIsOrderComplete(true);
                    setError('');
                    setSuccess('');
                  }
                }}
                disabled={loading || !nombreSuborden || (platillosSeleccionados.length === 0 && productosSeleccionados.length === 0)}
                className="w-full bg-orange-600 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center mt-3 text-sm sm:text-base"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                <span className="truncate">Agregar Orden de otro cliente</span>
              </button>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
          <button
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="flex items-center px-3 sm:px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="block sm:hidden">Ant</span>
            <span className="hidden sm:block">Anterior</span>
          </button>

          {currentStep < 4 && (
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!canProceedToNext()}
              className="flex items-center px-4 sm:px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              <span className="block sm:hidden">Sig</span>
              <span className="hidden sm:block">Siguiente</span>
              <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NuevaOrden;