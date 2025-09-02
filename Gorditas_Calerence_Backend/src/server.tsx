import mongoose from 'mongoose';
import Gasto from './models/Gasto';
import Mesa from './models/Mesa';
import Orden from './models/Orden';
import Guiso from './models/Guiso';
import OrdenDetallePlatillo from './models/OrdenDetallePlatillo';



const insertExamples = async () => {
  try {
    // Conectar a la base de datos
    await mongoose.connect('mongodb://localhost:27017/tienda_gorditas');

    console.log('Conectado a la base de datos');

    // Insertar ejemplos
    await Gasto.create({
      idTipoGasto: 1,
      nombreTipoGasto: 'Luz',
      costo: 500,
      fecha: new Date(),
    });

    await Mesa.create({
      _id: 1,
      nombre: 'Mesa 1',
    });

    await Orden.create({
      folio: 'ORD001',
      idTipoOrden: 1,
      nombreTipoOrden: 'Para llevar',
      estatus: 'Recepcion',
      idMesa: 1,
      nombreMesa: 'Mesa 1',
      fechaHora: new Date(),
      total: 150,
    });

    await Guiso.create({
      _id: 1,
      nombre: 'Guiso Verde',
      descripcion: 'Delicioso guiso verde',
      activo: true,
    });

    await OrdenDetallePlatillo.create({
      _id: 'SUB001',
      idPlatillo: 1,
      nombrePlatillo: 'Taco',
      idGuiso: 1,
      nombreGuiso: 'Guiso Verde',
      costoPlatillo: 50,
      cantidad: 2,
      importe: 100,
    });

  } catch (error) {
    console.error('Error al insertar ejemplos:', error);
  } finally {
    // Cerrar conexión
    await mongoose.disconnect();
    console.log('Conexión cerrada');
  }
};
