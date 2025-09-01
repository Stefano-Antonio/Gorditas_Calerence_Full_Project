import mongoose, { Document, Schema } from 'mongoose';
import { ITipoOrden } from '../types';

export interface ITipoOrdenDocument  extends Omit<ITipoOrden, '_id'>, Document {}

const tipoOrdenSchema = new Schema<ITipoOrdenDocument>({
  _id: { type: Number, required: true },
  nombre: { type: String, required: true, trim: true },
  activo: { type: Boolean, default: true }
}, {
  timestamps: true,
  versionKey: false
});

tipoOrdenSchema.index({ nombre: 1 });
tipoOrdenSchema.index({ activo: 1 });

export default mongoose.model<ITipoOrdenDocument>('TipoOrden', tipoOrdenSchema);