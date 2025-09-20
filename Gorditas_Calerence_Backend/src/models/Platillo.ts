import mongoose, { Document, Schema } from 'mongoose';
import { IPlatillo } from '../types';

export interface IPlatilloDocument  extends Omit<IPlatillo, '_id'>, Document {}

const platilloSchema = new Schema<IPlatilloDocument>({
  _id: { type: Number, required: true },
  idTipoPlatillo: { type: Number, required: true },
  nombreTipoPlatillo: { type: String, trim: true },
  nombre: { type: String, required: true, trim: true },
  descripcion: { type: String, trim: false },
  costo: { type: Number, required: true, min: 0 },
  precio: { type: Number, required: true, min: 0 }, // Added for frontend compatibility
  notas: { type: String,  required: true,ztrim: true, default: '' }, // Campo para notas adicionales del platillo
  activo: { type: Boolean, default: true }
}, {
  timestamps: true,
  versionKey: false
});

platilloSchema.index({ nombre: 1 });
platilloSchema.index({ idTipoPlatillo: 1 });
platilloSchema.index({ activo: 1 });

export default mongoose.model<IPlatilloDocument>('Platillo', platilloSchema);