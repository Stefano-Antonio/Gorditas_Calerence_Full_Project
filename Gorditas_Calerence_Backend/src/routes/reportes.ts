import { Router } from 'express';
import { 
  Orden, 
  OrdenDetalleProducto, 
  OrdenDetallePlatillo,
  Producto,
  Gasto,
  Usuario,
  Mesa 
} from '../models';
import { authenticate, isEncargado } from '../middleware/auth';
import { asyncHandler, createResponse } from '../utils/helpers';
import { OrdenStatus } from '../types';

const router = Router();

// GET /api/reportes/ventas - Reporte de ventas
router.get('/ventas', authenticate, isEncargado, 
  asyncHandler(async (req: any, res: any) => {
    const { fechaInicio, fechaFin, tipoOrden, mesa, limit = 50, page = 1 } = req.query;
    
    const filter: any = {
      estatus: { $in: [OrdenStatus.ENTREGADA] }
    };

    if (fechaInicio && fechaFin) {
      filter.fechaHora = {
        $gte: new Date(fechaInicio),
        $lte: new Date(fechaFin)
      };
    }

    if (tipoOrden) filter.idTipoOrden = parseInt(tipoOrden);
    if (mesa) filter.idMesa = parseInt(mesa);

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [ordenes, resumen, totalCount] = await Promise.all([
      Orden.find(filter)
        .sort({ fechaHora: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
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
      Orden.countDocuments(filter)
    ]);

    // Ventas por día
    const ventasPorDia = await Orden.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$fechaHora' } },
          ventas: { $sum: '$total' },
          ordenes: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Ventas por tipo de orden
    const ventasPorTipo = await Orden.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$nombreTipoOrden',
          ventas: { $sum: '$total' },
          ordenes: { $sum: 1 }
        }
      }
    ]);

    const resumenData = resumen[0] || { totalVentas: 0, cantidadOrdenes: 0, promedioVenta: 0 };

    res.json(createResponse(true, {
      ordenes,
      resumen: resumenData,
      ventasPorDia,
      ventasPorTipo,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        totalPages: Math.ceil(totalCount / parseInt(limit))
      }
    }));
  })
);

// GET /api/reportes/inventario - Reporte de inventario
router.get('/inventario', authenticate, isEncargado, 
  asyncHandler(async (req: any, res: any) => {
    const { categoria, stockMinimo = 5, limit = 50, page = 1 } = req.query;
    
    const filter: any = { activo: true };
    if (categoria) filter.tipoProducto = categoria;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const stockMinimoValue = parseInt(stockMinimo);

    const [productos, totalCount] = await Promise.all([
      Producto.find(filter)
        .sort({ cantidad: 1, nombre: 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Producto.countDocuments(filter)
    ]);

    // Calcular productos para el reporte de inventario
    const productosInventario = productos.map(producto => ({
      producto: {
        _id: producto._id,
        nombre: producto.nombre,
        cantidad: producto.cantidad,
        costo: producto.costo,
        tipoProducto: producto.nombreTipoProducto
      },
      valorTotal: producto.cantidad * producto.costo,
      stockMinimo: producto.cantidad <= stockMinimoValue && producto.cantidad > 0,
      stockAgotado: producto.cantidad === 0
    }));
    
    const resumen = {
      totalProductos: productos.length,
      stockBajo: productos.filter(p => p.cantidad <= stockMinimoValue && p.cantidad > 0).length,
      stockAgotado: productos.filter(p => p.cantidad === 0).length,
      valorInventario: productos.reduce((total, producto) => total + (producto.cantidad * producto.costo), 0)
    };

    const productosStockBajo = productos.filter(p => p.cantidad <= stockMinimoValue && p.cantidad > 0);
    const productosStockAlto = productos.filter(p => p.cantidad > 50);

    res.json(createResponse(true, {
      productos: productosInventario,
      resumen,
      alertas: {
        stockBajo: productosStockBajo,
        stockAlto: productosStockAlto
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        totalPages: Math.ceil(totalCount / parseInt(limit))
      }
    }));
  })
);

// GET /api/reportes/gastos - Reporte de gastos
router.get('/gastos', authenticate, isEncargado, 
  asyncHandler(async (req: any, res: any) => {
    const { fechaInicio, fechaFin, tipoGasto, usuario, limit = 50, page = 1 } = req.query;
    
    const filter: any = {};
    
    if (fechaInicio && fechaFin) {
      filter.fecha = {
        $gte: new Date(fechaInicio),
        $lte: new Date(fechaFin)
      };
    }

    if (tipoGasto) filter.idTipoGasto = parseInt(tipoGasto);
    if (usuario) filter.idUsuario = parseInt(usuario);

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [gastos, resumen, totalCount] = await Promise.all([
      Gasto.find(filter)
        .sort({ fecha: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Gasto.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalGastos: { $sum: '$costo' },
            cantidadGastos: { $sum: 1 },
            promedioGasto: { $avg: '$costo' }
          }
        }
      ]),
      Gasto.countDocuments(filter)
    ]);

    // Gastos por tipo
    const gastosPorTipo = await Gasto.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$nombreTipoGasto',
          gastos: { $sum: '$costo' },
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
          gastos: { $sum: '$costo' },
          cantidad: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Gastos por usuario
    const gastosPorUsuario = await Gasto.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$nombreUsuario',
          gastos: { $sum: '$costo' },
          cantidad: { $sum: 1 }
        }
      },
      { $sort: { gastos: -1 } }
    ]);

    res.json(createResponse(true, {
      gastos,
      resumen: resumen[0] || { totalGastos: 0, cantidadGastos: 0, promedioGasto: 0 },
      gastosPorTipo,
      gastosPorDia,
      gastosPorUsuario,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        totalPages: Math.ceil(totalCount / parseInt(limit))
      }
    }));
  })
);

