import mongoose, { Schema, Document } from 'mongoose';

export interface IOrdenDetalleExtra extends Document {
  _id: string;
  idOrdenDetallePlatillo: string; // Vinculado al platillo específico
  idExtra: number;
  nombreExtra: string;
  costoExtra: number;
  cantidad: number;
  importe: number;
  listo?: boolean;
  entregado?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const OrdenDetalleExtraSchema = new Schema<IOrdenDetalleExtra>({
  idOrdenDetallePlatillo: {
    type: String,
    required: [true, 'El ID del detalle de platillo es requerido'],
    ref: 'OrdenDetallePlatillo'
  },
  idExtra: {
    type: Number,
    required: [true, 'El ID del extra es requerido'],
    ref: 'Extra'
  },
  nombreExtra: {
    type: String,
    required: [true, 'El nombre del extra es requerido'],
    trim: true,
    maxlength: [100, 'El nombre del extra no puede exceder 100 caracteres']
  },
  costoExtra: {
    type: Number,
    required: [true, 'El costo del extra es requerido'],
    min: [0, 'El costo debe ser mayor o igual a 0']
  },
  cantidad: {
    type: Number,
    required: [true, 'La cantidad es requerida'],
    min: [1, 'La cantidad debe ser mayor a 0']
  },
  importe: {
    type: Number,
    required: [true, 'El importe es requerido'],
    min: [0, 'El importe debe ser mayor o igual a 0']
  },
  listo: {
    type: Boolean,
    default: false
  },
  entregado: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Índices
OrdenDetalleExtraSchema.index({ idOrdenDetallePlatillo: 1 });
OrdenDetalleExtraSchema.index({ idExtra: 1 });
OrdenDetalleExtraSchema.index({ listo: 1 });
OrdenDetalleExtraSchema.index({ entregado: 1 });

const OrdenDetalleExtra = mongoose.model<IOrdenDetalleExtra>('OrdenDetalleExtra', OrdenDetalleExtraSchema);

export default OrdenDetalleExtra;