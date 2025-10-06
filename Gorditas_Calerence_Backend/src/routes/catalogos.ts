import { Router } from 'express';
import { 
  Guiso, TipoProducto, Producto, TipoPlatillo, Platillo,
  TipoExtra, Extra, TipoUsuario, Usuario, TipoOrden, Mesa, TipoGasto, Gasto
} from '../models';
import { authenticate, isAdmin, isEncargado } from '../middleware/auth';
import { asyncHandler, createResponse } from '../utils/helpers';
import { getNextSequence, getNextPedidoNumber } from '../utils/counters';

const router = Router();

// Mapeo de modelos
const modelMap: { [key: string]: any } = {
  guiso: Guiso,
  tipoproducto: TipoProducto,
  'tipo-producto': TipoProducto, // Alias con guión
  producto: Producto,
  tipoplatillo: TipoPlatillo,
  'tipo-platillo': TipoPlatillo, // Alias con guión
  platillo: Platillo,
  tipoextra: TipoExtra,
  'tipo-extra': TipoExtra, // Alias con guión
  extra: Extra,
  tipousuario: TipoUsuario,
  'tipo-usuario': TipoUsuario, // Alias con guión
  usuario: Usuario,
  tipoorden: TipoOrden,
  'tipo-orden': TipoOrden, // Alias con guión
  mesa: Mesa,
  tipogasto: TipoGasto,
  'tipo-gasto': TipoGasto, // Alias con guión
  gasto: Gasto
};

// Middleware para validar el modelo
const validateModel = (req: any, res: any, next: any) => {
  const { modelo } = req.params;
  if (!modelMap[modelo.toLowerCase()]) {
    return res.status(400).json(createResponse(false, null, 'Modelo no válido'));
  }
  req.Model = modelMap[modelo.toLowerCase()];
  next();
};

// GET /api/catalogos/{modelo} - Listar
router.get('/:modelo', authenticate, validateModel,
  asyncHandler(async (req: any, res: any) => {
    const { page = 1, limit = 20, activo, search } = req.query;
    
    const filter: any = {};
    if (activo !== undefined) filter.activo = activo === 'true';
    if (search) {
      filter.$or = [
        { nombre: { $regex: search, $options: 'i' } },
        { descripcion: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [items, total] = await Promise.all([
      req.Model.find(filter)
        .sort({ nombre: 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      req.Model.countDocuments(filter)
    ]);

    res.json(createResponse(true, {
      items,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }));
  })
);

// POST /api/catalogos/{modelo} - Crear
router.post('/:modelo', authenticate, validateModel,
  asyncHandler(async (req: any, res: any) => {
    // Para modelos con _id numérico, generar el siguiente ID
    const needsNumericId = !['usuario'].includes(req.params.modelo.toLowerCase());
    
    let itemData = { ...req.body };
    
    if (needsNumericId) {
      const nextId = await getNextSequence(req.params.modelo.toLowerCase());
      itemData._id = nextId;
    }

    const item = new req.Model(itemData);
    await item.save();

    res.status(201).json(createResponse(true, item, 'Registro creado exitosamente'));
  })
);

// PUT /api/catalogos/{modelo}/:id - Actualizar
import bcrypt from 'bcryptjs';

router.put('/:modelo/:id', authenticate, validateModel,
  asyncHandler(async (req: any, res: any) => {
    let updateData = { ...req.body };
    if (req.params.modelo.toLowerCase() === 'usuario' && updateData.password) {
      // Hashear la contraseña antes de actualizar
      const salt = await bcrypt.genSalt(12);
      updateData.password = await bcrypt.hash(updateData.password, salt);
    }
    const item = await req.Model.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json(createResponse(false, null, 'Registro no encontrado'));
    }

    res.json(createResponse(true, item, 'Registro actualizado exitosamente'));
  })
);

// DELETE /api/catalogos/{modelo}/:id - Eliminar
router.delete('/:modelo/:id', authenticate, validateModel,
  asyncHandler(async (req: any, res: any) => {
    // Eliminar completamente el registro para todos los modelos
    const item = await req.Model.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json(createResponse(false, null, 'Registro no encontrado'));
    }

    res.json(createResponse(true, null, 'Registro eliminado exitosamente'));
  })
);

// GET /api/catalogos/pedido/next-number - Obtener el siguiente número de pedido del día
router.get('/pedido/next-number', authenticate,
  asyncHandler(async (req: any, res: any) => {
    const nextNumber = await getNextPedidoNumber();
    res.json(createResponse(true, { nextNumber }, 'Siguiente número de pedido obtenido'));
  })
);

export default router;