// GET /api/reportes/productos-vendidos - Productos más vendidos
router.get('/productos-vendidos', authenticate, isEncargado, 
  asyncHandler(async (req: any, res: any) => {
    const { fechaInicio, fechaFin, limit = 10, tipoProducto } = req.query;
    
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

    // Formatear datos para que coincidan con la interfaz del frontend
    const productosFormateados = productosVendidos.map(p => ({
      producto: p._id.idProducto,
      nombre: p._id.nombreProducto,
      cantidadVendida: p.cantidadVendida,
      totalVendido: p.totalVentas,
      vecesVendido: p.vecesVendido
    }));

    const platillosFormateados = platillosVendidos.map(p => ({
      platillo: p._id.idPlatillo,
      nombre: p._id.nombrePlatillo,
      cantidadVendida: p.cantidadVendida,
      totalVendido: p.totalVentas,
      vecesVendido: p.vecesVendido
    }));

    res.json(createResponse(true, {
      productos: productosFormateados,
      platillos: platillosFormateados,
      resumen: {
        totalProductosVendidos: productosFormateados.reduce((sum, p) => sum + p.cantidadVendida, 0),
        totalPlatillosVendidos: platillosFormateados.reduce((sum, p) => sum + p.cantidadVendida, 0),
        ingresosTotalProductos: productosFormateados.reduce((sum, p) => sum + p.totalVendido, 0),
        ingresosTotalPlatillos: platillosFormateados.reduce((sum, p) => sum + p.totalVendido, 0)
      }
    }));
  })
);

