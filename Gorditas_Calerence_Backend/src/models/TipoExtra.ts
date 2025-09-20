import mongoose, { Schema, Document } from 'mongoose';

export interface ITipoExtra extends Document {
  _id: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TipoExtraSchema = new Schema<ITipoExtra>({
  _id: {
    type: Number,
    required: true
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
  activo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  _id: false
});

// Índices
TipoExtraSchema.index({ nombre: 1 });
TipoExtraSchema.index({ activo: 1 });

const TipoExtra = mongoose.model<ITipoExtra>('TipoExtra', TipoExtraSchema);

export default TipoExtra;