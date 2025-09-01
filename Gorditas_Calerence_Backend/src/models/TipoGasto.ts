import mongoose, { Document, Schema } from 'mongoose';
import { ITipoGasto } from '../types';

export interface ITipoGastoDocument  extends Omit<ITipoGasto, '_id'>, Document {}

const tipoGastoSchema = new Schema<ITipoGastoDocument>({
  _id: { type: Number, required: true },
  nombre: { type: String, required: true, trim: true },
  activo: { type: Boolean, default: true }
}, {
  timestamps: true,
  versionKey: false
});

tipoGastoSchema.index({ nombre: 1 });
tipoGastoSchema.index({ activo: 1 });

export default mongoose.model<ITipoGastoDocument>('TipoGasto', tipoGastoSchema);