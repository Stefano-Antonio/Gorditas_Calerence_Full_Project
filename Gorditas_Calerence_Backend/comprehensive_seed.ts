// Comprehensive test data seeder for Gorditas Calerence
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Connect to MongoDB
mongoose.connect('mongodb://admin:admin123@localhost:27017/calerence_db?authSource=admin');

// Define schemas for seeding
const Usuario = mongoose.model('Usuario', new mongoose.Schema({
  nombre: String,
  email: String,
  password: String,
  idTipoUsuario: Number,
  nombreTipoUsuario: String,
  activo: Boolean
}, { timestamps: true, versionKey: false }));

const Mesa = mongoose.model('Mesa', new mongoose.Schema({
  _id: Number,
  nombre: String
}, { timestamps: true, versionKey: false }));

const TipoPlatillo = mongoose.model('TipoPlatillo', new mongoose.Schema({
  _id: Number,
  nombre: String,
  descripcion: String,
  activo: Boolean
}, { timestamps: true, versionKey: false }));

const Platillo = mongoose.model('Platillo', new mongoose.Schema({
  _id: Number,
  idTipoPlatillo: Number,
  nombreTipoPlatillo: String,
  nombre: String,
  descripcion: String,
  costo: Number,
  precio: Number,
  activo: Boolean
}, { timestamps: true, versionKey: false }));

const Guiso = mongoose.model('Guiso', new mongoose.Schema({
  _id: Number,
  nombre: String,
  descripcion: String,
  activo: Boolean
}, { timestamps: true, versionKey: false }));

const TipoUsuario = mongoose.model('TipoUsuario', new mongoose.Schema({
  _id: Number,
  nombre: String,
  descripcion: String
}, { timestamps: true, versionKey: false }));

const TipoProducto = mongoose.model('TipoProducto', new mongoose.Schema({
  _id: Number,
  nombre: String,
  descripcion: String,
  activo: Boolean
}, { timestamps: true, versionKey: false }));

const Producto = mongoose.model('Producto', new mongoose.Schema({
  _id: Number,
  idTipoProducto: Number,
  nombreTipoProducto: String,
  nombre: String,
  cantidad: Number,
  costo: Number,
  activo: Boolean
}, { timestamps: true, versionKey: false }));

const TipoExtra = mongoose.model('TipoExtra', new mongoose.Schema({
  _id: Number,
  nombre: String,
  descripcion: String,
  activo: Boolean
}, { timestamps: true, versionKey: false }));

const Extra = mongoose.model('Extra', new mongoose.Schema({
  _id: Number,
  idTipoExtra: Number,
  nombreTipoExtra: String,
  nombre: String,
  costo: Number,
  activo: Boolean
}, { timestamps: true, versionKey: false }));

const TipoGasto = mongoose.model('TipoGasto', new mongoose.Schema({
  _id: Number,
  nombre: String,
  descripcion: String,
  activo: Boolean
}, { timestamps: true, versionKey: false }));

const TipoOrden = mongoose.model('TipoOrden', new mongoose.Schema({
  _id: Number,
  nombre: String,
  descripcion: String,
  activo: Boolean
}, { timestamps: true, versionKey: false }));

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

async function clearAllData() {
  console.log('🗑️  Clearing existing data...');
  await Usuario.deleteMany({});
  await Mesa.deleteMany({});
  await TipoPlatillo.deleteMany({});
  await Platillo.deleteMany({});
  await Guiso.deleteMany({});
  await TipoUsuario.deleteMany({});
  await TipoProducto.deleteMany({});
  await Producto.deleteMany({});
  await TipoExtra.deleteMany({});
  await Extra.deleteMany({});
  await TipoGasto.deleteMany({});
  await TipoOrden.deleteMany({});
  await Orden.deleteMany({});
  await Suborden.deleteMany({});
  await OrdenDetalleProducto.deleteMany({});
  await OrdenDetallePlatillo.deleteMany({});
  await OrdenDetalleExtra.deleteMany({});
  await Gasto.deleteMany({});
  console.log('✅ Cleared existing data');
}

