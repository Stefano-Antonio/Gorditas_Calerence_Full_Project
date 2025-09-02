import { Router } from 'express';
import { Producto } from '../models';
import { authenticate, isEncargado } from '../middleware/auth';
import { asyncHandler, createResponse } from '../utils/helpers';

const router = Router();

// GET /api/inventario - Consultar inventario
router.get('/', authenticate, asyncHandler(async (req: any, res: any) => {
  const { tipoProducto, activo, page = 1, limit = 20 } = req.query;
  
  const filter: any = {};
  if (tipoProducto) filter.idTipoProducto = tipoProducto;
  if (activo !== undefined) filter.activo = activo === 'true';

  const skip = (parseInt(page) - 1) * parseInt(limit);
  

  const [productos, total] = await Promise.all([
    Producto.find(filter)
      .sort({ nombre: 1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Producto.countDocuments(filter)
  ]);


  // Agregar alertas de stock bajo
  const productosConAlertas = productos.map(producto => ({
    ...producto.toObject(),
    stockBajo: producto.cantidad <= 5,
    stockAgotado: producto.cantidad === 0
  }));

  res.json(createResponse(true, {
    productos: productosConAlertas,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    },
    resumen: {
      total,
      stockBajo: productos.filter(p => p.cantidad <= 5 && p.cantidad > 0).length,
      stockAgotado: productos.filter(p => p.cantidad === 0).length
    }
  }));
}));

// POST /api/inventario/recibir - Recibir productos
router.post('/recibir', authenticate, isEncargado, 
  asyncHandler(async (req: any, res: any) => {
    const { productos } = req.body; // Array de { idProducto, cantidad }
    
    if (!Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json(createResponse(false, null, 'Debe proporcionar al menos un producto'));
    }

    const updates = [];
    for (const item of productos) {
      const { idProducto, cantidad } = item;
      
      if (cantidad <= 0) {
        continue;
      }

      const update = await Producto.findByIdAndUpdate(
        idProducto,
        { $inc: { cantidad } },
        { new: true }
      );

      if (update) {
        updates.push(update);
      }
    }

    res.json(createResponse(true, updates, `${updates.length} productos actualizados exitosamente`));
  })
);

// PUT /api/inventario/ajustar/:id - Ajustar inventario
router.put('/ajustar/:id', authenticate, isEncargado,
  asyncHandler(async (req: any, res: any) => {
    const { cantidad, motivo } = req.body;
    
    if (cantidad < 0) {
      return res.status(400).json(createResponse(false, null, 'La cantidad no puede ser negativa'));
    }

    const producto = await Producto.findByIdAndUpdate(
      req.params.id,
      { cantidad },
      { new: true }
    );

    if (!producto) {
      return res.status(404).json(createResponse(false, null, 'Producto no encontrado'));
    }

   
    res.json(createResponse(true, producto, 'Inventario ajustado exitosamente'));
  })
);

export default router;