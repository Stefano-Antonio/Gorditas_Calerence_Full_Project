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
    const { fechaInicio, fechaFin, tipoOrden, mesa } = req.query;
    
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

    // Obtener gastos por día para el mismo período
    const gastosFilter: any = {};
    if (fechaInicio && fechaFin) {
      gastosFilter.fecha = {
        $gte: new Date(fechaInicio),
        $lte: new Date(fechaFin)
      };
    }

    const gastosPorDia = await Gasto.aggregate([
      { $match: gastosFilter },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$fecha' } },
          gastos: { $sum: '$costo' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Crear mapa de gastos por fecha para facilitar lookup
    const gastosMap = gastosPorDia.reduce((acc, gasto) => {
      acc[gasto._id] = gasto.gastos;
      return acc;
    }, {} as Record<string, number>);

    // Crear reporte combinado por día
    const reporteVentas = ventasPorDia.map(venta => {
      const gastosTotales = gastosMap[venta._id] || 0;
      const ventasTotales = venta.ventas;
      const utilidad = ventasTotales - gastosTotales;
      
      return {
        fecha: venta._id,
        ventasTotales,
        gastosTotales,
        utilidad,
        ordenes: venta.ordenes
      };
    });

    // Obtener datos adicionales para el resumen
    const [resumen, ventasPorTipo] = await Promise.all([
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
            _id: '$nombreTipoOrden',
            ventas: { $sum: '$total' },
            ordenes: { $sum: 1 }
          }
        }
      ])
    ]);

    res.json(createResponse(true, {
      data: reporteVentas,
      resumen: resumen[0] || { totalVentas: 0, cantidadOrdenes: 0, promedioVenta: 0 },
      ventasPorTipo
    }));
  })
);