async function seedComprehensiveData() {
  try {
    await clearAllData();

    // 1. Create user types
    console.log('👥 Creating user types...');
    await TipoUsuario.insertMany([
      { _id: 1, nombre: 'Admin', descripcion: 'Administrador del sistema' },
      { _id: 2, nombre: 'Encargado', descripcion: 'Encargado del restaurante' },
      { _id: 3, nombre: 'Despachador', descripcion: 'Despachador de órdenes' },
      { _id: 4, nombre: 'Mesero', descripcion: 'Mesero del restaurante' },
      { _id: 5, nombre: 'Cocinero', descripcion: 'Cocinero del restaurante' }
    ]);

    // 2. Create comprehensive test users (15 users across all roles)
    console.log('👤 Creating comprehensive test users...');
    const hashedPassword = await bcrypt.hash('password123', 12);
    const hashedPasswordEncargado = await bcrypt.hash('encargado123', 12);
    
    await Usuario.insertMany([
      // Admins (3)
      {
        nombre: 'Juan Pérez - Encargado Principal',
        email: 'Encargado@gorditas.com',
        password: hashedPasswordEncargado,
        idTipoUsuario: 1,
        nombreTipoUsuario: 'Admin',
        activo: true
      },
      {
        nombre: 'María González - Admin Sistemas',
        email: 'admin@test.com',
        password: hashedPassword,
        idTipoUsuario: 1,
        nombreTipoUsuario: 'Admin',
        activo: true
      },
      {
        nombre: 'Carlos Rodríguez - Admin Backup',
        email: 'admin2@test.com',
        password: hashedPassword,
        idTipoUsuario: 1,
        nombreTipoUsuario: 'Admin',
        activo: true
      },
      
      // Meseros (4)
      {
        nombre: 'Ana Martínez - Mesero Senior',
        email: 'mesero1@test.com',
        password: hashedPassword,
        idTipoUsuario: 4,
        nombreTipoUsuario: 'Mesero',
        activo: true
      },
      {
        nombre: 'Luis Fernando - Mesero',
        email: 'mesero2@test.com',
        password: hashedPassword,
        idTipoUsuario: 4,
        nombreTipoUsuario: 'Mesero',
        activo: true
      },
      {
        nombre: 'Patricia López - Mesero',
        email: 'mesero3@test.com',
        password: hashedPassword,
        idTipoUsuario: 4,
        nombreTipoUsuario: 'Mesero',
        activo: true
      },
      {
        nombre: 'Roberto Silva - Mesero Jr',
        email: 'mesero4@test.com',
        password: hashedPassword,
        idTipoUsuario: 4,
        nombreTipoUsuario: 'Mesero',
        activo: false // Test inactive user
      },
      
      // Empleados/Cocineros (4)
      {
        nombre: 'Rosa Hernández - Cocinero Jefe',
        email: 'cocinero1@test.com',
        password: hashedPassword,
        idTipoUsuario: 5,
        nombreTipoUsuario: 'Cocinero',
        activo: true
      },
      {
        nombre: 'Miguel Torres - Cocinero',
        email: 'cocinero2@test.com',
        password: hashedPassword,
        idTipoUsuario: 5,
        nombreTipoUsuario: 'Cocinero',
        activo: true
      },
      {
        nombre: 'Carmen Díaz - Ayudante Cocina',
        email: 'cocinero3@test.com',
        password: hashedPassword,
        idTipoUsuario: 5,
        nombreTipoUsuario: 'Cocinero',
        activo: true
      },
      {
        nombre: 'Javier Morales - Cocinero',
        email: 'cocinero4@test.com',
        password: hashedPassword,
        idTipoUsuario: 5,
        nombreTipoUsuario: 'Cocinero',
        activo: true
      },
      
      // Despachadores/Encargados (4)
      {
        nombre: 'Sandra Vega - Despachador Senior',
        email: 'despachador@test.com',
        password: hashedPassword,
        idTipoUsuario: 3,
        nombreTipoUsuario: 'Despachador',
        activo: true
      },
      {
        nombre: 'Fernando Reyes - Cajero',
        email: 'cajero1@test.com',
        password: hashedPassword,
        idTipoUsuario: 2,
        nombreTipoUsuario: 'Encargado',
        activo: true
      },
      {
        nombre: 'Elena Castro - Despachador',
        email: 'despachador2@test.com',
        password: hashedPassword,
        idTipoUsuario: 3,
        nombreTipoUsuario: 'Despachador',
        activo: true
      },
      {
        nombre: 'David Ramírez - Encargado Turno',
        email: 'encargado2@test.com',
        password: hashedPassword,
        idTipoUsuario: 2,
        nombreTipoUsuario: 'Encargado',
        activo: true
      }
    ]);

    // 3. Create mesas (10 tables)
    console.log('🍽️  Creating tables...');
    await Mesa.insertMany([
      { _id: 1, nombre: 'Mesa 1 - Ventana' },
      { _id: 2, nombre: 'Mesa 2 - Centro' },
      { _id: 3, nombre: 'Mesa 3 - Esquina' },
      { _id: 4, nombre: 'Mesa 4 - Terraza' },
      { _id: 5, nombre: 'Mesa 5 - VIP' },
      { _id: 6, nombre: 'Mesa 6 - Familiar' },
      { _id: 7, nombre: 'Mesa 7 - Barra' },
      { _id: 8, nombre: 'Mesa 8 - Patio' },
      { _id: 9, nombre: 'Mesa 9 - Privada' },
      { _id: 10, nombre: 'Mesa 10 - Exterior' }
    ]);

    // 4. Create tipo platillos
    console.log('🍳 Creating dish types...');
    await TipoPlatillo.insertMany([
      { _id: 1, nombre: 'Gorditas', descripcion: 'Gorditas tradicionales', activo: true },
      { _id: 2, nombre: 'Quesadillas', descripcion: 'Quesadillas variadas', activo: true },
      { _id: 3, nombre: 'Sopes', descripcion: 'Sopes mexicanos', activo: true },
      { _id: 4, nombre: 'Tacos', descripcion: 'Tacos al gusto', activo: true },
      { _id: 5, nombre: 'Tortas', descripcion: 'Tortas mexicanas', activo: true },
      { _id: 6, nombre: 'Enchiladas', descripcion: 'Enchiladas rojas y verdes', activo: true }
    ]);

    // 5. Create guisos (20+ stews)
    console.log('🥘 Creating stews...');
    await Guiso.insertMany([
      { _id: 1, nombre: 'Chicharrón Prensado', descripcion: 'Chicharrón en salsa verde', activo: true },
      { _id: 2, nombre: 'Chorizo con Papa', descripcion: 'Chorizo guisado con papa', activo: true },
      { _id: 3, nombre: 'Pollo en Salsa Verde', descripcion: 'Pollo deshebrado en salsa verde', activo: true },
      { _id: 4, nombre: 'Pollo en Mole', descripcion: 'Pollo en mole poblano', activo: true },
      { _id: 5, nombre: 'Carnitas', descripcion: 'Carnitas de cerdo tradicionales', activo: true },
      { _id: 6, nombre: 'Barbacoa', descripcion: 'Barbacoa de borrego', activo: true },
      { _id: 7, nombre: 'Picadillo', descripcion: 'Picadillo de res con verduras', activo: true },
      { _id: 8, nombre: 'Frijoles Refritos', descripcion: 'Frijoles refritos tradicionales', activo: true },
      { _id: 9, nombre: 'Quelites', descripcion: 'Quelites con epazote', activo: true },
      { _id: 10, nombre: 'Flor de Calabaza', descripcion: 'Flores de calabaza guisadas', activo: true },
      { _id: 11, nombre: 'Huitlacoche', descripcion: 'Huitlacoche con epazote', activo: true },
      { _id: 12, nombre: 'Rajas con Queso', descripcion: 'Rajas de chile poblano con queso', activo: true },
      { _id: 13, nombre: 'Nopales', descripcion: 'Nopales tiernos guisados', activo: true },
      { _id: 14, nombre: 'Chicharrón en Salsa Roja', descripcion: 'Chicharrón en salsa de tomate', activo: true },
      { _id: 15, nombre: 'Tinga de Pollo', descripcion: 'Pollo deshebrado en tinga', activo: true },
      { _id: 16, nombre: 'Cochinita Pibil', descripcion: 'Cochinita pibil yucateca', activo: true },
      { _id: 17, nombre: 'Chiles Rellenos', descripcion: 'Chiles poblanos rellenos', activo: true },
      { _id: 18, nombre: 'Mole de Olla', descripcion: 'Res en mole de olla', activo: true },
      { _id: 19, nombre: 'Requesón con Calabaza', descripcion: 'Requesón con calabacitas', activo: true },
      { _id: 20, nombre: 'Pollo Adobado', descripcion: 'Pollo en adobo rojo', activo: true }
    ]);

    // 6. Create platillos (25+ dishes)
    console.log('🌮 Creating dishes...');
    await Platillo.insertMany([
      // Gorditas (5)
      { _id: 1, idTipoPlatillo: 1, nombreTipoPlatillo: 'Gorditas', nombre: 'Gordita de Chicharrón', descripcion: 'Gordita rellena de chicharrón prensado', costo: 25, precio: 35, activo: true },
      { _id: 2, idTipoPlatillo: 1, nombreTipoPlatillo: 'Gorditas', nombre: 'Gordita de Chorizo', descripcion: 'Gordita con chorizo y papa', costo: 22, precio: 32, activo: true },
      { _id: 3, idTipoPlatillo: 1, nombreTipoPlatillo: 'Gorditas', nombre: 'Gordita de Pollo', descripcion: 'Gordita de pollo en salsa verde', costo: 20, precio: 30, activo: true },
      { _id: 4, idTipoPlatillo: 1, nombreTipoPlatillo: 'Gorditas', nombre: 'Gordita de Carnitas', descripcion: 'Gordita de carnitas tradicionales', costo: 28, precio: 38, activo: true },
      { _id: 5, idTipoPlatillo: 1, nombreTipoPlatillo: 'Gorditas', nombre: 'Gordita de Frijoles', descripcion: 'Gordita de frijoles refritos', costo: 15, precio: 25, activo: true },
      
      // Quesadillas (5)
      { _id: 6, idTipoPlatillo: 2, nombreTipoPlatillo: 'Quesadillas', nombre: 'Quesadilla de Flor de Calabaza', descripcion: 'Quesadilla con flores de calabaza', costo: 18, precio: 28, activo: true },
      { _id: 7, idTipoPlatillo: 2, nombreTipoPlatillo: 'Quesadillas', nombre: 'Quesadilla de Huitlacoche', descripcion: 'Quesadilla de huitlacoche', costo: 20, precio: 30, activo: true },
      { _id: 8, idTipoPlatillo: 2, nombreTipoPlatillo: 'Quesadillas', nombre: 'Quesadilla de Quelites', descripcion: 'Quesadilla de quelites', costo: 16, precio: 26, activo: true },
      { _id: 9, idTipoPlatillo: 2, nombreTipoPlatillo: 'Quesadillas', nombre: 'Quesadilla de Rajas', descripcion: 'Quesadilla de rajas con queso', costo: 17, precio: 27, activo: true },
      { _id: 10, idTipoPlatillo: 2, nombreTipoPlatillo: 'Quesadillas', nombre: 'Quesadilla Simple', descripcion: 'Quesadilla solo de queso', costo: 12, precio: 22, activo: true },
      
      // Sopes (5)
      { _id: 11, idTipoPlatillo: 3, nombreTipoPlatillo: 'Sopes', nombre: 'Sope de Pollo', descripcion: 'Sope con pollo deshebrado', costo: 18, precio: 28, activo: true },
      { _id: 12, idTipoPlatillo: 3, nombreTipoPlatillo: 'Sopes', nombre: 'Sope de Carnitas', descripcion: 'Sope con carnitas', costo: 20, precio: 30, activo: true },
      { _id: 13, idTipoPlatillo: 3, nombreTipoPlatillo: 'Sopes', nombre: 'Sope de Chorizo', descripcion: 'Sope con chorizo', costo: 19, precio: 29, activo: true },
      { _id: 14, idTipoPlatillo: 3, nombreTipoPlatillo: 'Sopes', nombre: 'Sope de Frijoles', descripcion: 'Sope vegetariano de frijoles', costo: 15, precio: 25, activo: true },
      { _id: 15, idTipoPlatillo: 3, nombreTipoPlatillo: 'Sopes', nombre: 'Sope Mixto', descripcion: 'Sope con dos guisos', costo: 25, precio: 35, activo: true },
      
      // Tacos (5)
      { _id: 16, idTipoPlatillo: 4, nombreTipoPlatillo: 'Tacos', nombre: 'Tacos de Carnitas', descripcion: 'Orden de 3 tacos de carnitas', costo: 20, precio: 30, activo: true },
      { _id: 17, idTipoPlatillo: 4, nombreTipoPlatillo: 'Tacos', nombre: 'Tacos de Barbacoa', descripcion: 'Orden de 3 tacos de barbacoa', costo: 25, precio: 35, activo: true },
      { _id: 18, idTipoPlatillo: 4, nombreTipoPlatillo: 'Tacos', nombre: 'Tacos de Pollo', descripcion: 'Orden de 3 tacos de pollo', costo: 18, precio: 28, activo: true },
      { _id: 19, idTipoPlatillo: 4, nombreTipoPlatillo: 'Tacos', nombre: 'Tacos de Chorizo', descripcion: 'Orden de 3 tacos de chorizo', costo: 19, precio: 29, activo: true },
      { _id: 20, idTipoPlatillo: 4, nombreTipoPlatillo: 'Tacos', nombre: 'Tacos Dorados', descripcion: 'Tacos dorados con guiso', costo: 22, precio: 32, activo: true },
      
      // Tortas (3)
      { _id: 21, idTipoPlatillo: 5, nombreTipoPlatillo: 'Tortas', nombre: 'Torta de Carnitas', descripcion: 'Torta con carnitas', costo: 30, precio: 45, activo: true },
      { _id: 22, idTipoPlatillo: 5, nombreTipoPlatillo: 'Tortas', nombre: 'Torta de Pollo', descripcion: 'Torta de pollo empanizado', costo: 28, precio: 42, activo: true },
      { _id: 23, idTipoPlatillo: 5, nombreTipoPlatillo: 'Tortas', nombre: 'Torta Cubana', descripcion: 'Torta con varios ingredientes', costo: 35, precio: 50, activo: true },
      
      // Enchiladas (2)
      { _id: 24, idTipoPlatillo: 6, nombreTipoPlatillo: 'Enchiladas', nombre: 'Enchiladas Verdes', descripcion: 'Enchiladas en salsa verde', costo: 25, precio: 40, activo: true },
      { _id: 25, idTipoPlatillo: 6, nombreTipoPlatillo: 'Enchiladas', nombre: 'Enchiladas Rojas', descripcion: 'Enchiladas en salsa roja', costo: 25, precio: 40, activo: true }
    ]);

    // 7. Create product types
    console.log('🥤 Creating product types...');
    await TipoProducto.insertMany([
      { _id: 1, nombre: 'Bebidas', descripcion: 'Bebidas naturales y refrescos', activo: true },
      { _id: 2, nombre: 'Postres', descripcion: 'Postres caseros', activo: true },
      { _id: 3, nombre: 'Antojitos', descripcion: 'Antojitos mexicanos adicionales', activo: true },
      { _id: 4, nombre: 'Complementos', descripcion: 'Complementos para platillos', activo: true }
    ]);

    // 8. Create productos (25+ products)
    console.log('🧋 Creating products...');
    await Producto.insertMany([
      // Bebidas (8)
      { _id: 1, idTipoProducto: 1, nombreTipoProducto: 'Bebidas', nombre: 'Agua de Horchata', cantidad: 50, costo: 15, activo: true },
      { _id: 2, idTipoProducto: 1, nombreTipoProducto: 'Bebidas', nombre: 'Agua de Jamaica', cantidad: 50, costo: 15, activo: true },
      { _id: 3, idTipoProducto: 1, nombreTipoProducto: 'Bebidas', nombre: 'Agua de Tamarindo', cantidad: 50, costo: 15, activo: true },
      { _id: 4, idTipoProducto: 1, nombreTipoProducto: 'Bebidas', nombre: 'Agua de Limón', cantidad: 50, costo: 15, activo: true },
      { _id: 5, idTipoProducto: 1, nombreTipoProducto: 'Bebidas', nombre: 'Refresco Coca Cola', cantidad: 24, costo: 20, activo: true },
      { _id: 6, idTipoProducto: 1, nombreTipoProducto: 'Bebidas', nombre: 'Refresco Pepsi', cantidad: 24, costo: 20, activo: true },
      { _id: 7, idTipoProducto: 1, nombreTipoProducto: 'Bebidas', nombre: 'Agua Natural', cantidad: 100, costo: 12, activo: true },
      { _id: 8, idTipoProducto: 1, nombreTipoProducto: 'Bebidas', nombre: 'Café de Olla', cantidad: 30, costo: 18, activo: true },
      
      // Postres (7)
      { _id: 9, idTipoProducto: 2, nombreTipoProducto: 'Postres', nombre: 'Flan Napolitano', cantidad: 15, costo: 30, activo: true },
      { _id: 10, idTipoProducto: 2, nombreTipoProducto: 'Postres', nombre: 'Arroz con Leche', cantidad: 20, costo: 25, activo: true },
      { _id: 11, idTipoProducto: 2, nombreTipoProducto: 'Postres', nombre: 'Gelatina de Leche', cantidad: 25, costo: 20, activo: true },
      { _id: 12, idTipoProducto: 2, nombreTipoProducto: 'Postres', nombre: 'Pay de Queso', cantidad: 10, costo: 35, activo: true },
      { _id: 13, idTipoProducto: 2, nombreTipoProducto: 'Postres', nombre: 'Churros', cantidad: 40, costo: 15, activo: true },
      { _id: 14, idTipoProducto: 2, nombreTipoProducto: 'Postres', nombre: 'Buñuelos', cantidad: 30, costo: 18, activo: true },
      { _id: 15, idTipoProducto: 2, nombreTipoProducto: 'Postres', nombre: 'Tres Leches', cantidad: 12, costo: 40, activo: true },
      
      // Antojitos (5)
      { _id: 16, idTipoProducto: 3, nombreTipoProducto: 'Antojitos', nombre: 'Elote Desgranado', cantidad: 20, costo: 25, activo: true },
      { _id: 17, idTipoProducto: 3, nombreTipoProducto: 'Antojitos', nombre: 'Esquites', cantidad: 20, costo: 20, activo: true },
      { _id: 18, idTipoProducto: 3, nombreTipoProducto: 'Antojitos', nombre: 'Tostilocos', cantidad: 15, costo: 30, activo: true },
      { _id: 19, idTipoProducto: 3, nombreTipoProducto: 'Antojitos', nombre: 'Chicharrones', cantidad: 25, costo: 22, activo: true },
      { _id: 20, idTipoProducto: 3, nombreTipoProducto: 'Antojitos', nombre: 'Palomitas', cantidad: 30, costo: 18, activo: true },
      
      // Complementos (5)
      { _id: 21, idTipoProducto: 4, nombreTipoProducto: 'Complementos', nombre: 'Salsa Verde Extra', cantidad: 100, costo: 5, activo: true },
      { _id: 22, idTipoProducto: 4, nombreTipoProducto: 'Complementos', nombre: 'Salsa Roja Extra', cantidad: 100, costo: 5, activo: true },
      { _id: 23, idTipoProducto: 4, nombreTipoProducto: 'Complementos', nombre: 'Crema', cantidad: 50, costo: 8, activo: true },
      { _id: 24, idTipoProducto: 4, nombreTipoProducto: 'Complementos', nombre: 'Queso Rallado', cantidad: 40, costo: 10, activo: true },
      { _id: 25, idTipoProducto: 4, nombreTipoProducto: 'Complementos', nombre: 'Tortillas Extra', cantidad: 200, costo: 3, activo: true }
    ]);

    // 9. Create extra types
    console.log('➕ Creating extra types...');
    await TipoExtra.insertMany([
      { _id: 1, nombre: 'Quesos', descripcion: 'Tipos de queso adicionales', activo: true },
      { _id: 2, nombre: 'Verduras', descripcion: 'Verduras adicionales', activo: true },
      { _id: 3, nombre: 'Salsas', descripcion: 'Salsas especiales', activo: true },
      { _id: 4, nombre: 'Proteínas', descripcion: 'Proteínas adicionales', activo: true }
    ]);

    // 10. Create extras (15+ extras)
    console.log('🧀 Creating extras...');
    await Extra.insertMany([
      // Quesos (4)
      { _id: 1, idTipoExtra: 1, nombreTipoExtra: 'Quesos', nombre: 'Queso Oaxaca', costo: 10, activo: true },
      { _id: 2, idTipoExtra: 1, nombreTipoExtra: 'Quesos', nombre: 'Queso Panela', costo: 8, activo: true },
      { _id: 3, idTipoExtra: 1, nombreTipoExtra: 'Quesos', nombre: 'Queso Manchego', costo: 12, activo: true },
      { _id: 4, idTipoExtra: 1, nombreTipoExtra: 'Quesos', nombre: 'Queso Fresco', costo: 7, activo: true },
      
      // Verduras (4)
      { _id: 5, idTipoExtra: 2, nombreTipoExtra: 'Verduras', nombre: 'Aguacate', costo: 15, activo: true },
      { _id: 6, idTipoExtra: 2, nombreTipoExtra: 'Verduras', nombre: 'Cebolla Morada', costo: 5, activo: true },
      { _id: 7, idTipoExtra: 2, nombreTipoExtra: 'Verduras', nombre: 'Cilantro', costo: 3, activo: true },
      { _id: 8, idTipoExtra: 2, nombreTipoExtra: 'Verduras', nombre: 'Lechuga', costo: 4, activo: true },
      
      // Salsas (4)
      { _id: 9, idTipoExtra: 3, nombreTipoExtra: 'Salsas', nombre: 'Salsa Chipotle', costo: 6, activo: true },
      { _id: 10, idTipoExtra: 3, nombreTipoExtra: 'Salsas', nombre: 'Salsa Habanero', costo: 8, activo: true },
      { _id: 11, idTipoExtra: 3, nombreTipoExtra: 'Salsas', nombre: 'Salsa de Chile de Árbol', costo: 7, activo: true },
      { _id: 12, idTipoExtra: 3, nombreTipoExtra: 'Salsas', nombre: 'Pico de Gallo', costo: 10, activo: true },
      
      // Proteínas (3)
      { _id: 13, idTipoExtra: 4, nombreTipoExtra: 'Proteínas', nombre: 'Huevo Frito', costo: 12, activo: true },
      { _id: 14, idTipoExtra: 4, nombreTipoExtra: 'Proteínas', nombre: 'Tocino', costo: 15, activo: true },
      { _id: 15, idTipoExtra: 4, nombreTipoExtra: 'Proteínas', nombre: 'Chorizo Extra', costo: 18, activo: true }
    ]);

    // 11. Create expense types
    console.log('💰 Creating expense types...');
    await TipoGasto.insertMany([
      { _id: 1, nombre: 'Insumos', descripcion: 'Compra de ingredientes y materias primas', activo: true },
      { _id: 2, nombre: 'Servicios', descripcion: 'Luz, agua, gas, internet', activo: true },
      { _id: 3, nombre: 'Salarios', descripcion: 'Pago de empleados', activo: true },
      { _id: 4, nombre: 'Mantenimiento', descripcion: 'Reparaciones y mantenimiento', activo: true },
      { _id: 5, nombre: 'Marketing', descripcion: 'Publicidad y promociones', activo: true },
      { _id: 6, nombre: 'Otros', descripcion: 'Gastos diversos', activo: true }
    ]);

    // 12. Create order types
    console.log('📋 Creating order types...');
    await TipoOrden.insertMany([
      { _id: 1, nombre: 'Mesa', descripcion: 'Orden para comer en el restaurante', activo: true },
      { _id: 2, nombre: 'Para llevar', descripcion: 'Orden para llevar', activo: true },
      { _id: 3, nombre: 'Domicilio', descripcion: 'Orden a domicilio', activo: true }
    ]);

    console.log('✅ Comprehensive test data created successfully!');
    console.log('📊 Summary:');
    console.log(`   👥 Users: ${await Usuario.countDocuments()}`);
    console.log(`   🍽️  Tables: ${await Mesa.countDocuments()}`);
    console.log(`   🌮 Dishes: ${await Platillo.countDocuments()}`);
    console.log(`   🥘 Stews: ${await Guiso.countDocuments()}`);
    console.log(`   🧋 Products: ${await Producto.countDocuments()}`);
    console.log(`   ➕ Extras: ${await Extra.countDocuments()}`);

  } catch (error) {
    console.error('❌ Error seeding comprehensive data:', error);
  } finally {
    await mongoose.connection.close();
  }
}

// Run the seeder
seedComprehensiveData();