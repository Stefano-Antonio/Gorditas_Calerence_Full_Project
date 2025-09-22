// Orders and financial data seeder for comprehensive testing
import mongoose from 'mongoose';

// Connect to MongoDB
mongoose.connect('mongodb://admin:admin123@localhost:27017/calerence_db?authSource=admin');

// Define schemas for orders and financial data
const Orden = mongoose.model('Orden', new mongoose.Schema({
  folio: String,
  idTipoOrden: Number,
  nombreTipoOrden: String,
  idMesa: Number,
  nombreMesa: String,
  nombreCliente: String,
  total: Number,
  estatus: String,
  notas: String,
  fechaHora: Date
}, { timestamps: true, versionKey: false }));

const Suborden = mongoose.model('Suborden', new mongoose.Schema({
  idOrden: String,
  total: Number
}, { timestamps: true, versionKey: false }));

const OrdenDetalleProducto = mongoose.model('OrdenDetalleProducto', new mongoose.Schema({
  idOrden: String,
  idProducto: Number,
  nombreProducto: String,
  costoProducto: Number,
  cantidad: Number,
  importe: Number,
  listo: Boolean,
  entregado: Boolean
}, { timestamps: true, versionKey: false }));

const OrdenDetallePlatillo = mongoose.model('OrdenDetallePlatillo', new mongoose.Schema({
  idSuborden: String,
  idPlatillo: Number,
  nombrePlatillo: String,
  idGuiso: Number,
  nombreGuiso: String,
  costoPlatillo: Number,
  cantidad: Number,
  importe: Number,
  notas: String,
  listo: Boolean,
  entregado: Boolean
}, { timestamps: true, versionKey: false }));

const OrdenDetalleExtra = mongoose.model('OrdenDetalleExtra', new mongoose.Schema({
  idOrdenDetallePlatillo: String,
  idExtra: Number,
  nombreExtra: String,
  costoExtra: Number,
  cantidad: Number,
  importe: Number
}, { timestamps: true, versionKey: false }));

const Gasto = mongoose.model('Gasto', new mongoose.Schema({
  nombre: String,
  idTipoGasto: Number,
  nombreTipoGasto: String,
  gastoTotal: Number,
  descripcion: String,
  fecha: Date
}, { timestamps: true, versionKey: false }));