// GET /api/reportes/inventario - Reporte de inventario
router.get('/inventario', authenticate, isEncargado, 
  asyncHandler(async (req: any, res: any) => {
    const productos = await Producto.find({ activo: true }).sort({ cantidad: 1 });
    
    // Crear estructura que espera el frontend
    const reporteInventario = productos.map(producto => ({
      producto: {
        _id: producto._id,
        nombre: producto.nombre,
        cantidad: producto.cantidad,
        costo: producto.costo,
        precio: producto.costo * 1.3, // Calcular precio basado en costo
        idTipoProducto: producto.idTipoProducto,
        nombreTipoProducto: producto.nombreTipoProducto,
        activo: producto.activo
      },
      valorTotal: producto.cantidad * producto.costo,
      stockMinimo: producto.cantidad <= 5
    }));

    const resumen = {
      totalProductos: productos.length,
      stockBajo: productos.filter(p => p.cantidad <= 5 && p.cantidad > 0).length,
      stockAgotado: productos.filter(p => p.cantidad === 0).length,
      valorInventario: productos.reduce((total, producto) => total + (producto.cantidad * producto.costo), 0)
    };

    const alertas = {
      stockBajo: productos.filter(p => p.cantidad <= 5),
      stockAlto: productos.filter(p => p.cantidad > 50)
    };

    res.json(createResponse(true, {
      data: reporteInventario,
      resumen,
      alertas
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

    const gastos = await Gasto.find(filter).sort({ fecha: -1 });

    // Formatear gastos para el frontend
    const gastosFormateados = gastos.map(gasto => ({
      _id: gasto._id,
      fecha: gasto.fecha,
      tipoGasto: gasto.nombreTipoGasto || 'N/A',
      descripcion: 'Gasto registrado', // Campo por defecto ya que no existe en el modelo
      monto: gasto.costo,
      usuario: 'Sistema' // Campo por defecto ya que no existe en el modelo
    }));

    const [resumen] = await Gasto.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalGastos: { $sum: '$costo' },
          cantidadGastos: { $sum: 1 },
          promedioGasto: { $avg: '$costo' }
        }
      }
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

    res.json(createResponse(true, {
      data: gastosFormateados,
      resumen: resumen || { totalGastos: 0, cantidadGastos: 0, promedioGasto: 0 },
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

    // Formatear para que coincida con la interfaz ProductoVendido del frontend
    const productosFormateados = productosVendidos.map(item => ({
      producto: item._id.idProducto,
      nombre: item._id.nombreProducto,
      cantidadVendida: item.cantidadVendida,
      totalVendido: item.totalVentas
    }));

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

    // Formatear platillos
    const platillosFormateados = platillosVendidos.map(item => ({
      producto: item._id.idPlatillo,
      nombre: item._id.nombrePlatillo,
      cantidadVendida: item.cantidadVendida,
      totalVendido: item.totalVentas
    }));

    // Combinar productos y platillos en una sola lista
    const todosLosProductos = [
      ...productosFormateados,
      ...platillosFormateados
    ].sort((a, b) => b.cantidadVendida - a.cantidadVendida);

    res.json(createResponse(true, {
      data: todosLosProductos,
      productos: productosFormateados,
      platillos: platillosFormateados
    }));
  })
);

// GET /api/reportes/usuarios - Reporte de actividad de usuarios
router.get('/usuarios', authenticate, isEncargado, 
  asyncHandler(async (req: any, res: any) => {
    const { fechaInicio, fechaFin } = req.query;
    
    const filter: any = {};
    if (fechaInicio && fechaFin) {
      filter.fechaHora = {
        $gte: new Date(fechaInicio),
        $lte: new Date(fechaFin)
      };
    }

    // Ordenes por usuario
    const ordenesPorUsuario = await Orden.aggregate([
      { $match: { ...filter, estatus: OrdenStatus.ENTREGADA } },
      {
        $group: {
          _id: {
            idUsuario: '$idUsuario',
            nombreUsuario: '$nombreUsuario'
          },
          cantidadOrdenes: { $sum: 1 },
          totalVentas: { $sum: '$total' },
          promedioVenta: { $avg: '$total' }
        }
      },
      { $sort: { cantidadOrdenes: -1 } }
    ]);

    // Gastos por usuario
    const gastosPorUsuario = await Gasto.aggregate([
      { $match: fechaInicio && fechaFin ? { fecha: { $gte: new Date(fechaInicio), $lte: new Date(fechaFin) } } : {} },
      {
        $group: {
          _id: {
            idUsuario: '$idUsuario',
            nombreUsuario: '$nombreUsuario'
          },
          cantidadGastos: { $sum: 1 },
          totalGastos: { $sum: '$costo' }
        }
      },
      { $sort: { totalGastos: -1 } }
    ]);

    const reporteUsuarios = ordenesPorUsuario.map(orden => {
      const gastoUsuario = gastosPorUsuario.find(g => g._id.idUsuario === orden._id.idUsuario);
      return {
        usuario: orden._id.nombreUsuario || 'N/A',
        cantidadOrdenes: orden.cantidadOrdenes,
        totalVentas: orden.totalVentas,
        promedioVenta: orden.promedioVenta,
        cantidadGastos: gastoUsuario ? gastoUsuario.cantidadGastos : 0,
        totalGastos: gastoUsuario ? gastoUsuario.totalGastos : 0
      };
    });

    res.json(createResponse(true, {
      data: reporteUsuarios,
      ordenesPorUsuario,
      gastosPorUsuario
    }));
  })
);

// GET /api/reportes/mesas - Reporte de uso de mesas
router.get('/mesas', authenticate, isEncargado, 
  asyncHandler(async (req: any, res: any) => {
    const { fechaInicio, fechaFin } = req.query;
    
    const filter: any = {};
    if (fechaInicio && fechaFin) {
      filter.fechaHora = {
        $gte: new Date(fechaInicio),
        $lte: new Date(fechaFin)
      };
    }

    const mesasReporte = await Orden.aggregate([
      { $match: { ...filter, estatus: OrdenStatus.ENTREGADA } },
      {
        $group: {
          _id: {
            idMesa: '$idMesa',
            nombreMesa: '$nombreMesa'
          },
          cantidadOrdenes: { $sum: 1 },
          totalVentas: { $sum: '$total' },
          promedioVenta: { $avg: '$total' },
          tiempoPromedio: { $avg: { $subtract: ['$fechaEntrega', '$fechaHora'] } }
        }
      },
      { $sort: { cantidadOrdenes: -1 } }
    ]);

    const reporteMesas = mesasReporte.map(mesa => ({
      mesa: mesa._id.nombreMesa || `Mesa ${mesa._id.idMesa}`,
      cantidadOrdenes: mesa.cantidadOrdenes,
      totalVentas: mesa.totalVentas,
      promedioVenta: mesa.promedioVenta,
      tiempoPromedioMinutos: mesa.tiempoPromedio ? Math.round(mesa.tiempoPromedio / (1000 * 60)) : 0
    }));

    res.json(createResponse(true, {
      data: reporteMesas
    }));
  })
);

// GET /api/reportes/resumen - Resumen general del dashboard
router.get('/resumen', authenticate, isEncargado, 
  asyncHandler(async (req: any, res: any) => {
    const { fechaInicio, fechaFin } = req.query;
    
    const filter: any = {};
    if (fechaInicio && fechaFin) {
      filter.fechaHora = {
        $gte: new Date(fechaInicio),
        $lte: new Date(fechaFin)
      };
    }

    const [ventasResumen, gastosResumen, inventarioResumen, ordenesHoy] = await Promise.all([
      // Resumen de ventas
      Orden.aggregate([
        { $match: { ...filter, estatus: OrdenStatus.ENTREGADA } },
        {
          $group: {
            _id: null,
            totalVentas: { $sum: '$total' },
            cantidadOrdenes: { $sum: 1 },
            promedioVenta: { $avg: '$total' }
          }
        }
      ]),
      // Resumen de gastos
      Gasto.aggregate([
        { $match: fechaInicio && fechaFin ? { fecha: { $gte: new Date(fechaInicio), $lte: new Date(fechaFin) } } : {} },
        {
          $group: {
            _id: null,
            totalGastos: { $sum: '$costo' },
            cantidadGastos: { $sum: 1 }
          }
        }
      ]),
      // Resumen de inventario
      Producto.aggregate([
        { $match: { activo: true } },
        {
          $group: {
            _id: null,
            totalProductos: { $sum: 1 },
            stockBajo: { $sum: { $cond: [{ $lte: ['$cantidad', 5] }, 1, 0] } },
            valorInventario: { $sum: { $multiply: ['$cantidad', '$costo'] } }
          }
        }
      ]),
      // Órdenes de hoy
      Orden.countDocuments({
        fechaHora: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lte: new Date(new Date().setHours(23, 59, 59, 999))
        }
      })
    ]);

    const resumen = {
      ventas: ventasResumen[0] || { totalVentas: 0, cantidadOrdenes: 0, promedioVenta: 0 },
      gastos: gastosResumen[0] || { totalGastos: 0, cantidadGastos: 0 },
      inventario: inventarioResumen[0] || { totalProductos: 0, stockBajo: 0, valorInventario: 0 },
      ordenesHoy,
      utilidad: (ventasResumen[0]?.totalVentas || 0) - (gastosResumen[0]?.totalGastos || 0)
    };

    res.json(createResponse(true, {
      data: resumen
    }));
  })
);

export default router;