// GET /api/reportes/usuarios - Reporte de usuarios
router.get('/usuarios', authenticate, isEncargado,
  asyncHandler(async (req: any, res: any) => {
    const { fechaInicio, fechaFin, tipoUsuario, limit = 50, page = 1 } = req.query;

    const filter: any = { activo: true };
    if (tipoUsuario) filter.idTipoUsuario = parseInt(tipoUsuario);

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Obtener usuarios
    const [usuarios, totalCount] = await Promise.all([
      Orden.aggregate([
        {
          $match: {
            ...(fechaInicio && fechaFin ? {
              fechaHora: {
                $gte: new Date(fechaInicio),
                $lte: new Date(fechaFin)
              }
            } : {}),
            estatus: { $in: [OrdenStatus.ENTREGADA] }
          }
        },
        {
          $group: {
            _id: {
              idUsuario: '$idUsuario',
              nombreUsuario: '$nombreUsuario'
            },
            totalOrdenes: { $sum: 1 },
            totalVentas: { $sum: '$total' },
            promedioVenta: { $avg: '$total' }
          }
        },
        { $sort: { totalVentas: -1 } },
        { $skip: skip },
        { $limit: parseInt(limit) }
      ]),
      Orden.aggregate([
        {
          $match: {
            ...(fechaInicio && fechaFin ? {
              fechaHora: {
                $gte: new Date(fechaInicio),
                $lte: new Date(fechaFin)
              }
            } : {}),
            estatus: { $in: [OrdenStatus.ENTREGADA] }
          }
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    // Formatear datos
    const usuariosFormateados = usuarios.map(u => ({
      idUsuario: u._id.idUsuario,
      nombreUsuario: u._id.nombreUsuario,
      totalOrdenes: u.totalOrdenes,
      totalVentas: u.totalVentas,
      promedioVenta: u.promedioVenta
    }));

    const resumen = {
      totalUsuariosActivos: usuariosFormateados.length,
      ventasTotales: usuariosFormateados.reduce((sum, u) => sum + u.totalVentas, 0),
      ordenesTotales: usuariosFormateados.reduce((sum, u) => sum + u.totalOrdenes, 0)
    };

    res.json(createResponse(true, {
      usuarios: usuariosFormateados,
      resumen,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount[0]?.count || 0,
        totalPages: Math.ceil((totalCount[0]?.count || 0) / parseInt(limit))
      }
    }));
  })
);

// GET /api/reportes/mesas - Reporte de mesas
router.get('/mesas', authenticate, isEncargado,
  asyncHandler(async (req: any, res: any) => {
    const { fechaInicio, fechaFin, limit = 50, page = 1 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Obtener estadísticas por mesa
    const [mesasStats, totalCount] = await Promise.all([
      Orden.aggregate([
        {
          $match: {
            ...(fechaInicio && fechaFin ? {
              fechaHora: {
                $gte: new Date(fechaInicio),
                $lte: new Date(fechaFin)
              }
            } : {}),
            estatus: { $in: [OrdenStatus.ENTREGADA] }
          }
        },
        {
          $group: {
            _id: {
              idMesa: '$idMesa',
              nombreMesa: '$nombreMesa'
            },
            totalOrdenes: { $sum: 1 },
            totalVentas: { $sum: '$total' },
            promedioVenta: { $avg: '$total' },
            ultimaOrden: { $max: '$fechaHora' }
          }
        },
        { $sort: { totalVentas: -1 } },
        { $skip: skip },
        { $limit: parseInt(limit) }
      ]),
      Orden.aggregate([
        {
          $match: {
            ...(fechaInicio && fechaFin ? {
              fechaHora: {
                $gte: new Date(fechaInicio),
                $lte: new Date(fechaFin)
              }
            } : {}),
            estatus: { $in: [OrdenStatus.ENTREGADA] }
          }
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    // Formatear datos
    const mesasFormateadas = mesasStats.map(m => ({
      idMesa: m._id.idMesa,
      nombreMesa: m._id.nombreMesa,
      totalOrdenes: m.totalOrdenes,
      totalVentas: m.totalVentas,
      promedioVenta: m.promedioVenta,
      ultimaOrden: m.ultimaOrden
    }));

    const resumen = {
      totalMesas: mesasFormateadas.length,
      ventasTotales: mesasFormateadas.reduce((sum, m) => sum + m.totalVentas, 0),
      ordenesTotales: mesasFormateadas.reduce((sum, m) => sum + m.totalOrdenes, 0),
      mesaMasVentas: mesasFormateadas.length > 0 ? mesasFormateadas[0] : null
    };

    res.json(createResponse(true, {
      mesas: mesasFormateadas,
      resumen,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount[0]?.count || 0,
        totalPages: Math.ceil((totalCount[0]?.count || 0) / parseInt(limit))
      }
    }));
  })
);

export default router;