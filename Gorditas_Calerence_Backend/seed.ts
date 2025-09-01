// Simple script to create test data
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/restaurant-db');

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

async function seedData() {
  try {
    // Clear existing data
    await Usuario.deleteMany({});
    await Mesa.deleteMany({});
    await TipoPlatillo.deleteMany({});
    await Platillo.deleteMany({});
    await Guiso.deleteMany({});

    // Create test user (password will be hashed by the pre-save hook)
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    await Usuario.create({
      nombre: 'Usuario Test',
      email: 'test@test.com',
      password: hashedPassword,
      idTipoUsuario: 1,
      nombreTipoUsuario: 'Admin',
      activo: true
    });

    // Create mesas
    await Mesa.insertMany([
      { _id: 1, nombre: 'Mesa 1' },
      { _id: 2, nombre: 'Mesa 2' },
      { _id: 3, nombre: 'Mesa 3' },
      { _id: 4, nombre: 'Mesa 4' }
    ]);

    // Create tipo platillos
    await TipoPlatillo.insertMany([
      { _id: 1, nombre: 'Gorditas', descripcion: 'Gorditas tradicionales', activo: true },
      { _id: 2, nombre: 'Quesadillas', descripcion: 'Quesadillas de maíz', activo: true }
    ]);

    // Create guisos
    await Guiso.insertMany([
      { _id: 1, nombre: 'Chicharrón Prensado', descripcion: 'Chicharrón en salsa verde', activo: true },
      { _id: 2, nombre: 'Pollo en Mole', descripcion: 'Pollo bañado en mole poblano', activo: true },
      { _id: 3, nombre: 'Carnitas', descripcion: 'Carne de cerdo confitada', activo: true },
      { _id: 4, nombre: 'Requesón', descripcion: 'Queso requesón con hierbas', activo: true }
    ]);

    // Create platillos
    await Platillo.insertMany([
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
        idTipoPlatillo: 2, 
        nombreTipoPlatillo: 'Quesadillas',
        nombre: 'Quesadilla Chica', 
        descripcion: 'Quesadilla pequeña', 
        costo: 20, 
        precio: 20,
        activo: true 
      },
      { 
        _id: 4, 
        idTipoPlatillo: 2, 
        nombreTipoPlatillo: 'Quesadillas',
        nombre: 'Quesadilla Grande', 
        descripcion: 'Quesadilla familiar', 
        costo: 30, 
        precio: 30,
        activo: true 
      }
    ]);

    console.log('✅ Test data created successfully!');
    console.log('Login credentials: test@test.com / password123');
    
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    mongoose.connection.close();
  }
}

seedData();