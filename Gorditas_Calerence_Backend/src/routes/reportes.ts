import { Router } from 'express';
import { 
  Orden, 
  OrdenDetalleProducto, 
  OrdenDetallePlatillo,
  Producto,
  Gasto 
} from '../models';
import { authenticate, isEncargado } from '../middleware/auth';
import { asyncHandler, createResponse } from '../utils/helpers';
import { OrdenStatus } from '../types';

const router = Router();

// GET /api/reportes/ventas - Reporte de ventas
router.get('/ventas', authenticate, isEncargado, 
  asyncHandler(async (req: any, res: any) => {
    const { fechaInicio, fechaFin } = req.query;

    const filter: any = { estatus: "Pagada" };

    // Filtro por rango de fechas
    if (fechaInicio && fechaFin) {
      filter.fechaHora = {
        $gte: new Date(fechaInicio),
        $lte: new Date(fechaFin)
      };
    }

    // Contabiliza las ordenes con estatus "Pagada"
    const pagadasCount = await Orden.countDocuments({ estatus: "Pagada" });

    // Obtiene las ordenes filtradas
    const ordenes = await Orden.find(filter).sort({ fechaHora: -1 });

    // Obtiene los IDs de las ordenes filtradas
    const ordenIds = ordenes.map(o => o._id);

    // Busca los productos de las ordenes filtradas
    const productos = await OrdenDetalleProducto.find({ idOrden: { $in: ordenIds } });

    // Busca los platillos de las subordenes asociadas a las ordenes filtradas
    // Primero obtenemos las subordenes asociadas
    const subordenes = await (await import('../models')).Suborden.find({ idOrden: { $in: ordenIds } }).select('_id');
    const subordenIds = subordenes.map((s: any) => s._id);

    // Ahora obtenemos los platillos usando los subordenIds
    const platillos = await OrdenDetallePlatillo.find({ idSuborden: { $in: subordenIds } });

    // El resto de los cálculos
    const [total, resumen, ventasPorDia, ventasPorTipo] = await Promise.all([
      Orden.countDocuments(filter),
      Orden.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalVentas: { $sum: '$total' },
            cantidadOrdenes: { $sum: 1 },
            promedioVenta: { $avg: '$total' }
          }
        }
      ]),
      Orden.aggregate([
        { $match: filter },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$fechaHora' } },
            ventas: { $sum: '$total' },
            ordenes: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Orden.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$nombreTipoOrden',
            ventas: { $sum: '$total' },
            ordenes: { $sum: 1 }
          }
        }
      ])
    ]);
    
    res.json(createResponse(true, {
      ordenes,
      productos,
      platillos,
      pagination: {
        total
      },
      resumen: resumen[0] || { totalVentas: 0, cantidadOrdenes: 0, promedioVenta: 0 },
      ventasPorDia,
      ventasPorTipo,
      ordenesPagadas: pagadasCount
    }));
  })
);

// GET /api/reportes/inventario - Reporte de inventario
router.get('/inventario', authenticate, isEncargado, 
  asyncHandler(async (req: any, res: any) => {
    const productos = await Producto.find({ activo: true }).sort({ cantidad: 1 });
    
    const resumen = {
      totalProductos: productos.length,
      stockBajo: productos.filter(p => p.cantidad <= 5 && p.cantidad > 0).length,
      stockAgotado: productos.filter(p => p.cantidad === 0).length,
      valorInventario: productos.reduce((total, producto) => total + (producto.cantidad * producto.costo), 0)
    };

    const productosStockBajo = productos.filter(p => p.cantidad <= 5);
    const productosStockAlto = productos.filter(p => p.cantidad > 50);

    res.json(createResponse(true, {
      productos,
      resumen,
      alertas: {
        stockBajo: productosStockBajo,
        stockAlto: productosStockAlto
      }
    }));
  })
);

