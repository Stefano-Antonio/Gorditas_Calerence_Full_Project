import React, { useState, useEffect } from 'react';
import {
  Plus,
  Minus,
  Check,
  ArrowLeft,
  ArrowRight,
  ChefHat,
  RotateCcw
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
  // Estado para acumular múltiples órdenes de la misma mesa
  const [ordenesEnProceso, setOrdenesEnProceso] = useState<OrdenEnProceso[]>([]);
  
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [mesasOcupadas, setMesasOcupadas] = useState<Set<string>>(new Set());
  const [ordenesActivas, setOrdenesActivas] = useState<any[]>([]);
  const [platillos, setPlatillos] = useState<Platillo[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [tiposExtras, setTiposExtras] = useState<TipoExtra[]>([]);
  const [guisos, setGuisos] = useState<Guiso[]>([]);
  
  // Estados para los modales de selección
  const [modalPlatilloOpen, setModalPlatilloOpen] = useState(false);
  const [modalProductoOpen, setModalProductoOpen] = useState(false);
  const [modalGuisoOpen, setModalGuisoOpen] = useState(false);
  const [modalExtrasOpen, setModalExtrasOpen] = useState(false);
  const [modalNotasOpen, setModalNotasOpen] = useState(false);
  
  // Estado para rastrear el flujo de selección de platillo
  const [platilloEnConstruccion, setPlatilloEnConstruccion] = useState<{
    platillo: Platillo | null;
    guiso: Guiso | null;
    cantidad: number;
    extras: any[];
    notas: string;
  }>({
    platillo: null,
    guiso: null,
    cantidad: 1,
    extras: [],
    notas: ''
  });
  
  const [loading, setLoading] = useState(false);
  // Doble verificación para evitar doble creación
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isOrderComplete, setIsOrderComplete] = useState(true); // For order validation
  const [notas, setNotas] = useState(''); // Field for order notes
  const [showReiniciarModal, setShowReiniciarModal] = useState(false);

  const steps: OrderStep[] = [
    { step: 1, title: 'Seleccionar Mesa', completed: !!selectedMesa },
    { step: 2, title: 'Crear Suborden', completed: !!nombreSuborden },
    { step: 3, title: 'Agregar Items y Confirmar', completed: platillosSeleccionados.length > 0 || productosSeleccionados.length > 0 },
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

  // Advertencia al intentar salir con órdenes en proceso
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const hayOrdenesEnProceso = ordenesEnProceso.length > 0;
      const hayItemsSeleccionados = platillosSeleccionados.length > 0 || productosSeleccionados.length > 0;
      
      if (hayOrdenesEnProceso || hayItemsSeleccionados || nombreSuborden) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [ordenesEnProceso, platillosSeleccionados, productosSeleccionados, nombreSuborden]);

  const loadInitialData = async () => {
    try {
      const [mesasResponse, platillosResponse, guisosResponse, productosResponse, extrasResponse, tiposExtrasResponse, ordenesResponse] = await Promise.all([
        apiService.getCatalog<ApiResponse<Mesa>>('mesa'),
        apiService.getCatalog<ApiResponse<Platillo>>('platillo'),
        apiService.getCatalog<ApiResponse<Guiso>>('guiso'),
        apiService.getCatalog<ApiResponse<any>>('producto'),
        apiService.getCatalog<ApiResponse<Extra>>('extra'),
        apiService.getCatalog<ApiResponse<TipoExtra>>('tipoextra'),
        apiService.getOrdenesActivas(),
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

  // Función para determinar si es un pedido o mesa
  const esPedido = (mesa: Mesa | null): boolean => {
    if (!mesa?.nombre) return false;
    const nombreLower = mesa.nombre.trim().toLowerCase();
    return nombreLower.startsWith('pedido') || nombreLower.startsWith('nuevo pedido');
  };

  const getTipoMesaLabel = (): string => {
    return esPedido(selectedMesa) ? 'Pedido' : 'Mesa';
  };

  // Funciones para el flujo modal de platillos
  const iniciarSeleccionPlatillo = () => {
    setPlatilloEnConstruccion({
      platillo: null,
      guiso: null,
      cantidad: 1,
      extras: [],
      notas: ''
    });
    setModalPlatilloOpen(true);
  };

  const seleccionarPlatillo = (platillo: Platillo) => {
    setPlatilloEnConstruccion(prev => ({ ...prev, platillo }));
    setModalPlatilloOpen(false);
    setModalGuisoOpen(true);
  };

  const seleccionarGuiso = (guiso: Guiso) => {
    setPlatilloEnConstruccion(prev => ({ ...prev, guiso }));
    setModalGuisoOpen(false);
    setModalExtrasOpen(true);
  };

  const toggleExtraEnConstruccion = (extra: Extra) => {
    setPlatilloEnConstruccion(prev => {
      const existeIndex = prev.extras.findIndex(e => e.idExtra === extra._id);
      if (existeIndex >= 0) {
        // Si ya existe, aumentar cantidad en 1 (sin exceder la cantidad del platillo)
        const extraActual = prev.extras[existeIndex];
        if (extraActual.cantidad >= prev.cantidad) {
          // No permitir agregar más extras que la cantidad del platillo
          return prev;
        }
        return {
          ...prev,
          extras: prev.extras.map((e, i) => 
            i === existeIndex ? { ...e, cantidad: e.cantidad + 1 } : e
          )
        };
      } else {
        // Si no existe, lo agregamos con cantidad 1 y avanzamos automáticamente
        const nuevosExtras = [...prev.extras, {
          idExtra: extra._id,
          nombreExtra: extra.nombre,
          costoExtra: extra.costo,
          idTipoExtra: extra.idTipoExtra,
          cantidad: 1
        }];
        
        // Avanzar automáticamente después de agregar el primer extra
        setTimeout(() => {
          setModalExtrasOpen(false);
          setModalNotasOpen(true);
        }, 300);
        
        return {
          ...prev,
          extras: nuevosExtras
        };
      }
    });
  };

  const actualizarCantidadExtraEnConstruccion = (idExtra: string, cantidad: number) => {
    setPlatilloEnConstruccion(prev => ({
      ...prev,
      extras: prev.extras.map(e => 
        e.idExtra === idExtra 
          ? { ...e, cantidad: Math.max(1, Math.min(prev.cantidad, cantidad)) } // No exceder cantidad del platillo
          : e
      )
    }));
  };

  const saltarExtras = () => {
    setModalExtrasOpen(false);
    setModalNotasOpen(true);
  };

  const finalizarPlatillo = () => {
    if (!platilloEnConstruccion.platillo || !platilloEnConstruccion.guiso) {
      setError('Error al agregar platillo');
      return;
    }

    const nuevo: PlatilloSeleccionado = {
      platillo: platilloEnConstruccion.platillo,
      guiso: platilloEnConstruccion.guiso,
      cantidad: platilloEnConstruccion.cantidad,
      extras: [...platilloEnConstruccion.extras],
      notas: platilloEnConstruccion.notas,
    };

    setPlatillosSeleccionados(prev => [...prev, nuevo]);
    setModalNotasOpen(false);
    
    // Limpiar el estado de construcción
    setPlatilloEnConstruccion({
      platillo: null,
      guiso: null,
      cantidad: 1,
      extras: [],
      notas: ''
    });
  };

  const cancelarSeleccionPlatillo = () => {
    setModalPlatilloOpen(false);
    setModalGuisoOpen(false);
    setModalExtrasOpen(false);
    setModalNotasOpen(false);
    setPlatilloEnConstruccion({
      platillo: null,
      guiso: null,
      cantidad: 1,
      extras: [],
      notas: ''
    });
  };

  // Funciones para productos
  const seleccionarProducto = (producto: any) => {
    if (producto.cantidad < 1) {
      setError('Stock insuficiente para el producto seleccionado');
      return;
    }

    const nuevo = {
      idProducto: producto._id,
      nombreProducto: producto.nombre,
      costoProducto: producto.costo,
      cantidad: 1
    };
    setProductosSeleccionados(prev => [...prev, nuevo]);
    setModalProductoOpen(false);
    setError('');
  };



  const handleRemovePlatillo = (index: number) => {
    setPlatillosSeleccionados(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitOrder = async () => {
    if (orderSubmitting || loading) {
      // Doble verificación: si ya está en proceso, no continuar
      return;
    }
    setOrderSubmitting(true);
    if (!selectedMesa || !nombreSuborden) {
      setError('Completa todos los campos');
      setOrderSubmitting(false);
      return;
    }

    // Guardar la orden actual antes de procesarlas
    const ordenActualGuardada = guardarOrdenActual();
    if (!ordenActualGuardada) {
      setOrderSubmitting(false);
      return;
    }

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

    // Si la mesa seleccionada es "Nuevo pedido", crear una mesa temporal incremental
    let mesaParaOrden = selectedMesa;
    if (selectedMesa.nombre && (selectedMesa.nombre.trim().toLowerCase() === 'nuevo pedido' || selectedMesa.nombre.trim().toLowerCase() === 'pedidos')) {
      try {
        // Obtener el siguiente número de pedido del día desde el backend
        // El backend mantiene un contador que se reinicia automáticamente cada día a las 12 AM
        const pedidoNumberResponse = await apiService.getNextPedidoNumber();
        
        if (!pedidoNumberResponse.success || !pedidoNumberResponse.data) {
          setError('Error obteniendo número de pedido');
          setLoading(false);
          setOrderSubmitting(false);
          return;
        }
        
        const siguienteNumero = pedidoNumberResponse.data.nextNumber;
        
        // Crear mesa temporal con el número incremental del contador
        const mesaTemporal = {
          nombre: `Pedido ${siguienteNumero}`,
          temporal: true, // Marcador para identificar mesas temporales
          activo: true
        };
        
        const mesaResponse = await apiService.createCatalogItem('mesa', mesaTemporal);
        if (mesaResponse.success && mesaResponse.data) {
          // Actualizar mesaParaOrden para usar la mesa temporal
          mesaParaOrden = mesaResponse.data as Mesa;
        } else {
          setError('Error creando mesa temporal para pedido');
          setLoading(false);
          setOrderSubmitting(false);
          return;
        }
      } catch (error) {
        console.error('Error al crear mesa temporal:', error);
        setError('Error creando mesa temporal');
        setLoading(false);
        setOrderSubmitting(false);
        return;
      }
    }


    try {
      // Procesar cada orden principal en paralelo, pero los pasos internos de cada orden siguen siendo secuenciales
      await Promise.all(todasLasOrdenes.map(async (ordenData) => {
        // Determinar el estado basado en si la orden está completa y su contenido
        let estatus: string;
        const mesaEsPedido = selectedMesa && typeof selectedMesa.nombre === 'string' && selectedMesa.nombre.trim().toLowerCase().startsWith('pedido');
        if (!isOrderComplete) {
          estatus = 'Pendiente';
        } else if (ordenData.platillos.length === 0 && ordenData.productos.length > 0) {
          // Si solo tiene productos
          if (mesaEsPedido) {
            estatus = 'Entregada'; // Para pedidos solo productos, va directo a cobrar
          } else {
            estatus = 'Surtida';
          }
        } else {
          // Si tiene platillos, va a Recepcion para preparación
          estatus = 'Recepcion';
        }

        const nuevaOrdenData = {
          idMesa: mesaParaOrden?._id || selectedMesa._id,
          nombreMesa: mesaParaOrden?.nombre || selectedMesa.nombre,
          idTipoOrden: 1,
          nombreTipoOrden: 'Mesa',
          nombreCliente: ordenData.nombreCliente,
          total: ordenData.total,
          estatus,
          notas: ordenData.notas || undefined
        };

        // Doble verificación antes de crear la orden
        function normalizePlatillos(platillos: any[]) {
          return platillos.map((p) => ({
            idPlatillo: p.idPlatillo || p.platillo?._id || p.platillo,
            idGuiso: p.idGuiso || p.guiso?._id || p.guiso,
            cantidad: p.cantidad,
            notas: p.notas || '',
            extras: (p.extras || []).map((e: any) => ({
              idExtra: e.idExtra || e._id || e.extra,
              cantidad: e.cantidad,
              nombreExtra: e.nombreExtra || '',
              costoExtra: e.costoExtra || 0
            })).sort((a: any, b: any) => String(a.idExtra).localeCompare(String(b.idExtra)))
          })).sort((a, b) => String(a.idPlatillo).localeCompare(String(b.idPlatillo)));
        }
        function normalizeProductos(productos: any[]) {
          return productos.map((p) => ({
            idProducto: p.idProducto || p._id || p.producto,
            cantidad: p.cantidad,
            nombreProducto: p.nombreProducto || '',
            costoProducto: p.costoProducto || 0
          })).sort((a, b) => String(a.idProducto).localeCompare(String(b.idProducto)));
        }
        const ordenDuplicada = ordenesActivas.some((orden: any) => {
          if (String(orden.idMesa) !== String(mesaParaOrden?._id || selectedMesa._id)) return false;
          if (orden.nombreCliente !== ordenData.nombreCliente) return false;
          if (Math.abs(Number(orden.total) - Number(ordenData.total)) >= 0.01) return false;
          // Normalizar platillos y productos para comparar
          const platillosA = normalizePlatillos(orden.platillos || []);
          const platillosB = normalizePlatillos(ordenData.platillos || []);
          const productosA = normalizeProductos(orden.productos || []);
          const productosB = normalizeProductos(ordenData.productos || []);
          // Comparar arrays como JSON
          const platillosIguales = JSON.stringify(platillosA) === JSON.stringify(platillosB);
          const productosIguales = JSON.stringify(productosA) === JSON.stringify(productosB);
          const notasIguales = (orden.notas || '') === (ordenData.notas || '');
          return platillosIguales && productosIguales && notasIguales && (!orden.estatus || orden.estatus !== 'Pagada');
        });
        if (ordenDuplicada) {
          setError(`Ya existe una orden activa para el cliente \"${ordenData.nombreCliente}\" en esta mesa con los mismos platillos, productos, extras y notas. Verifica antes de continuar.`);
          setLoading(false);
          setOrderSubmitting(false);
          return;
        }

        const ordenResponse = await apiService.createOrden(nuevaOrdenData);
        const ordenDataWithId = ordenResponse.data as { _id: string } | undefined;
        if (!ordenResponse.success || !ordenDataWithId?._id) {
          setError(`Error creando orden para ${ordenData.nombreCliente}`);
          setLoading(false);
          setOrderSubmitting(false);
          return;
        }
        const ordenId = ordenDataWithId._id;

        // Crear la suborden
        const subordenData = { nombre: ordenData.nombreCliente };
        const subordenResponse = await apiService.addSuborden(ordenId, subordenData);
        if (!subordenResponse.success || !(subordenResponse.data && (subordenResponse.data as { _id?: string })._id)) {
          setError(`Error creando suborden para ${ordenData.nombreCliente}`);
          setLoading(false);
          setOrderSubmitting(false);
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
            setOrderSubmitting(false);
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
                setOrderSubmitting(false);
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
            setOrderSubmitting(false);
            return;
          }
        }

        // Ensure the order is not added to resumen if stock is insuficiente
        if (error.includes('stock insuficiente')) {
          setOrdenesEnProceso(prev => prev.filter(o => o.nombreCliente !== ordenData.nombreCliente));
          return;
        }
      }));

      const totalTodasLasOrdenes = todasLasOrdenes.reduce((sum, orden) => sum + orden.total, 0);
      setSuccess(`${todasLasOrdenes.length} orden${todasLasOrdenes.length > 1 ? 'es' : ''} creada${todasLasOrdenes.length > 1 ? 's' : ''} exitosamente. Total: $${totalTodasLasOrdenes.toFixed(2)}`);
      
      setTimeout(() => {
        setCurrentStep(1);
        setSelectedMesa(null);
        setNombreSuborden('');
        setNotas('');
        setPlatillosSeleccionados([]);
        setProductosSeleccionados([]);
        setOrdenesEnProceso([]); // Limpiar órdenes en proceso
        setPlatilloEnConstruccion({
          platillo: null,
          guiso: null,
          cantidad: 1,
          extras: [],
          notas: ''
        });
        setIsOrderComplete(true);
        setSuccess('');
        setError('');
        setOrderSubmitting(false);
        loadInitialData();
      }, 3000);

    } catch (error) {
      console.error('Error al crear las órdenes:', error);
      setError('Error creando las órdenes');
      setOrderSubmitting(false);
    } finally {
      setLoading(false);
    }
  };


  const canProceedToNext = () => {
    switch (currentStep) {
      case 1: return !!selectedMesa;
      case 2: return !!nombreSuborden;
      case 3: return platillosSeleccionados.length > 0 || productosSeleccionados.length > 0;
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

  // Función para reiniciar todo el componente
  const reiniciarComponente = () => {
    // Verificar si hay órdenes en proceso o items seleccionados
    const hayOrdenesEnProceso = ordenesEnProceso.length > 0;
    const hayItemsSeleccionados = platillosSeleccionados.length > 0 || productosSeleccionados.length > 0;
    const hayDatos = hayOrdenesEnProceso || hayItemsSeleccionados || nombreSuborden || selectedMesa;

    if (hayDatos) {
      setShowReiniciarModal(true);
      return;
    }

    ejecutarReinicio();
  };

  const ejecutarReinicio = () => {
    setCurrentStep(1);
    setSelectedMesa(null);
    setNombreSuborden('');
    setNotas('');
    setPlatillosSeleccionados([]);
    setProductosSeleccionados([]);
    setOrdenesEnProceso([]);
    setPlatilloEnConstruccion({
      platillo: null,
      guiso: null,
      cantidad: 1,
      extras: [],
      notas: ''
    });
    setIsOrderComplete(true);
    setError('');
    setSuccess('');
    setOrderSubmitting(false);
    setModalPlatilloOpen(false);
    setModalProductoOpen(false);
    setModalGuisoOpen(false);
    setModalExtrasOpen(false);
    setModalNotasOpen(false);
    setShowReiniciarModal(false);
    loadInitialData();
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

  // Overlay de carga mientras se generan las órdenes
  const loadingOverlay = loading && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-24 w-24 border-b-4 border-orange-600 mb-6"></div>
        <span className="text-white text-lg font-bold">Generando órdenes...</span>
      </div>
    </div>
  );


  return (
    <div className="max-w-4xl mx-auto px-1 sm:px-4 lg:px-6 relative">
      {loadingOverlay}
      <div className="mb-4 sm:mb-6 flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Nueva Orden</h1>
          <p className="text-sm sm:text-base text-gray-600">Crea una nueva orden paso a paso</p>
        </div>
        {currentStep === 2 && (
          <button
            onClick={reiniciarComponente}
            className="flex-shrink-0 flex items-center gap-2 px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base font-medium"
            title="Reiniciar formulario"
          >
            <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Reiniciar</span>
          </button>
        )}
      </div>

      {/* Progress Steps */}
      <div className="mb-3 sm:mb-6 px-2 sm:px-0.5">
        <div className="flex items-center justify-between overflow-x-auto pb-2">
          {steps.map((step, index) => (
            <div key={step.step} className="flex items-center min-w-0 flex-shrink-0">
              <div
                className={`flex items-center justify-center w-5 h-5 sm:w-8 sm:h-8 lg:w-10 lg:h-10 rounded-full border-2 ${
                  step.step === currentStep
                    ? 'bg-orange-600 border-orange-600 text-white'
                    : step.completed
                    ? 'bg-green-600 border-green-600 text-white'
                    : 'border-gray-300 text-gray-500'
                }`}
              >
                {step.completed && step.step !== currentStep ? (
                  <Check className="w-2.5 h-2.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                ) : (
                  <span className="text-[10px] sm:text-sm lg:text-base">{step.step}</span>
                )}
              </div>
              <span
                className={`ml-1 sm:ml-2 text-[9px] sm:text-xs lg:text-sm font-medium truncate max-w-[50px] sm:max-w-[80px] lg:max-w-none ${
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
        <div className="bg-red-50 border border-red-200 text-red-600 px-2 sm:px-4 py-2 sm:py-3 rounded-lg mb-3 sm:mb-6 text-xs sm:text-sm mx-2 sm:mx-0.5">
          <span className="block truncate">{error}</span>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 py-3 sm:p-4 lg:p-6">
        {/* Step 1: Select Table */}
        {currentStep === 1 && (
          <div className="px-2 sm:px-0">
            <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Seleccionar Mesa</h2>
            <div className="mb-3 sm:mb-4">
              <div className="flex items-center space-x-3 sm:space-x-4 text-xs sm:text-sm">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-100 border border-green-300 rounded mr-2"></div>
                  <span className="text-gray-600">Disponible</span>
                </div>
                <div className="hidden sm:flex items-center">
                  <div className="w-3 h-3 bg-orange-100 border border-orange-300 rounded mr-2"></div>
                  <span className="text-gray-600">Con órdenes activas</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
              {mesas.filter(mesa => mesa.activo !== false).map((mesa) => {
                const mesaInfo = getMesaInfo(mesa._id);
                const isSelected = selectedMesa?._id === mesa._id;
                
                // Lógica de color para la mesa 'Pedidos'
                let mesaColor = '';
                if (mesa.nombre && mesa.nombre.trim().toLowerCase() === 'pedidos') {
                  if (mesaInfo.totalOrdenes > 11) {
                    mesaColor = 'bg-red-50 border-red-200 text-red-700';
                  } else if (mesaInfo.totalOrdenes > 5) {
                    mesaColor = 'bg-orange-50 border-orange-200 text-orange-700';
                  } else {
                    mesaColor = 'bg-green-50 border-green-200 text-green-700';
                  }
                } else if (mesaInfo.isOcupada) {
                  mesaColor = 'bg-orange-50 border-orange-200 text-orange-700';
                } else {
                  mesaColor = 'bg-green-50 border-green-200 text-green-700';
                }
                
                return (
                  <button
                    key={mesa._id}
                    onClick={() => setSelectedMesa(mesa)}
                    className={`relative p-2 sm:p-3 lg:p-4 rounded-lg border-2 text-center transition-colors min-w-0 ${
                      isSelected
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : mesaColor
                    }`}
                  >
                    {mesaInfo.isOcupada && (
                      <div className="absolute top-1 right-1">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      </div>
                    )}
                    <div className="text-sm sm:text-base lg:text-lg font-semibold">{mesa.nombre}</div>
                    <div className={`text-[10px] sm:text-xs lg:text-sm ${
                      mesaInfo.isOcupada ? 'text-orange-600' : 'text-green-600'
                    }`}>
                      {mesaInfo.isOcupada 
                      ? `${mesaInfo.totalOrdenes} orden${mesaInfo.totalOrdenes !== 1 ? 'es' : ''}`
                      : (
                        <span>
                          <span className="sm:hidden">Disp</span>
                          <span className="hidden sm:inline">Disponible</span>
                        </span>
                        )
                      }
                    </div>
                  </button>
                );
              })}
            </div>
            
            {selectedMesa && (
              <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-medium text-blue-900 mb-2 text-sm sm:text-base">{getTipoMesaLabel()} seleccionado: {selectedMesa.nombre}</h3>
                {(() => {
                  const mesaInfo = getMesaInfo(selectedMesa._id);
                  // Avanzar automáticamente al paso 2
                  setTimeout(() => setCurrentStep(2), 300);
                  
                  return mesaInfo.isOcupada ? (
                    <div className="space-y-2">
                      <p className="text-xs sm:text-sm text-blue-800">
                        Este {getTipoMesaLabel().toLowerCase()} tiene {mesaInfo.totalOrdenes} orden{mesaInfo.totalOrdenes !== 1 ? 'es' : ''} activa{mesaInfo.totalOrdenes !== 1 ? 's' : ''}:
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
                        Puedes agregar una nueva orden a este {getTipoMesaLabel().toLowerCase()}.
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs sm:text-sm text-blue-800">{getTipoMesaLabel()} disponible - No hay órdenes activas.</p>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Create Suborden */}
        {currentStep === 2 && (
          <div className="px-2 sm:px-0">
            <h2 className="text-sm sm:text-lg lg:text-xl font-semibold text-gray-900 mb-2 sm:mb-4">Crear Suborden</h2>
            <div className="mb-2 sm:mb-4">
              <p className="text-xs sm:text-base text-gray-600">
                {!esPedido(selectedMesa) && `${getTipoMesaLabel()} seleccionado:`}
                {' '}<span className="font-medium">{selectedMesa?.nombre}</span>
              </p>
            </div>
            <div>
              <label htmlFor="nombreSuborden" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Nombre del cliente
              </label>
              <input
                id="nombreSuborden"
                type="text"
                value={nombreSuborden}
                onChange={(e) => setNombreSuborden(e.target.value)}
                className="w-full px-2 sm:px-4 py-1.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-xs sm:text-base"
                placeholder="Nombre del cliente"
              />
            </div>
          </div>
        )}

        {/* Step 3: Add Dishes */}
        {currentStep === 3 && (
          <div className="px-2 sm:px-0">
            <h2 className="text-sm sm:text-lg lg:text-xl font-semibold text-gray-900 mb-2 sm:mb-4">Agregar Platillos y Productos</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
              {/* Botones de acción */}
              <div className="space-y-2 sm:space-y-4">
                <button
                  onClick={iniciarSeleccionPlatillo}
                  className="w-full bg-orange-600 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium hover:bg-orange-700 transition-colors text-xs sm:text-lg flex items-center justify-center"
                  style={{ height: 'auto' }}
                >
                  <Plus className="w-4 h-4 sm:w-6 sm:h-6 mr-1 sm:mr-2" />
                  Agregar Platillo
                </button>

                <button
                  onClick={() => setModalProductoOpen(true)}
                  className="w-full bg-green-600 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium hover:bg-green-700 transition-colors text-xs sm:text-lg flex items-center justify-center"
                  style={{ height: 'auto' }}
                >
                  <Plus className="w-4 h-4 sm:w-6 sm:h-6 mr-1 sm:mr-2" />
                  Agregar Producto
                </button>
              </div>

              {/* Selected Items List */}
              <div>
                <h3 className="text-xs sm:text-base lg:text-lg font-medium text-gray-900 mb-2 sm:mb-4">
                  Platillos Seleccionados ({platillosSeleccionados.length})
                </h3>
                <div className="space-y-1.5 sm:space-y-3 max-h-80 sm:max-h-96 overflow-y-auto">
                  {platillosSeleccionados.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start justify-between p-2 sm:p-4 bg-gray-50 rounded-lg gap-2 sm:gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs sm:text-base font-medium text-gray-900">{item.platillo.nombre}</h4>
                        <p className="text-[10px] sm:text-sm text-gray-600">
                          {item.guiso.nombre} • Cantidad: {item.cantidad}
                        </p>
                        {item.extras.length > 0 && (
                          <div className="mt-0.5 sm:mt-1">
                            <p className="text-[9px] sm:text-xs text-purple-600 font-medium">Extras:</p>
                            {item.extras.map((extra, extraIndex) => (
                              <p key={extraIndex} className="text-[9px] sm:text-xs text-purple-500">
                                • {extra.nombreExtra} (x{extra.cantidad}) - ${(extra.costoExtra * extra.cantidad).toFixed(2)}
                              </p>
                            ))}
                          </div>
                        )}
                        {item.notas && (
                          <div className="mt-0.5 sm:mt-1">
                            <p className="text-[9px] sm:text-xs text-blue-600 font-medium">Notas:</p>
                            <p className="text-[9px] sm:text-xs text-blue-500 italic">
                              "{item.notas}"
                            </p>
                          </div>
                        )}
                        <div className="text-[10px] sm:text-sm font-medium text-green-600">
                          {item.extras.length > 0 ? (
                            <div>
                              <div className="text-[9px] sm:text-xs text-gray-500">
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
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (item.cantidad > 1) {
                              setPlatillosSeleccionados(prev => prev.map((p, i) => {
                                if (i === index) {
                                  const nuevaCantidad = p.cantidad - 1;
                                  // Ajustar extras si alguno tiene la misma cantidad que el platillo
                                  const extrasAjustados = p.extras.map(extra => {
                                    if (extra.cantidad === p.cantidad) {
                                      return { ...extra, cantidad: Math.max(1, extra.cantidad - 1) };
                                    }
                                    return { ...extra, cantidad: Math.min(extra.cantidad, nuevaCantidad) };
                                  });
                                  return { ...p, cantidad: nuevaCantidad, extras: extrasAjustados };
                                }
                                return p;
                              }));
                            } else {
                              handleRemovePlatillo(index);
                            }
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title={item.cantidad > 1 ? "Reducir cantidad" : "Eliminar platillo"}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      </div>
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
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setProductosSeleccionados(prev => prev.map((p, i) => 
                              i === index ? { ...p, cantidad: p.cantidad + 1 } : p
                            ));
                          }}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Aumentar cantidad"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (item.cantidad > 1) {
                              setProductosSeleccionados(prev => prev.map((p, i) => 
                                i === index ? { ...p, cantidad: p.cantidad - 1 } : p
                              ));
                            } else {
                              setProductosSeleccionados(prev => prev.filter((_, i) => i !== index));
                            }
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title={item.cantidad > 1 ? "Reducir cantidad" : "Eliminar producto"}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                      </div>
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

            {/* Order Validation and Confirmation Section */}
            {(platillosSeleccionados.length > 0 || productosSeleccionados.length > 0) && (
              <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-6 px-2 sm:px-0">
                {/* Order Validation Section */}
                <div className="space-y-2 sm:space-y-3">
                  <div className={`p-2 sm:p-3 rounded-md ${isOrderComplete ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                    <p className="text-xs sm:text-sm break-words">
                      {isOrderComplete 
                        ? (platillosSeleccionados.length === 0 && productosSeleccionados.length > 0
                            ? '✓ La orden solo contiene productos y será enviada directamente a despacho (Estado: Surtida)'
                            : '✓ La orden será enviada directamente a preparación (Estado: Recepción)'
                          )
                        : '⚠ La orden será marcada como pendiente para revisión (Estado: Pendiente)'
                      }
                    </p>
                  </div>
                </div>

                {/* Notes field */}
                <div className="bg-gray-50 p-2 sm:p-4 lg:p-6 rounded-lg border border-gray-200">
                  <h3 className="font-medium text-gray-900 mb-2 sm:mb-4 text-xs sm:text-base">Notas de la Orden</h3>
                  <div>
                    <label htmlFor="notas" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                      Comentarios generales (opcional)
                    </label>
                    <textarea
                      id="notas"
                      value={notas}
                      onChange={(e) => setNotas(e.target.value)}
                      maxLength={500}
                      rows={3}
                      className="w-full px-2 sm:px-4 py-1.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none text-xs sm:text-base"
                      placeholder="Comentarios especiales, instrucciones de cocina, alergias, etc."
                    />
                    <p className="text-[10px] sm:text-sm text-gray-500 mt-0.5 sm:mt-1">{notas.length}/500 caracteres</p>
                  </div>
                </div>

                {/* Resumen */}
                <div className="bg-gray-50 p-2 sm:p-6 rounded-lg">
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
                        <span className="text-gray-600 flex-shrink-0">{getTipoMesaLabel()}:</span>
                        <span className="sm:ml-2 font-medium">{selectedMesa?.nombre}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center min-w-0">
                        <span className="text-gray-600 flex-shrink-0">Cliente:</span>
                        <span className="sm:ml-2 font-medium">{nombreSuborden}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center min-w-0">
                        <span className="text-gray-600 flex-shrink-0">Platillos:</span>
                        <span className="sm:ml-2 font-medium">{platillosSeleccionados.length} tipo(s)</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center min-w-0">
                        <span className="text-gray-600 flex-shrink-0">Productos:</span>
                        <span className="sm:ml-2 font-medium">{productosSeleccionados.length} tipo(s)</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center min-w-0">
                        <span className="text-gray-600 flex-shrink-0">Total orden:</span>
                        <span className="sm:ml-2 font-medium text-orange-600">${getTotalOrden().toFixed(2)}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center min-w-0">
                        <span className="text-gray-600 flex-shrink-0">Estado:</span>
                        <span className={`sm:ml-2 font-medium ${
                          !isOrderComplete 
                            ? 'text-orange-600' 
                            : (platillosSeleccionados.length === 0 && productosSeleccionados.length > 0)
                              ? 'text-green-600'
                              : 'text-blue-600'
                        }`}>
                          {!isOrderComplete 
                            ? 'Pendiente' 
                            : (platillosSeleccionados.length === 0 && productosSeleccionados.length > 0)
                              ? 'Surtida'
                              : 'Recepción'
                          }
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
                  {ordenesEnProceso.length > 0 && (
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
                  )}
                </div>

                {/* Confirmation Buttons */}
                <div className="space-y-3">
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
                      {loading
                        ? 'Creando Orden...'
                        : ordenesEnProceso.length > 0
                          ? 'Confirmar y Crear Ordenes'
                          : 'Confirmar y Crear Orden'}
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
                        setPlatilloEnConstruccion({
                          platillo: null,
                          guiso: null,
                          cantidad: 1,
                          extras: [],
                          notas: ''
                        });
                        setIsOrderComplete(true);
                        setError('');
                        setSuccess('');
                      }
                    }}
                    disabled={loading || !nombreSuborden || (platillosSeleccionados.length === 0 && productosSeleccionados.length === 0)}
                    className="w-full bg-orange-600 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center text-sm sm:text-base"
                  >
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    <span className="truncate">Agregar Orden de otro cliente</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}



        {/* Navigation Buttons */}
        <div className={`flex mt-4 sm:mt-8 pt-3 sm:pt-6 border-t border-gray-200 px-2 sm:px-0 ${currentStep === 3 ? 'justify-start' : 'justify-end'}`}>
          {/* Botón Anterior: solo se muestra en paso 3 */}
          {currentStep === 3 && (
            <button
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              className="flex items-center px-2 sm:px-4 py-1.5 sm:py-2 text-gray-600 hover:text-gray-900 text-xs sm:text-base"
            >
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="block sm:hidden">Ant</span>
              <span className="hidden sm:block">Anterior</span>
            </button>
          )}

          {/* Botón Siguiente: solo en paso 2 */}
          {currentStep === 2 && (
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!canProceedToNext()}
              className="flex items-center px-3 sm:px-6 py-1.5 sm:py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-base"
            >
              <span className="block sm:hidden">Sig</span>
              <span className="hidden sm:block">Siguiente</span>
              <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
            </button>
          )}
        </div>
      </div>

      {/* Modal: Selección de Platillo */}
      {modalPlatilloOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-1 sm:p-2">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-2 sm:p-6">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <h2 className="text-sm sm:text-xl font-bold text-gray-900">Seleccionar Platillo</h2>
              <button
                onClick={cancelarSeleccionPlatillo}
                className="text-gray-400 hover:text-gray-600 text-xl sm:text-2xl"
              >
                ×
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5 sm:gap-3">
              {platillos.filter(p => p.activo).map((platillo) => (
                <button
                  key={platillo._id}
                  onClick={() => seleccionarPlatillo(platillo)}
                  className="p-3 sm:p-4 rounded-lg border-2 border-gray-200 hover:border-orange-500 hover:bg-orange-50 transition-colors text-center"
                >
                  <div className="text-sm sm:text-base font-semibold text-gray-900">{platillo.nombre}</div>
                  <div className="text-xs sm:text-sm text-green-600 font-medium mt-1">${platillo.costo}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Selección de Guiso */}
      {modalGuisoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-1 sm:p-2">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-2 sm:p-6">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <h2 className="text-sm sm:text-xl font-bold text-gray-900">
                Seleccionar Guiso para {platilloEnConstruccion.platillo?.nombre}
              </h2>
              <button
                onClick={cancelarSeleccionPlatillo}
                className="text-gray-400 hover:text-gray-600 text-xl sm:text-2xl"
              >
                ×
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5 sm:gap-3">
              {guisos.filter(g => g.activo).map((guiso) => (
                <button
                  key={guiso._id}
                  onClick={() => seleccionarGuiso(guiso)}
                  className="p-3 sm:p-4 rounded-lg border-2 border-gray-200 hover:border-orange-500 hover:bg-orange-50 transition-colors text-center"
                >
                  <div className="text-sm sm:text-base font-semibold text-gray-900">{guiso.nombre}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Selección de Extras */}
      {modalExtrasOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-1 sm:p-2">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-2 sm:p-6">
            <div className="flex items-center justify-between mb-2 sm:mb-4">
              <h2 className="text-sm sm:text-xl font-bold text-gray-900">Seleccionar Extras (Opcional)</h2>
              <button
                onClick={cancelarSeleccionPlatillo}
                className="text-gray-400 hover:text-gray-600 text-xl sm:text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-2 sm:space-y-4">
              {tiposExtras.map(tipo => {
                const extrasDelTipo = extras.filter(e => e.idTipoExtra === tipo._id && e.activo);
                if (extrasDelTipo.length === 0) return null;
                
                return (
                  <div key={tipo._id} className="border-b pb-4 last:border-b-0">
                    <h3 className="font-semibold text-purple-700 mb-3 text-sm sm:text-base">{tipo.nombre}</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                      {extrasDelTipo.map(extra => {
                        const extraSeleccionado = platilloEnConstruccion.extras.find(e => e.idExtra === extra._id);
                        
                        return (
                          <div key={extra._id} className="relative">
                            <button
                              onClick={() => toggleExtraEnConstruccion(extra)}
                              className={`w-full p-3 rounded-lg border-2 transition-colors text-left ${
                                extraSeleccionado
                                  ? 'border-purple-500 bg-purple-50'
                                  : 'border-gray-200 hover:border-purple-300 hover:bg-purple-25'
                              }`}
                            >
                              <div className="text-sm font-semibold text-gray-900">{extra.nombre}</div>
                              <div className="text-xs text-purple-600 font-medium mt-1">+${extra.costo}</div>
                            </button>
                            
                            {extraSeleccionado && extra._id && (
                              <div className="mt-2 flex items-center justify-center gap-2 bg-purple-100 rounded-lg p-2">
                                <button
                                  onClick={() => actualizarCantidadExtraEnConstruccion(extra._id!, extraSeleccionado.cantidad - 1)}
                                  className="p-1 bg-white rounded hover:bg-gray-100"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-sm font-medium min-w-[20px] text-center">{extraSeleccionado.cantidad}</span>
                                <button
                                  onClick={() => actualizarCantidadExtraEnConstruccion(extra._id!, extraSeleccionado.cantidad + 1)}
                                  className="p-1 bg-white rounded hover:bg-gray-100"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex justify-between items-center">
              <button
                onClick={() => {
                  setModalExtrasOpen(false);
                  setModalGuisoOpen(true);
                }}
                className="bg-gray-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors text-sm sm:text-base"
              >
                Volver a Guisos
              </button>
              <button
                onClick={saltarExtras}
                className="bg-orange-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium hover:bg-orange-700 transition-colors text-sm sm:text-base"
              >
                Sin Extras
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Notas del Platillo */}
      {modalNotasOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-2 sm:p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm sm:text-base font-bold text-gray-900">Cantidad y Notas</h2>
              <button
                onClick={cancelarSeleccionPlatillo}
                className="text-gray-400 hover:text-gray-600 text-xl sm:text-2xl"
              >
                ×
              </button>
            </div>

            {/* Selector de cantidad */}
            <div className="mb-2">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Cantidad</label>
              <div className="flex items-center justify-center space-x-2 sm:space-x-3">
                <button
                  onClick={() => setPlatilloEnConstruccion(prev => {
                    const nuevaCantidad = Math.max(1, prev.cantidad - 1);
                    // Ajustar cantidades de extras si exceden el nuevo límite
                    return {
                      ...prev,
                      cantidad: nuevaCantidad,
                      extras: prev.extras.map(e => ({
                        ...e,
                        cantidad: Math.min(e.cantidad, nuevaCantidad)
                      }))
                    };
                  })}
                  className="p-1 sm:p-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Minus className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <span className="text-lg sm:text-xl font-semibold w-12 sm:w-14 text-center">{platilloEnConstruccion.cantidad}</span>
                <button
                  onClick={() => setPlatilloEnConstruccion(prev => ({ ...prev, cantidad: prev.cantidad + 1 }))}
                  className="p-1 sm:p-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>

            {/* Notas */}
            <div className="mb-2">
              <label className="block text-[10px] sm:text-xs font-medium text-gray-700 mb-1">
                Notas (opcional)
              </label>
              <textarea
                value={platilloEnConstruccion.notas}
                onChange={(e) => setPlatilloEnConstruccion(prev => ({ ...prev, notas: e.target.value }))}
                maxLength={200}
                rows={1}
                className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none text-[10px] sm:text-xs"
                placeholder="Ej: Sin cebolla, extra salsa"
              />
              <p className="text-[9px] sm:text-[10px] text-gray-500 mt-0.5">{platilloEnConstruccion.notas.length}/200</p>
            </div>

            {/* Extras con controles de cantidad */}
            {platilloEnConstruccion.extras.length > 0 && (
              <div className="mb-2 max-h-32 sm:max-h-40 overflow-y-auto">
                <div className="space-y-0.5 sm:space-y-1">
                  {platilloEnConstruccion.extras.map((extra, index) => {
                    const alcanzoLimite = extra.cantidad >= platilloEnConstruccion.cantidad;
                    return (
                      <div key={index} className="flex items-center justify-between p-1 sm:p-1.5 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="flex-1 min-w-0 mr-1 sm:mr-2">
                          <p className="text-[10px] sm:text-xs font-medium text-gray-900 truncate">{extra.nombreExtra}</p>
                          <p className="text-[9px] sm:text-[10px] text-purple-600">+${extra.costoExtra} c/u</p>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                          <div className="flex items-center gap-0.5 sm:gap-1 bg-white rounded-lg p-0.5 border border-purple-300">
                            <button
                              onClick={() => {
                                if (extra.cantidad === 1) {
                                  // Si es el último, eliminar el extra
                                  setPlatilloEnConstruccion(prev => ({
                                    ...prev,
                                    extras: prev.extras.filter((_, i) => i !== index)
                                  }));
                                } else {
                                  actualizarCantidadExtraEnConstruccion(extra.idExtra, extra.cantidad - 1);
                                }
                              }}
                              className="p-0.5 hover:bg-purple-100 rounded transition-colors"
                            >
                              <Minus className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-purple-600" />
                            </button>
                            <span className="text-[10px] sm:text-xs font-semibold w-4 sm:w-5 text-center">{extra.cantidad}</span>
                            <button
                              onClick={() => actualizarCantidadExtraEnConstruccion(extra.idExtra, extra.cantidad + 1)}
                              disabled={alcanzoLimite}
                              className={`p-0.5 rounded transition-colors ${
                                alcanzoLimite 
                                  ? 'opacity-50 cursor-not-allowed bg-gray-100' 
                                  : 'hover:bg-purple-100'
                              }`}
                            >
                              <Plus className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${alcanzoLimite ? 'text-gray-400' : 'text-purple-600'}`} />
                            </button>
                          </div>
                          <span className="text-[10px] sm:text-xs font-medium text-purple-700 min-w-[40px] sm:min-w-[50px] text-right">
                            ${(extra.costoExtra * extra.cantidad).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Resumen */}
            <div className="mb-2 p-1.5 sm:p-2 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-1 text-[10px] sm:text-xs">Resumen:</h3>
              <div className="text-[10px] sm:text-xs text-gray-600 space-y-0.5">
                <p><span className="font-medium">Platillo:</span> {platilloEnConstruccion.platillo?.nombre}</p>
                <p><span className="font-medium">Guiso:</span> {platilloEnConstruccion.guiso?.nombre}</p>
                <p><span className="font-medium">Cantidad:</span> {platilloEnConstruccion.cantidad}</p>
                {platilloEnConstruccion.extras.length > 0 && (() => {
                  const totalExtras = platilloEnConstruccion.extras.reduce((sum, e) => sum + e.cantidad, 0);
                  return (
                    <p className="font-medium text-purple-600">
                      {totalExtras} extra{totalExtras > 1 ? 's' : ''} agregado{totalExtras > 1 ? 's' : ''}
                    </p>
                  );
                })()}
                {platilloEnConstruccion.notas && (
                  <p className="text-[9px] sm:text-[10px] text-blue-600 italic">Notas: {platilloEnConstruccion.notas}</p>
                )}
              </div>
              <div className="mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-gray-200">
                <p className="text-xs sm:text-sm font-semibold text-green-600">
                  Total: ${(
                    (platilloEnConstruccion.platillo?.costo ?? 0) * platilloEnConstruccion.cantidad +
                    platilloEnConstruccion.extras.reduce((sum, e) => sum + (e.costoExtra * e.cantidad), 0)
                  ).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={cancelarSeleccionPlatillo}
                className="flex-1 bg-gray-200 text-gray-700 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors text-xs sm:text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={finalizarPlatillo}
                className="flex-1 bg-green-600 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg font-medium hover:bg-green-700 transition-colors text-xs sm:text-sm"
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Selección de Producto */}
      {modalProductoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-1 sm:p-2">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-2 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Seleccionar Producto</h2>
              <button
                onClick={() => setModalProductoOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
              {productos.filter(p => p.activo).map((producto) => (
                <button
                  key={producto._id}
                  onClick={() => seleccionarProducto(producto)}
                  disabled={producto.cantidad < 1}
                  className={`p-3 sm:p-4 rounded-lg border-2 transition-colors text-center ${
                    producto.cantidad < 1
                      ? 'border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed'
                      : 'border-gray-200 hover:border-green-500 hover:bg-green-50'
                  }`}
                >
                  <div className="text-sm sm:text-base font-semibold text-gray-900">{producto.nombre}</div>
                  <div className="text-xs sm:text-sm text-green-600 font-medium mt-1">${producto.costo}</div>
                  <div className={`text-[10px] sm:text-xs mt-1 ${producto.cantidad < 1 ? 'text-red-600' : 'text-gray-500'}`}>
                    {producto.cantidad < 1 ? 'Sin stock' : `Stock: ${producto.cantidad}`}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmación de Reinicio */}
      {showReiniciarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
              <RotateCcw className="w-8 h-8 text-red-600" />
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 text-center mb-3">
              ¿Reiniciar Formulario?
            </h3>
            
            <div className="mb-6">
              {ordenesEnProceso.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 text-center">
                    Tienes <span className="font-semibold text-red-600">{ordenesEnProceso.length} orden{ordenesEnProceso.length > 1 ? 'es' : ''}</span> en proceso de creación.
                  </p>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-800 font-medium text-center">
                      ⚠️ Si reinicias, se perderán todos las ordenes que tengas en fila en creación.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800 text-center">
                    Si tienes ordenes en fila sin confirmación, perderán esas ordenes.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowReiniciarModal(false)}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={ejecutarReinicio}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Sí, Reiniciar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NuevaOrden;