// PUT /api/ordenes/extra/:id/estatus - Actualizar estatus (entregado) de un extra
import { Request, Response } from 'express';

import { Router } from 'express';
import { 
  Orden, 
  Suborden, 
  OrdenDetalleProducto, 
  OrdenDetallePlatillo,
  OrdenDetalleExtra,
  Producto 
} from '../models';
import { authenticate, isMesero, isDespachador, isCocinero } from '../middleware/auth';
import { 
  validate, 
  createOrdenSchema, 
  addProductToOrdenSchema,
  addPlatilloToSubordenSchema,
  addExtraToOrdenSchema 
} from '../middleware/validation';
import { asyncHandler, createResponse, calculateImporte } from '../utils/helpers';
import { generateFolio } from '../utils/counters';
import { OrdenStatus } from '../types';

const router = Router();
router.put('/extra/:id/estatus', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { estatus } = req.body;
  // Considera 'entregado' si estatus es 'entregado', de lo contrario false
  const entregado = estatus === 'entregado';
  const extra = await OrdenDetalleExtra.findByIdAndUpdate(
    req.params.id,
    { entregado },
    { new: true }
  );
  if (!extra) {
    return res.status(404).json(createResponse(false, null, 'Extra no encontrado'));
  }
  res.json(createResponse(true, extra));
}));
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

  // Obtener extras vinculados a cada platillo
  const platilloIds = platillos.map(p => p._id);
  const extras = await OrdenDetalleExtra.find({ 
    idOrdenDetallePlatillo: { $in: platilloIds } 
  });

  // Agrupar extras por platillo
  const platillosConExtras = platillos.map(platillo => {
    const extrasDelPlatillo = extras.filter(extra => 
      extra.idOrdenDetallePlatillo === platillo._id!.toString()
    );
    return {
      ...platillo.toObject(),
      extras: extrasDelPlatillo
    };
  });

  const ordenConDetalles = {
    ...orden.toObject(),
    subordenes,
    productos,
    platillos: platillosConExtras,
    extras // Mantener extras por compatibilidad
  };

  res.json(createResponse(true, ordenConDetalles));
}));

