import mongoose, { Document, Schema } from 'mongoose';
import { IGasto } from '../types';

export interface IGastoDocument extends Omit<IGasto, '_id'>, Document {}

const gastoSchema = new Schema<IGastoDocument>({
  nombre: { type: String, required: true, trim: true },
  idTipoGasto: { type: Number, required: true },
  nombreTipoGasto: { type: String, required: true, trim: true },
  gastoTotal: { type: Number, required: true, min: 0 },
  descripcion: { type: String, required: false, trim: false },
  fecha: { type: Date, default: Date.now }
}, {
  timestamps: true,
  versionKey: false
});

gastoSchema.index({ idTipoGasto: 1 });
gastoSchema.index({ fecha: -1 });

export default mongoose.model<IGastoDocument>('Gasto', gastoSchema);