import mongoose, { Document, Schema } from 'mongoose';
import { ISuborden } from '../types';

export interface ISubordenDocument extends Omit<ISuborden, '_id'>, Document {}

const subordenSchema = new Schema<ISubordenDocument>({
  idOrden: { type: String, required: true, ref: 'Orden' },
  nombre: { type: String, required: true, trim: true }
}, {
  timestamps: true,
  versionKey: false,
  toObject: { transform: (doc, ret) => { ret.idOrden = String(ret.idOrden); return ret; } },
  toJSON: { transform: (doc, ret) => { ret.idOrden = String(ret.idOrden); return ret; } },
});

subordenSchema.index({ idOrden: 1 });

export default mongoose.model<ISubordenDocument>('Suborden', subordenSchema);