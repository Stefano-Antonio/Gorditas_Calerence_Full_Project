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

    const detallePlatillo = new OrdenDetallePlatillo({
      idSuborden: suborden._id,
      ...req.body,
      importe
    });

    await detallePlatillo.save();

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
router.put('/:id/estatus', authenticate, isDespachador,
  asyncHandler(async (req: any, res: any) => {
    const { estatus } = req.body;
    
    if (!Object.values(OrdenStatus).includes(estatus)) {
      return res.status(400).json(createResponse(false, null, 'Estatus no válido'));
    }

    const orden = await Orden.findByIdAndUpdate(
      req.params.id,
      { estatus },
      { new: true }
    );

    if (!orden) {
      return res.status(404).json(createResponse(false, null, 'Orden no encontrada'));
    }

    res.json(createResponse(true, orden, 'Estatus actualizado exitosamente'));
  })
);

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

export default router;