// Helper functions
function getRandomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function generateOrdersAndFinancialData() {
  try {
    console.log('🗑️  Clearing existing orders and financial data...');
    await Orden.deleteMany({});
    await Suborden.deleteMany({});
    await OrdenDetalleProducto.deleteMany({});
    await OrdenDetallePlatillo.deleteMany({});
    await OrdenDetalleExtra.deleteMany({});
    await Gasto.deleteMany({});

    // Data for generating realistic orders
    const tiposOrden = [
      { id: 1, nombre: 'Mesa' },
      { id: 2, nombre: 'Para llevar' },
      { id: 3, nombre: 'Domicilio' }
    ];

    const mesas = [
      { id: 1, nombre: 'Mesa 1 - Ventana' },
      { id: 2, nombre: 'Mesa 2 - Centro' },
      { id: 3, nombre: 'Mesa 3 - Esquina' },
      { id: 4, nombre: 'Mesa 4 - Terraza' },
      { id: 5, nombre: 'Mesa 5 - VIP' },
      { id: 6, nombre: 'Mesa 6 - Familiar' },
      { id: 7, nombre: 'Mesa 7 - Barra' },
      { id: 8, nombre: 'Mesa 8 - Patio' },
      { id: 9, nombre: 'Mesa 9 - Privada' },
      { id: 10, nombre: 'Mesa 10 - Exterior' }
    ];

    const platillos = [
      { id: 1, nombre: 'Gordita de Chicharrón', precio: 35, guiso: { id: 1, nombre: 'Chicharrón Prensado' } },
      { id: 2, nombre: 'Gordita de Chorizo', precio: 32, guiso: { id: 2, nombre: 'Chorizo con Papa' } },
      { id: 3, nombre: 'Gordita de Pollo', precio: 30, guiso: { id: 3, nombre: 'Pollo en Salsa Verde' } },
      { id: 4, nombre: 'Gordita de Carnitas', precio: 38, guiso: { id: 5, nombre: 'Carnitas' } },
      { id: 5, nombre: 'Gordita de Frijoles', precio: 25, guiso: { id: 8, nombre: 'Frijoles Refritos' } },
      { id: 6, nombre: 'Quesadilla de Flor de Calabaza', precio: 28, guiso: { id: 10, nombre: 'Flor de Calabaza' } },
      { id: 7, nombre: 'Quesadilla de Huitlacoche', precio: 30, guiso: { id: 11, nombre: 'Huitlacoche' } },
      { id: 8, nombre: 'Quesadilla de Quelites', precio: 26, guiso: { id: 9, nombre: 'Quelites' } },
      { id: 9, nombre: 'Quesadilla de Rajas', precio: 27, guiso: { id: 12, nombre: 'Rajas con Queso' } },
      { id: 10, nombre: 'Quesadilla Simple', precio: 22, guiso: { id: 8, nombre: 'Frijoles Refritos' } },
      { id: 11, nombre: 'Sope de Pollo', precio: 28, guiso: { id: 3, nombre: 'Pollo en Salsa Verde' } },
      { id: 12, nombre: 'Sope de Carnitas', precio: 30, guiso: { id: 5, nombre: 'Carnitas' } },
      { id: 13, nombre: 'Sope de Chorizo', precio: 29, guiso: { id: 2, nombre: 'Chorizo con Papa' } },
      { id: 14, nombre: 'Sope de Frijoles', precio: 25, guiso: { id: 8, nombre: 'Frijoles Refritos' } },
      { id: 15, nombre: 'Sope Mixto', precio: 35, guiso: { id: 1, nombre: 'Chicharrón Prensado' } },
      { id: 16, nombre: 'Tacos de Carnitas', precio: 30, guiso: { id: 5, nombre: 'Carnitas' } },
      { id: 17, nombre: 'Tacos de Barbacoa', precio: 35, guiso: { id: 6, nombre: 'Barbacoa' } },
      { id: 18, nombre: 'Tacos de Pollo', precio: 28, guiso: { id: 3, nombre: 'Pollo en Salsa Verde' } },
      { id: 19, nombre: 'Tacos de Chorizo', precio: 29, guiso: { id: 2, nombre: 'Chorizo con Papa' } },
      { id: 20, nombre: 'Tacos Dorados', precio: 32, guiso: { id: 7, nombre: 'Picadillo' } }
    ];

    const productos = [
      { id: 1, nombre: 'Agua de Horchata', costo: 15 },
      { id: 2, nombre: 'Agua de Jamaica', costo: 15 },
      { id: 3, nombre: 'Agua de Tamarindo', costo: 15 },
      { id: 4, nombre: 'Agua de Limón', costo: 15 },
      { id: 5, nombre: 'Refresco Coca Cola', costo: 20 },
      { id: 6, nombre: 'Refresco Pepsi', costo: 20 },
      { id: 7, nombre: 'Agua Natural', costo: 12 },
      { id: 8, nombre: 'Café de Olla', costo: 18 },
      { id: 9, nombre: 'Flan Napolitano', costo: 30 },
      { id: 10, nombre: 'Arroz con Leche', costo: 25 }
    ];

    const extras = [
      { id: 1, nombre: 'Queso Oaxaca', costo: 10 },
      { id: 2, nombre: 'Queso Panela', costo: 8 },
      { id: 5, nombre: 'Aguacate', costo: 15 },
      { id: 6, nombre: 'Cebolla Morada', costo: 5 },
      { id: 9, nombre: 'Salsa Chipotle', costo: 6 },
      { id: 10, nombre: 'Salsa Habanero', costo: 8 },
      { id: 13, nombre: 'Huevo Frito', costo: 12 },
      { id: 14, nombre: 'Tocino', costo: 15 }
    ];

    const estatusOrdenes = ['Recepcion', 'Preparacion', 'Surtida', 'Entregada', 'Pagada'];
    const nombreClientes = [
      'María González', 'Juan Pérez', 'Ana López', 'Carlos Rodríguez', 'Laura Martínez',
      'Pedro Sánchez', 'Carmen Díaz', 'Luis Hernández', 'Rosa Torres', 'Miguel Vega',
      'Patricia Castro', 'Roberto Silva', 'Elena Morales', 'Fernando Reyes', 'Sandra Ramírez',
      'David Torres', 'Lucía Jiménez', 'Alejandro Ruiz', 'Valentina Moreno', 'Sebastián Cruz'
    ];

    const notasOrdenes = [
      '', 'Sin cilantro', 'Extra picante', 'Sin cebolla', 'Para llevar en 15 minutos',
      'Mesa de cumpleaños', 'Orden urgente', 'Cliente frecuente', 'Sin salsa', 'Bien caliente'
    ];

    const notasPlatillos = [
      '', 'Sin chile', 'Extra queso', 'Bien doradito', 'Sin grasa',
      'Picante', 'Poca sal', 'Extra grande', 'Para niño', 'Especial'
    ];

    // Generate 75 orders over the last 30 days
    console.log('📋 Creating test orders...');
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const ordenes: any[] = [];
    let folioCounter = 1;

    for (let i = 0; i < 75; i++) {
      const tipoOrden = getRandomElement(tiposOrden);
      const mesa = tipoOrden.id === 1 ? getRandomElement(mesas) : null; // Solo asignar mesa si es tipo "Mesa"
      const cliente = getRandomElement(nombreClientes);
      const estatus = getRandomElement(estatusOrdenes);
      const fecha = getRandomDate(startDate, endDate);
      const notas = getRandomElement(notasOrdenes);

      const orden = {
        _id: new mongoose.Types.ObjectId(),
        folio: `GC${folioCounter.toString().padStart(4, '0')}`,
        idTipoOrden: tipoOrden.id,
        nombreTipoOrden: tipoOrden.nombre,
        idMesa: mesa?.id || null,
        nombreMesa: mesa?.nombre || '',
        nombreCliente: cliente,
        total: 0, // Will be calculated
        estatus,
        notas,
        fechaHora: fecha,
        createdAt: fecha,
        updatedAt: fecha
      };

      ordenes.push(orden);
      folioCounter++;
    }

    await Orden.insertMany(ordenes);

    // Generate suborders, products, dishes and extras for each order
    console.log('🍽️  Creating order details...');
    
    for (const orden of ordenes) {
      let totalOrden = 0;

      // Generate suborder (each order has 1 suborder)
      const suborden = {
        _id: new mongoose.Types.ObjectId(),
        idOrden: orden._id.toString(),
        total: 0 // Will be calculated
      };

      await Suborden.create(suborden);

      // Add 1-3 products per order (randomly)
      const numProductos = getRandomInt(1, 3);
      for (let j = 0; j < numProductos; j++) {
        const producto = getRandomElement(productos);
        const cantidad = getRandomInt(1, 3);
        const importe = producto.costo * cantidad;

        await OrdenDetalleProducto.create({
          idOrden: orden._id.toString(),
          idProducto: producto.id,
          nombreProducto: producto.nombre,
          costoProducto: producto.costo,
          cantidad,
          importe,
          listo: ['Surtida', 'Entregada', 'Pagada'].includes(orden.estatus),
          entregado: ['Entregada', 'Pagada'].includes(orden.estatus)
        });

        totalOrden += importe;
      }

      // Add 1-4 dishes per order
      const numPlatillos = getRandomInt(1, 4);
      const platillosUsados: number[] = [];
      
      for (let j = 0; j < numPlatillos; j++) {
        let platillo;
        do {
          platillo = getRandomElement(platillos);
        } while (platillosUsados.includes(platillo.id));
        
        platillosUsados.push(platillo.id);
        
        const cantidad = getRandomInt(1, 2);
        const importe = platillo.precio * cantidad;
        const notas = getRandomElement(notasPlatillos);

        const detallePlatillo = {
          _id: new mongoose.Types.ObjectId(),
          idSuborden: suborden._id.toString(),
          idPlatillo: platillo.id,
          nombrePlatillo: platillo.nombre,
          idGuiso: platillo.guiso.id,
          nombreGuiso: platillo.guiso.nombre,
          costoPlatillo: platillo.precio,
          cantidad,
          importe,
          notas,
          listo: ['Surtida', 'Entregada', 'Pagada'].includes(orden.estatus),
          entregado: ['Entregada', 'Pagada'].includes(orden.estatus)
        };

        await OrdenDetallePlatillo.create(detallePlatillo);

        // Add 0-2 extras per dish (randomly)
        const numExtras = getRandomInt(0, 2);
        for (let k = 0; k < numExtras; k++) {
          const extra = getRandomElement(extras);
          const cantidadExtra = 1;
          const importeExtra = extra.costo * cantidadExtra;

          await OrdenDetalleExtra.create({
            idOrdenDetallePlatillo: detallePlatillo._id.toString(),
            idExtra: extra.id,
            nombreExtra: extra.nombre,
            costoExtra: extra.costo,
            cantidad: cantidadExtra,
            importe: importeExtra
          });

          totalOrden += importeExtra;
        }

        totalOrden += importe;
      }

      // Update order and suborder totals
      await Orden.findByIdAndUpdate(orden._id, { total: totalOrden });
      await Suborden.findByIdAndUpdate(suborden._id, { total: totalOrden });
    }

    // Generate expenses for the last 30 days
    console.log('💰 Creating expense data...');
    const tiposGasto = [
      { id: 1, nombre: 'Insumos' },
      { id: 2, nombre: 'Servicios' },
      { id: 3, nombre: 'Salarios' },
      { id: 4, nombre: 'Mantenimiento' },
      { id: 5, nombre: 'Marketing' },
      { id: 6, nombre: 'Otros' }
    ];

    const gastosEjemplo = {
      1: ['Compra de masa para tortillas', 'Verduras frescas', 'Carne de res', 'Quesos varios', 'Especias y condimentos'],
      2: ['Recibo de luz', 'Factura de gas', 'Internet y teléfono', 'Agua potable', 'Servicio de limpieza'],
      3: ['Pago quincenal empleados', 'Aguinaldo', 'Horas extra fin de semana', 'Seguro social'],
      4: ['Reparación estufa', 'Cambio de aceite extractores', 'Mantenimiento refrigerador', 'Plomería'],
      5: ['Volantes promocionales', 'Publicidad Facebook', 'Descuentos especiales', 'Material promocional'],
      6: ['Útiles de oficina', 'Productos de limpieza', 'Uniformes', 'Transporte mercancía']
    };

    const gastos = [];
    for (let i = 0; i < 40; i++) {
      const tipoGasto = getRandomElement(tiposGasto);
      const nombresGasto = gastosEjemplo[tipoGasto.id as keyof typeof gastosEjemplo];
      const nombreGasto = getRandomElement(nombresGasto);
      const fecha = getRandomDate(startDate, endDate);
      
      let monto;
      switch (tipoGasto.id) {
        case 1: // Insumos
          monto = getRandomInt(200, 1500);
          break;
        case 2: // Servicios
          monto = getRandomInt(300, 800);
          break;
        case 3: // Salarios
          monto = getRandomInt(2000, 6000);
          break;
        case 4: // Mantenimiento
          monto = getRandomInt(150, 1200);
          break;
        case 5: // Marketing
          monto = getRandomInt(100, 500);
          break;
        case 6: // Otros
          monto = getRandomInt(50, 300);
          break;
        default:
          monto = getRandomInt(100, 500);
      }

      gastos.push({
        nombre: nombreGasto,
        idTipoGasto: tipoGasto.id,
        nombreTipoGasto: tipoGasto.nombre,
        gastoTotal: monto,
        descripcion: `${nombreGasto} del ${fecha.toLocaleDateString()}`,
        fecha,
        createdAt: fecha,
        updatedAt: fecha
      });
    }

    await Gasto.insertMany(gastos);

    console.log('✅ Orders and financial data created successfully!');
    console.log('📊 Summary:');
    console.log(`   📋 Orders: ${await Orden.countDocuments()}`);
    console.log(`   🥘 Suborders: ${await Suborden.countDocuments()}`);
    console.log(`   🧋 Product details: ${await OrdenDetalleProducto.countDocuments()}`);
    console.log(`   🌮 Dish details: ${await OrdenDetallePlatillo.countDocuments()}`);
    console.log(`   ➕ Extra details: ${await OrdenDetalleExtra.countDocuments()}`);
    console.log(`   💰 Expenses: ${await Gasto.countDocuments()}`);

    // Show status distribution
    const statusCounts = await Orden.aggregate([
      { $group: { _id: '$estatus', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    console.log('📈 Order status distribution:');
    statusCounts.forEach(status => {
      console.log(`   ${status._id}: ${status.count} orders`);
    });

  } catch (error) {
    console.error('❌ Error generating orders and financial data:', error);
  } finally {
    await mongoose.connection.close();
  }
}

// Run the generator
generateOrdersAndFinancialData();