import mongoose, { Schema, Document } from 'mongoose';

export interface IExtra extends Document {
  _id: number;
  idTipoExtra?: number;
  nombre: string;
  descripcion?: string;
  costo: number;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ExtraSchema = new Schema<IExtra>({
  _id: {
    type: Number,
    required: true
  },
  idTipoExtra: {
    type: Number,
    ref: 'TipoExtra'
  },
  nombre: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true,
    maxlength: [100, 'El nombre no puede exceder 100 caracteres']
  },
  descripcion: {
    type: String,
    trim: true,
    maxlength: [500, 'La descripción no puede exceder 500 caracteres']
  },
  costo: {
    type: Number,
    required: [true, 'El costo es requerido'],
    min: [0, 'El costo debe ser mayor o igual a 0']
  },
  activo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  _id: false
});

// Índices
ExtraSchema.index({ nombre: 1 });
ExtraSchema.index({ activo: 1 });
ExtraSchema.index({ costo: 1 });

const Extra = mongoose.model<IExtra>('Extra', ExtraSchema);

export default Extra;