// POST /api/ordenes/nueva - Crear nueva orden
router.post('/nueva', authenticate, validate(createOrdenSchema), 
  asyncHandler(async (req: any, res: any) => {

    const folio = await generateFolio();
    
    const orden = new Orden({
      folio,
      ...req.body,
      estatus: req.body.estatus || OrdenStatus.RECEPCION
    });

    await orden.save();
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

    // Permitir modificar órdenes en cualquier estado, así que se elimina el filtro de estatus

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
      const suborden = await Suborden.findById(req.params.id);
      if (!suborden) {
        return res.status(404).json(createResponse(false, null, 'Suborden no encontrada'));
      }

      // Permitir modificar órdenes en cualquier estado, así que se elimina el filtro de estatus

      let { costoPlatillo, cantidad } = req.body;
      costoPlatillo = Number(costoPlatillo);
      cantidad = Number(cantidad);
      if (isNaN(costoPlatillo) || isNaN(cantidad) || costoPlatillo <= 0 || cantidad <= 0) {
        return res.status(400).json(createResponse(false, null, 'Costo y cantidad deben ser números mayores a 0'));
      }

      const importe = calculateImporte(costoPlatillo, cantidad);

      const detallePlatillo = new OrdenDetallePlatillo({
        ...req.body,
        costoPlatillo,
        cantidad,
        idSuborden: suborden._id,
        importe
      });

      try {
        await detallePlatillo.save();
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
  router.post('/:id/producto', authenticate, 
    validate(addProductToOrdenSchema),
    asyncHandler(async (req: any, res: any) => {
    const orden = await Orden.findById(req.params.id);
    if (!orden) {
      return res.status(404).json(createResponse(false, null, 'Orden no encontrada'));
    }

    // Permitir modificar órdenes en cualquier estado, así que se elimina el filtro de estatus

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

// POST /api/ordenes/platillo/:id/extra - Agregar extra a un platillo específico
router.post('/platillo/:id/extra', authenticate, 
  validate(addExtraToOrdenSchema),
  asyncHandler(async (req: any, res: any) => {
    const platilloDetalle = await OrdenDetallePlatillo.findById(req.params.id);
    if (!platilloDetalle) {
      return res.status(404).json(createResponse(false, null, 'Detalle de platillo no encontrado'));
    }

    const { costoExtra, cantidad } = req.body;
    const importe = calculateImporte(costoExtra, cantidad);

    const detalleExtra = new OrdenDetalleExtra({
      idOrdenDetallePlatillo: req.params.id,
      ...req.body,
      importe
    });

    await detalleExtra.save();

    // Buscar la orden para actualizar el total
    const suborden = await Suborden.findById(platilloDetalle.idSuborden);
    if (suborden) {
      await updateOrdenTotal(suborden.idOrden);
    }

    res.status(201).json(createResponse(true, detalleExtra, 'Extra agregado exitosamente'));
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

    // Si la orden se marca como Surtida, marcar todos los productos, platillos y extras como listo
    if (estatus === 'Surtida') {
      // Marcar productos como listo
      await OrdenDetalleProducto.updateMany({ idOrden: orden._id }, { $set: { listo: true } });

      // Obtener subordenes y platillos
      const subordenes = await Suborden.find({ idOrden: orden._id }).select('_id');
      const subordenIds = subordenes.map(s => String(s._id));
      await OrdenDetallePlatillo.updateMany({ idSuborden: { $in: subordenIds } }, { $set: { listo: true } });

      // Obtener platillos para luego marcar sus extras
      const platillos = await OrdenDetallePlatillo.find({ idSuborden: { $in: subordenIds } }).select('_id');
      const platilloIds = platillos.map(p => String(p._id));
      await OrdenDetalleExtra.updateMany({ idOrdenDetallePlatillo: { $in: platilloIds } }, { $set: { listo: true } });
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
  if (userRole === 'Admin') {
    return true;
  }

  const validTransitions: { [key: string]: { [key: string]: string[] } } = {
    'Mesero': {
      'Pendiente': ['Recepcion'],
      'Recepcion': ['Preparacion', 'Surtida', 'Entregada'],
      'Preparacion': ['Surtida', 'Recepcion'],
      'Surtida': ['Entregada', 'Pagada', 'Recepcion'],
      'Entregada': ['Pagada', 'Recepcion'],
    },
    'Despachador': {
      'Recepcion': ['Preparacion', 'Surtida', 'Entregada'],
      'Preparacion': ['Surtida'],
      'Surtida': ['Entregada']
    },
    'Encargado': {
      'Pendiente': ['Recepcion'],
      'Recepcion': ['Preparacion', 'Surtida', 'Entregada'],
      'Preparacion': ['Surtida', 'Recepcion'],
      'Surtida': ['Entregada', 'Pagada', 'Recepcion'],
      'Entregada': ['Pagada', 'Recepcion']
    },
    'Empleado': {
      'Pendiente': ['Recepcion'],
      'Recepcion': ['Preparacion', 'Surtida', 'Entregada'],
      'Preparacion': ['Surtida', 'Recepcion'],
      'Surtida': ['Entregada', 'Pagada', 'Recepcion'],
      'Entregada': ['Pagada', 'Recepcion']
    },
    'Cocinero': {
      'Recepcion': ['Preparacion', 'Surtida', 'Entregada'],
      'Preparacion': ['Surtida']
    },
    'Admin': {
      'Pendiente': ['Recepcion'],
      'Recepcion': ['Preparacion', 'Surtida', 'Entregada'],
      'Preparacion': ['Surtida', 'Recepcion'],
      'Surtida': ['Entregada', 'Pagada', 'Recepcion'],
      'Entregada': ['Pagada', 'Recepcion']
    }
  };

  const roleTransitions = validTransitions[userRole];
  
  if (!roleTransitions) {
    return false;
  }

  const allowedNewStatuses = roleTransitions[currentStatus];
  
  const result = allowedNewStatuses ? allowedNewStatuses.includes(newStatus) : false;
  
  return result;
}

// Helper function to update orden total
async function updateOrdenTotal(ordenId: string) {
  // Obtener los subordenes de la orden
  const subordenes = await Suborden.find({ idOrden: ordenId }).select('_id');
  const subordenIds = subordenes.map(s => String(s._id));

  // Obtener platillos para luego calcular sus extras
  const platillos = await OrdenDetallePlatillo.find({ 
    idSuborden: { $in: subordenIds } 
  }).select('_id');
  const platilloIds = platillos.map(p => String(p._id));

  const [productosTotal, platillosTotal, extrasTotal] = await Promise.all([
    OrdenDetalleProducto.aggregate([
      { $match: { idOrden: ordenId } },
      { $group: { _id: null, total: { $sum: '$importe' } } }
    ]),
    OrdenDetallePlatillo.aggregate([
      { $match: { idSuborden: { $in: subordenIds } } },
      { $group: { _id: null, total: { $sum: '$importe' } } }
    ]),
    OrdenDetalleExtra.aggregate([
      { $match: { idOrdenDetallePlatillo: { $in: platilloIds } } },
      { $group: { _id: null, total: { $sum: '$importe' } } }
    ])
  ]);

  const total = (productosTotal[0]?.total || 0) + (platillosTotal[0]?.total || 0) + (extrasTotal[0]?.total || 0);
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

// PUT /api/ordenes/platillo/:id/nota - Actualizar nota del platillo
router.put('/platillo/:id/nota', authenticate,
  asyncHandler(async (req: any, res: any) => {
    const { notas } = req.body;
    
    const platillo = await OrdenDetallePlatillo.findById(req.params.id);
    if (!platillo) {
      return res.status(404).json(createResponse(false, null, 'Platillo no encontrado'));
    }

    await OrdenDetallePlatillo.findByIdAndUpdate(req.params.id, { notas });
    
    res.json(createResponse(true, null, 'Nota del platillo actualizada exitosamente'));
  })
);

// PUT /api/ordenes/extra/:id/listo - Marcar extra como listo
router.put('/extra/:id/listo', authenticate, 
  asyncHandler(async (req: any, res: any) => {
    const extra = await OrdenDetalleExtra.findById(req.params.id);
    if (!extra) {
      return res.status(404).json(createResponse(false, null, 'Extra no encontrado'));
    }

    await OrdenDetalleExtra.findByIdAndUpdate(req.params.id, { listo: true });
    
    res.json(createResponse(true, null, 'Extra marcado como listo'));
  })
);

// PUT /api/ordenes/extra/:id/entregado - Marcar extra como entregado
router.put('/extra/:id/entregado', authenticate,
  asyncHandler(async (req: any, res: any) => {
    const extra = await OrdenDetalleExtra.findById(req.params.id);
    if (!extra) {
      return res.status(404).json(createResponse(false, null, 'Extra no encontrado'));
    }

    await OrdenDetalleExtra.findByIdAndUpdate(req.params.id, { entregado: true });
    
    res.json(createResponse(true, null, 'Extra marcado como entregado'));
  })
);

// DELETE /api/ordenes/platillo/:id - Eliminar platillo de una suborden
router.delete('/platillo/:id', authenticate, asyncHandler(async (req: any, res: any) => {
  const platillo = await OrdenDetallePlatillo.findById(req.params.id);
  if (!platillo) {
    return res.status(404).json(createResponse(false, null, 'Platillo no encontrado'));
  }
  await OrdenDetallePlatillo.findByIdAndDelete(req.params.id);
  // Actualizar total de la orden
  const suborden = await Suborden.findById(platillo.idSuborden);
  if (suborden) {
    await updateOrdenTotal(suborden.idOrden);
  }
  res.json(createResponse(true, null, 'Platillo eliminado exitosamente'));
}));

// DELETE /api/ordenes/producto/:id - Eliminar producto de una orden
router.delete('/producto/:id', authenticate, asyncHandler(async (req: any, res: any) => {
  const producto = await OrdenDetalleProducto.findById(req.params.id);
  if (!producto) {
    return res.status(404).json(createResponse(false, null, 'Producto no encontrado'));
  }
  await OrdenDetalleProducto.findByIdAndDelete(req.params.id);
  // Actualizar total de la orden
  await updateOrdenTotal(producto.idOrden);
  res.json(createResponse(true, null, 'Producto eliminado exitosamente'));
}));

// DELETE /api/ordenes/extra/:id - Eliminar extra de una orden
router.delete('/extra/:id', authenticate, asyncHandler(async (req: any, res: any) => {
  const extra = await OrdenDetalleExtra.findById(req.params.id);
  if (!extra) {
    return res.status(404).json(createResponse(false, null, 'Extra no encontrado'));
  }

  // Obtener la orden a través del platillo
  const platillo = await OrdenDetallePlatillo.findById(extra.idOrdenDetallePlatillo);
  if (platillo) {
    const suborden = await Suborden.findById(platillo.idSuborden);
    if (suborden) {
      await OrdenDetalleExtra.findByIdAndDelete(req.params.id);
      await updateOrdenTotal(suborden.idOrden);
    }
  }
  
  res.json(createResponse(true, null, 'Extra eliminado exitosamente'));
}));

export default router;