// GET /api/reportes/gastos - Reporte de gastos
router.get('/gastos', authenticate, isEncargado, 
  asyncHandler(async (req: any, res: any) => {
    const { fechaInicio, fechaFin, tipoGasto } = req.query;
    
    const filter: any = {};
    
    if (fechaInicio && fechaFin) {
      filter.fecha = {
        $gte: new Date(fechaInicio),
        $lte: new Date(fechaFin)
      };
    }

    if (tipoGasto) filter.idTipoGasto = parseInt(tipoGasto);

    const [gastos, resumen] = await Promise.all([
      Gasto.find(filter).sort({ fecha: -1 }),
      Gasto.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalGastos: { $sum: { $ifNull: ['$gastoTotal', '$costo'] } },
            cantidadGastos: { $sum: 1 },
            promedioGasto: { $avg: { $ifNull: ['$gastoTotal', '$costo'] } }
          }
        }
      ])
    ]);

    // Gastos por tipo
    const gastosPorTipo = await Gasto.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$nombreTipoGasto',
          gastos: { $sum: { $ifNull: ['$gastoTotal', '$costo'] } },
          cantidad: { $sum: 1 }
        }
      },
      { $sort: { gastos: -1 } }
    ]);

    // Gastos por día
    const gastosPorDia = await Gasto.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$fecha' } },
          gastos: { $sum: { $ifNull: ['$gastoTotal', '$costo'] } },
          cantidad: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json(createResponse(true, {
      gastos,
      resumen: resumen[0] || { totalGastos: 0, cantidadGastos: 0, promedioGasto: 0 },
      gastosPorTipo,
      gastosPorDia
    }));
  })
);

// GET /api/reportes/productos-vendidos - Productos más vendidos
router.get('/productos-vendidos', authenticate, isEncargado, 
  asyncHandler(async (req: any, res: any) => {
    const { fechaInicio, fechaFin, limit = 10 } = req.query;
    
    const matchFilter: any = {};
    
    if (fechaInicio && fechaFin) {
      // Necesitamos hacer lookup con Orden para filtrar por fecha
      const ordenesFiltradas = await Orden.find({
        fechaHora: {
          $gte: new Date(fechaInicio),
          $lte: new Date(fechaFin)
        },
        estatus: OrdenStatus.ENTREGADA
      }).select('_id');
      
      matchFilter.idOrden = { $in: ordenesFiltradas.map(o => o._id) };
    }

    const productosVendidos = await OrdenDetalleProducto.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: {
            idProducto: '$idProducto',
            nombreProducto: '$nombreProducto'
          },
          cantidadVendida: { $sum: '$cantidad' },
          totalVentas: { $sum: '$importe' },
          vecesVendido: { $sum: 1 }
        }
      },
      { $sort: { cantidadVendida: -1 } },
      { $limit: parseInt(limit) }
    ]);

    // Platillos más vendidos
    const platillosVendidos = await OrdenDetallePlatillo.aggregate([
      // Lookup con subordenes para obtener idOrden
      {
        $lookup: {
          from: 'subordenes',
          localField: 'idSuborden',
          foreignField: '_id',
          as: 'suborden'
        }
      },
      // Lookup con ordenes para filtrar
      {
        $lookup: {
          from: 'ordenes',
          localField: 'suborden.idOrden',
          foreignField: '_id',
          as: 'orden'
        }
      },
      {
        $match: {
          'orden.estatus': OrdenStatus.ENTREGADA,
          ...(fechaInicio && fechaFin ? {
            'orden.fechaHora': {
              $gte: new Date(fechaInicio),
              $lte: new Date(fechaFin)
            }
          } : {})
        }
      },
      {
        $group: {
          _id: {
            idPlatillo: '$idPlatillo',
            nombrePlatillo: '$nombrePlatillo'
          },
          cantidadVendida: { $sum: '$cantidad' },
          totalVentas: { $sum: '$importe' },
          vecesVendido: { $sum: 1 }
        }
      },
      { $sort: { cantidadVendida: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.json(createResponse(true, {
      productos: productosVendidos,
      platillos: platillosVendidos
    }));
  })
);

// POST /api/reportes/gastos - Crear nuevo gasto
router.post('/gastos', authenticate, isEncargado, 
  asyncHandler(async (req: any, res: any) => {
    const { nombre, gastoTotal, descripcion, idTipoGasto, nombreTipoGasto } = req.body;

    if (!nombre || !gastoTotal || !idTipoGasto) {
      return res.status(400).json(createResponse(false, null, 'Faltan campos requeridos: nombre, gastoTotal, idTipoGasto'));
    }

    const nuevoGasto = new Gasto({
      nombre,
      gastoTotal,
      descripcion,
      idTipoGasto,
      nombreTipoGasto: nombreTipoGasto || '',
      costo: gastoTotal, // Keep both for compatibility
      fecha: new Date()
    });

    await nuevoGasto.save();

    res.json(createResponse(true, nuevoGasto, 'Gasto creado exitosamente'));
  })
);

export default router;