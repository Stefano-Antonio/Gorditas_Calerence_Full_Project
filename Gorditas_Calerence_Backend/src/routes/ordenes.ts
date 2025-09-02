import { Router } from 'express';
import { 
  Orden, 
  Suborden, 
  OrdenDetalleProducto, 
  OrdenDetallePlatillo,
  Producto 
} from '../models';
import { authenticate, isMesero, isDespachador, isCocinero } from '../middleware/auth';
import { 
  validate, 
  createOrdenSchema, 
  addProductToOrdenSchema,
  addPlatilloToSubordenSchema 
} from '../middleware/validation';
import { asyncHandler, createResponse, calculateImporte } from '../utils/helpers';
import { generateFolio } from '../utils/counters';
import { OrdenStatus } from '../types';

const router = Router();

// GET /api/ordenes - Listar órdenes
router.get('/', authenticate, asyncHandler(async (req: any, res: any) => {
  const { estatus, mesa, fecha, page = 1, limit = 10 } = req.query;
  
  const filter: any = {};
  if (estatus) filter.estatus = estatus;
  if (mesa) filter.idMesa = mesa;
  if (fecha) {
    const startDate = new Date(fecha);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);
    filter.fechaHora = { $gte: startDate, $lt: endDate };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const [ordenes, total] = await Promise.all([
    Orden.find(filter)
      .sort({ fechaHora: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Orden.countDocuments(filter)
  ]);

  res.json(createResponse(true, {
    ordenes,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  }));
}));

// GET /api/ordenes/:id - Obtener detalles de una orden específica
router.get('/:id', authenticate, asyncHandler(async (req: any, res: any) => {
  const orden = await Orden.findById(req.params.id);
  if (!orden) {
    return res.status(404).json(createResponse(false, null, 'Orden no encontrada'));
  }

  // Obtener subórdenes de la orden
  const subordenes = await Suborden.find({ idOrden: req.params.id });
  
  // Obtener productos de la orden
  const productos = await OrdenDetalleProducto.find({ idOrden: req.params.id });
  
  // Obtener platillos de las subórdenes
  const subordenIds = subordenes.map(sub => sub._id);
  const platillos = await OrdenDetallePlatillo.find({ 
    idSuborden: { $in: subordenIds } 
  });

  const ordenConDetalles = {
    ...orden.toObject(),
    subordenes,
    productos,
    platillos
  };

  res.json(createResponse(true, ordenConDetalles));
}));

// POST /api/ordenes/nueva - Crear nueva orden
router.post('/nueva', authenticate, validate(createOrdenSchema), 
  asyncHandler(async (req: any, res: any) => {
    console.log('Datos recibidos para crear orden:', req.body); // Log para depuración

    const folio = await generateFolio();
    
    const orden = new Orden({
      folio,
      ...req.body,
      estatus: req.body.estatus || OrdenStatus.RECEPCION
    });

    await orden.save();
    console.log('Orden creada:', orden); // Log para verificar el _id generado
    res.status(201).json(createResponse(true, orden, 'Orden creada exitosamente'));
  })
);

// POST /api/ordenes/:id/suborden - Agregar suborden
router.post('/:id/suborden', authenticate, 
  asyncHandler(async (req: any, res: any) => {
    const { nombre } = req.body;
    
    const orden = await Orden.findById(req.params.id);
    if (!orden) {
      return res.status(404).json(createResponse(false, null, 'Orden no encontrada'));
    }

    if (orden.estatus !== OrdenStatus.RECEPCION) {
      return res.status(400).json(createResponse(false, null, 'Solo se pueden modificar órdenes en recepción'));
    }

    const suborden = new Suborden({
      idOrden: orden._id,
      nombre
    });

    await suborden.save();
    res.status(201).json(createResponse(true, suborden, 'Suborden creada exitosamente'));
  })
);

// POST /api/ordenes/suborden/:id/platillo - Agregar platillo
router.post('/suborden/:id/platillo', authenticate, 
  validate(addPlatilloToSubordenSchema),
  asyncHandler(async (req: any, res: any) => {
    console.log('Datos recibidos para agregar platillo:', req.body); // Log para depuración

    // Log para ver qué envía el frontend
    console.log('Formulario recibido del frontend:', req.body);

    // Log para ver los valores de idPlatillo e idGuiso antes de crear el documento
    console.log('Valores para OrdenDetallePlatillo:', {
      idPlatillo: req.body.idPlatillo,
      idGuiso: req.body.idGuiso
    });

    const suborden = await Suborden.findById(req.params.id);
    if (!suborden) {
      return res.status(404).json(createResponse(false, null, 'Suborden no encontrada'));
    }

    const orden = await Orden.findById(suborden.idOrden);
    if (orden?.estatus !== OrdenStatus.RECEPCION) {
      return res.status(400).json(createResponse(false, null, 'Solo se pueden modificar órdenes en recepción'));
    }

    const { costoPlatillo, cantidad } = req.body;
    const importe = calculateImporte(costoPlatillo, cantidad);

    console.log('Importe calculado:', importe); // Log para verificar el importe calculado
    console.log('Datos para OrdenDetallePlatillo:', {
      idSuborden: suborden._id,
      ...req.body,
      importe
    });

    const detallePlatillo = new OrdenDetallePlatillo({
      ...req.body,
      idSuborden: suborden._id,
      importe
    });

    console.log('Antes de intentar guardar OrdenDetallePlatillo');
    try {
      await detallePlatillo.save();
      console.log('Guardado exitoso de OrdenDetallePlatillo');
    } catch (error: any) {
      console.error('Error real al guardar OrdenDetallePlatillo:', error);
      return res.status(400).json({
        message: 'Error al guardar platillo',
        error: error?.message || error
      });
    }

    // Actualizar total de la orden
    await updateOrdenTotal(suborden.idOrden);

    res.status(201).json(createResponse(true, detallePlatillo, 'Platillo agregado exitosamente'));
  })
);

// POST /api/ordenes/:id/producto - Agregar producto
router.post('/:id/producto', authenticate, isMesero, 
  validate(addProductToOrdenSchema),
  asyncHandler(async (req: any, res: any) => {
    const orden = await Orden.findById(req.params.id);
    if (!orden) {
      return res.status(404).json(createResponse(false, null, 'Orden no encontrada'));
    }

    if (orden.estatus !== OrdenStatus.RECEPCION) {
      return res.status(400).json(createResponse(false, null, 'Solo se pueden modificar órdenes en recepción'));
    }

    const { idProducto, costoProducto, cantidad } = req.body;
    
    // Verificar inventario
    const producto = await Producto.findById(idProducto);
    if (!producto || producto.cantidad < cantidad) {
      return res.status(400).json(createResponse(false, null, 'Producto no disponible o stock insuficiente'));
    }

    const importe = calculateImporte(costoProducto, cantidad);

    const detalleProducto = new OrdenDetalleProducto({
      idOrden: req.params.id,
      ...req.body,
      importe
    });

    await detalleProducto.save();

    // Actualizar inventario
    await Producto.findByIdAndUpdate(idProducto, {
      $inc: { cantidad: -cantidad }
    });

    // Actualizar total de la orden
    await updateOrdenTotal(req.params.id);

    res.status(201).json(createResponse(true, detalleProducto, 'Producto agregado exitosamente'));
  })
);

// PUT /api/ordenes/:id/estatus - Cambiar estatus
router.put('/:id/estatus', authenticate,
  asyncHandler(async (req: any, res: any) => {
    const { estatus } = req.body;
    const userRole = req.user.nombreTipoUsuario;
    
    if (!Object.values(OrdenStatus).includes(estatus)) {
      return res.status(400).json(createResponse(false, null, 'Estatus no válido'));
    }

    const orden = await Orden.findById(req.params.id);
    if (!orden) {
      return res.status(404).json(createResponse(false, null, 'Orden no encontrada'));
    }

    // Validate status transition based on user role
    const currentStatus = orden.estatus;
    const isValidTransition = validateStatusTransition(currentStatus, estatus, userRole);
    
    if (!isValidTransition) {
      return res.status(403).json(createResponse(false, null, 'Transición de estatus no permitida para su rol'));
    }

    // Update the order status
    orden.estatus = estatus;
    // Si la orden se marca como Pagada, guardar la fecha de pago
    if (estatus === 'Pagada') {
      orden.fechaPago = new Date();
    }
    await orden.save();

    res.json(createResponse(true, orden, 'Estatus actualizado exitosamente'));
  })
);

// PUT /api/ordenes/:id/verificar - Verificar completitud de orden
router.put('/:id/verificar', authenticate, isMesero,
  asyncHandler(async (req: any, res: any) => {
    const { isComplete } = req.body;
    
    const orden = await Orden.findById(req.params.id);
    if (!orden) {
      return res.status(404).json(createResponse(false, null, 'Orden no encontrada'));
    }

    // Only allow verification for pending orders
    if (orden.estatus !== OrdenStatus.PENDIENTE) {
      return res.status(400).json(createResponse(false, null, 'Solo se pueden verificar órdenes pendientes'));
    }

    // Update status based on verification
    const newStatus = isComplete ? OrdenStatus.RECEPCION : OrdenStatus.PENDIENTE;
    orden.estatus = newStatus;
    await orden.save();

    const message = isComplete 
      ? 'Orden verificada y enviada a preparación' 
      : 'Orden marcada como pendiente para revisión';

    res.json(createResponse(true, orden, message));
  })
);

// Helper function to validate status transitions based on user role
function validateStatusTransition(currentStatus: string, newStatus: string, userRole: string): boolean {
  // Admin can change any status
  if (userRole === 'Admin') return true;

  const validTransitions: { [key: string]: { [key: string]: string[] } } = {
    'Mesero': {
      'Pendiente': ['Recepcion'],
      'Entregada': ['Pagada'],
      'Surtida': ['Pagada'] // Permitir cobrar desde Surtida
    },
    'Despachador': {
      'Recepcion': ['Preparacion'],
      'Preparacion': ['Surtida'],
      'Surtida': ['Entregada']
    },
    'Encargado': {
      'Entregada': ['Pagada'],
      'Surtida': ['Pagada'] // Permitir cobrar desde Surtida
    },
    'Cocinero': {
      'Recepcion': ['Preparacion'],
      'Preparacion': ['Surtida']
    }
  };

  const roleTransitions = validTransitions[userRole];
  if (!roleTransitions) return false;

  const allowedNewStatuses = roleTransitions[currentStatus];
  return allowedNewStatuses ? allowedNewStatuses.includes(newStatus) : false;
}

// Helper function to update orden total
async function updateOrdenTotal(ordenId: string) {
  const [productosTotal, platillosTotal] = await Promise.all([
    OrdenDetalleProducto.aggregate([
      { $match: { idOrden: ordenId } },
      { $group: { _id: null, total: { $sum: '$importe' } } }
    ]),
    OrdenDetallePlatillo.aggregate([
      { $lookup: { from: 'subordenes', localField: 'idSuborden', foreignField: '_id', as: 'suborden' } },
      { $match: { 'suborden.idOrden': ordenId } },
      { $group: { _id: null, total: { $sum: '$importe' } } }
    ])
  ]);

  const total = (productosTotal[0]?.total || 0) + (platillosTotal[0]?.total || 0);
  
  await Orden.findByIdAndUpdate(ordenId, { total });
}

// PUT /api/ordenes/producto/:id/listo - Marcar producto como listo
router.put('/producto/:id/listo', authenticate, 
  asyncHandler(async (req: any, res: any) => {
    const producto = await OrdenDetalleProducto.findById(req.params.id);
    if (!producto) {
      return res.status(404).json(createResponse(false, null, 'Producto no encontrado'));
    }

    // Agregar campo 'listo' al schema si no existe
    await OrdenDetalleProducto.findByIdAndUpdate(req.params.id, { listo: true });
    
    res.json(createResponse(true, null, 'Producto marcado como listo'));
  })
);

// PUT /api/ordenes/platillo/:id/listo - Marcar platillo como listo  
router.put('/platillo/:id/listo', authenticate,
  asyncHandler(async (req: any, res: any) => {
    const platillo = await OrdenDetallePlatillo.findById(req.params.id);
    if (!platillo) {
      return res.status(404).json(createResponse(false, null, 'Platillo no encontrado'));
    }

    // Agregar campo 'listo' al schema si no existe
    await OrdenDetallePlatillo.findByIdAndUpdate(req.params.id, { listo: true });
    
    res.json(createResponse(true, null, 'Platillo marcado como listo'));
  })
);

// PUT /api/ordenes/producto/:id/entregado - Marcar producto como entregado
router.put('/producto/:id/entregado', authenticate,
  asyncHandler(async (req: any, res: any) => {
    const producto = await OrdenDetalleProducto.findById(req.params.id);
    if (!producto) {
      return res.status(404).json(createResponse(false, null, 'Producto no encontrado'));
    }

    await OrdenDetalleProducto.findByIdAndUpdate(req.params.id, { entregado: true });
    
    res.json(createResponse(true, null, 'Producto marcado como entregado'));
  })
);

// PUT /api/ordenes/platillo/:id/entregado - Marcar platillo como entregado
router.put('/platillo/:id/entregado', authenticate,
  asyncHandler(async (req: any, res: any) => {
    const platillo = await OrdenDetallePlatillo.findById(req.params.id);
    if (!platillo) {
      return res.status(404).json(createResponse(false, null, 'Platillo no encontrado'));
    }

    await OrdenDetallePlatillo.findByIdAndUpdate(req.params.id, { entregado: true });
    
    res.json(createResponse(true, null, 'Platillo marcado como entregado'));
  })
);

export default router;