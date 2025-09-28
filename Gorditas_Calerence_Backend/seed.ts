// Simple script to create test data
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Connect to MongoDB (using Docker Compose connection)
mongoose.connect('mongodb://admin:admin123@localhost:27017/calerence_db?authSource=admin');

// Simple schemas for seeding
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
  nombre: String,
  descripcion: String,
  costo: Number,
  idTipoExtra: Number,
  activo: Boolean
}, { timestamps: true, versionKey: false }));

async function seedData() {
  try {
    // Clear existing data
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


    // Create user types first
    await TipoUsuario.insertMany([
      { _id: 1, nombre: 'Admin', descripcion: 'Administrador del sistema' },
      { _id: 2, nombre: 'Encargado', descripcion: 'Encargado del restaurante' },
      { _id: 3, nombre: 'Despachador', descripcion: 'Despachador de órdenes' },
      { _id: 4, nombre: 'Mesero', descripcion: 'Mesero del restaurante' },
      { _id: 5, nombre: 'Cocinero', descripcion: 'Cocinero del restaurante' }
    ]);


    // Create test users including required Encargado and Despachador
    const hashedPasswordAdmin = await bcrypt.hash('password123', 12);
    const hashedPasswordEncargado = await bcrypt.hash('encargado123', 12);
    
    await Usuario.insertMany([
      {
        nombre: 'Admin Test',
        email: 'admin@test.com',
        password: hashedPasswordAdmin,
        idTipoUsuario: 1,
        nombreTipoUsuario: 'Admin',
        activo: true
      },
      {
        nombre: 'Juan Pérez - Encargado',
        email: 'Encargado@gorditas.com',
        password: hashedPasswordEncargado,
        idTipoUsuario: 1,
        nombreTipoUsuario: 'Admin',
        activo: true
      },
      {
        nombre: 'María García - Despachador',
        email: 'despachador@test.com',
        password: hashedPasswordAdmin,
        idTipoUsuario: 3,
        nombreTipoUsuario: 'Despachador',
        activo: true
      }
    ]);


    // Create mesas
    await Mesa.insertMany([
      { _id: 1, nombre: 'Mesa 1' },
      { _id: 2, nombre: 'Mesa 2' },
      { _id: 3, nombre: 'Mesa 3' },
      { _id: 4, nombre: 'Mesa 4' },
      { _id: 5, nombre: 'Mesa 5' }
    ]);


    // Create tipo platillos
    await TipoPlatillo.insertMany([
      { _id: 1, nombre: 'Gorditas', descripcion: 'Gorditas tradicionales', activo: true },
      { _id: 2, nombre: 'Quesadillas', descripcion: 'Quesadillas de maíz', activo: true }
    ]);


    // Create 5 guisos for testing
    await Guiso.insertMany([
      { _id: 1, nombre: 'Chicharrón Prensado', descripcion: 'Chicharrón en salsa verde', activo: true },
      { _id: 2, nombre: 'Pollo en Mole', descripcion: 'Pollo bañado en mole poblano', activo: true },
      { _id: 3, nombre: 'Carnitas', descripcion: 'Carne de cerdo confitada', activo: true },
      { _id: 4, nombre: 'Requesón', descripcion: 'Queso requesón con hierbas', activo: true },
      { _id: 5, nombre: 'Frijoles Refritos', descripcion: 'Frijoles refritos con especias', activo: true }
    ]);


    // Create 5 platillos of each type for testing
    await Platillo.insertMany([
      // Gorditas (5 examples)
      { 
        _id: 1, 
        idTipoPlatillo: 1, 
        nombreTipoPlatillo: 'Gorditas',
        nombre: 'Gordita Sencilla', 
        descripcion: 'Gordita de maíz rellena', 
        costo: 25, 
        precio: 25,
        activo: true 
      },
      { 
        _id: 2, 
        idTipoPlatillo: 1, 
        nombreTipoPlatillo: 'Gorditas',
        nombre: 'Gordita Especial', 
        descripcion: 'Gordita con extra ingredientes', 
        costo: 35, 
        precio: 35,
        activo: true 
      },
      { 
        _id: 3, 
        idTipoPlatillo: 1, 
        nombreTipoPlatillo: 'Gorditas',
        nombre: 'Gordita Doble', 
        descripcion: 'Gordita con doble relleno', 
        costo: 45, 
        precio: 45,
        activo: true 
      },
      { 
        _id: 4, 
        idTipoPlatillo: 1, 
        nombreTipoPlatillo: 'Gorditas',
        nombre: 'Gordita de Chicharrón', 
        descripcion: 'Gordita especialidad con chicharrón', 
        costo: 40, 
        precio: 40,
        activo: true 
      },
      { 
        _id: 5, 
        idTipoPlatillo: 1, 
        nombreTipoPlatillo: 'Gorditas',
        nombre: 'Gordita Mixta', 
        descripcion: 'Gordita con guisos mixtos', 
        costo: 50, 
        precio: 50,
        activo: true 
      },
      // Quesadillas (5 examples)
      { 
        _id: 6, 
        idTipoPlatillo: 2, 
        nombreTipoPlatillo: 'Quesadillas',
        nombre: 'Quesadilla Chica', 
        descripcion: 'Quesadilla pequeña', 
        costo: 20, 
        precio: 20,
        activo: true 
      },
      { 
        _id: 7, 
        idTipoPlatillo: 2, 
        nombreTipoPlatillo: 'Quesadillas',
        nombre: 'Quesadilla Grande', 
        descripcion: 'Quesadilla familiar', 
        costo: 30, 
        precio: 30,
        activo: true 
      },
      { 
        _id: 8, 
        idTipoPlatillo: 2, 
        nombreTipoPlatillo: 'Quesadillas',
        nombre: 'Quesadilla de Flor de Calabaza', 
        descripcion: 'Quesadilla con flor de calabaza', 
        costo: 35, 
        precio: 35,
        activo: true 
      },
      { 
        _id: 9, 
        idTipoPlatillo: 2, 
        nombreTipoPlatillo: 'Quesadillas',
        nombre: 'Quesadilla de Huitlacoche', 
        descripcion: 'Quesadilla con huitlacoche', 
        costo: 40, 
        precio: 40,
        activo: true 
      },
      { 
        _id: 10, 
        idTipoPlatillo: 2, 
        nombreTipoPlatillo: 'Quesadillas',
        nombre: 'Quesadilla Oaxaqueña', 
        descripcion: 'Quesadilla estilo Oaxaca', 
        costo: 45, 
        precio: 45,
        activo: true 
      }
    ]);


    // Create product types
    await TipoProducto.insertMany([
      { _id: 1, nombre: 'Bebidas', descripcion: 'Bebidas frías y calientes', activo: true },
      { _id: 2, nombre: 'Postres', descripcion: 'Postres y dulces', activo: true },
      { _id: 3, nombre: 'Antojitos', descripcion: 'Antojitos mexicanos', activo: true }
    ]);


    // Create 5 productos of each type for testing
    await Producto.insertMany([
      // Bebidas (5 examples)
      { 
        _id: 1, 
        idTipoProducto: 1, 
        nombreTipoProducto: 'Bebidas',
        nombre: 'Agua de Horchata', 
        cantidad: 50, 
        costo: 15, 
        activo: true 
      },
      { 
        _id: 2, 
        idTipoProducto: 1, 
        nombreTipoProducto: 'Bebidas',
        nombre: 'Agua de Jamaica', 
        cantidad: 50, 
        costo: 15, 
        activo: true 
      },
      { 
        _id: 3, 
        idTipoProducto: 1, 
        nombreTipoProducto: 'Bebidas',
        nombre: 'Refresco de Cola', 
        cantidad: 30, 
        costo: 20, 
        activo: true 
      },
      { 
        _id: 4, 
        idTipoProducto: 1, 
        nombreTipoProducto: 'Bebidas',
        nombre: 'Café de Olla', 
        cantidad: 25, 
        costo: 12, 
        activo: true 
      },
      { 
        _id: 5, 
        idTipoProducto: 1, 
        nombreTipoProducto: 'Bebidas',
        nombre: 'Cerveza', 
        cantidad: 40, 
        costo: 25, 
        activo: true 
      },
      // Postres (5 examples)
      { 
        _id: 6, 
        idTipoProducto: 2, 
        nombreTipoProducto: 'Postres',
        nombre: 'Flan Napolitano', 
        cantidad: 15, 
        costo: 30, 
        activo: true 
      },
      { 
        _id: 7, 
        idTipoProducto: 2, 
        nombreTipoProducto: 'Postres',
        nombre: 'Arroz con Leche', 
        cantidad: 20, 
        costo: 25, 
        activo: true 
      },
      { 
        _id: 8, 
        idTipoProducto: 2, 
        nombreTipoProducto: 'Postres',
        nombre: 'Gelatina de Leche', 
        cantidad: 25, 
        costo: 20, 
        activo: true 
      },
      { 
        _id: 9, 
        idTipoProducto: 2, 
        nombreTipoProducto: 'Postres',
        nombre: 'Pay de Queso', 
        cantidad: 10, 
        costo: 35, 
        activo: true 
      },
      { 
        _id: 10, 
        idTipoProducto: 2, 
        nombreTipoProducto: 'Postres',
        nombre: 'Tres Leches', 
        cantidad: 12, 
        costo: 40, 
        activo: true 
      },
      // Antojitos (5 examples)
      { 
        _id: 11, 
        idTipoProducto: 3, 
        nombreTipoProducto: 'Antojitos',
        nombre: 'Tostadas', 
        cantidad: 30, 
        costo: 18, 
        activo: true 
      },
      { 
        _id: 12, 
        idTipoProducto: 3, 
        nombreTipoProducto: 'Antojitos',
        nombre: 'Sopes', 
        cantidad: 25, 
        costo: 22, 
        activo: true 
      },
      { 
        _id: 13, 
        idTipoProducto: 3, 
        nombreTipoProducto: 'Antojitos',
        nombre: 'Huaraches', 
        cantidad: 20, 
        costo: 35, 
        activo: true 
      },
      { 
        _id: 14, 
        idTipoProducto: 3, 
        nombreTipoProducto: 'Antojitos',
        nombre: 'Tlacoyos', 
        cantidad: 15, 
        costo: 25, 
        activo: true 
      },
      { 
        _id: 15, 
        idTipoProducto: 3, 
        nombreTipoProducto: 'Antojitos',
        nombre: 'Esquites', 
        cantidad: 40, 
        costo: 15, 
        activo: true 
      }
    ]);


    // Create extra types
    await TipoExtra.insertMany([
      { _id: 1, nombre: 'Salsas', descripcion: 'Salsas y aderezos', activo: true },
      { _id: 2, nombre: 'Quesos', descripcion: 'Tipos de queso', activo: true },
      { _id: 3, nombre: 'Verduras', descripcion: 'Verduras adicionales', activo: true },
      { _id: 4, nombre: 'Carnes', descripcion: 'Carnes extras', activo: true }
    ]);


    // Create extras
    await Extra.insertMany([
      // Salsas
      { _id: 1, nombre: 'Salsa Verde', descripcion: 'Salsa verde picante', costo: 5, idTipoExtra: 1, activo: true },
      { _id: 2, nombre: 'Salsa Roja', descripcion: 'Salsa roja tradicional', costo: 5, idTipoExtra: 1, activo: true },
      { _id: 3, nombre: 'Salsa de Chile Chipotle', descripcion: 'Salsa de chile chipotle', costo: 8, idTipoExtra: 1, activo: true },
      
      // Quesos
      { _id: 4, nombre: 'Queso Oaxaca', descripcion: 'Queso oaxaca fresco', costo: 12, idTipoExtra: 2, activo: true },
      { _id: 5, nombre: 'Queso Manchego', descripcion: 'Queso manchego rallado', costo: 15, idTipoExtra: 2, activo: true },
      { _id: 6, nombre: 'Queso Panela', descripcion: 'Queso panela en cubos', costo: 10, idTipoExtra: 2, activo: true },
      
      // Verduras
      { _id: 7, nombre: 'Aguacate', descripcion: 'Rebanadas de aguacate', costo: 8, idTipoExtra: 3, activo: true },
      { _id: 8, nombre: 'Nopales', descripcion: 'Nopales asados', costo: 6, idTipoExtra: 3, activo: true },
      { _id: 9, nombre: 'Cebolla Morada', descripcion: 'Cebolla morada en aros', costo: 4, idTipoExtra: 3, activo: true },
      
      // Carnes
      { _id: 10, nombre: 'Chorizo', descripcion: 'Chorizo mexicano', costo: 20, idTipoExtra: 4, activo: true },
      { _id: 11, nombre: 'Chicharrón', descripcion: 'Chicharrón prensado', costo: 18, idTipoExtra: 4, activo: true },
      { _id: 12, nombre: 'Carnitas', descripcion: 'Carnitas de cerdo', costo: 25, idTipoExtra: 4, activo: true }
    ]);

    
  } catch (error) {
    console.error(' Error seeding data:', error);
  } finally {
    mongoose.connection.close();
  }
}

seedData();