import mongoose, { Document, Schema } from 'mongoose';
import { ISuborden } from '../types';

export interface ISubordenDocument extends Omit<ISuborden, '_id'>, Document {}

const subordenSchema = new Schema<ISubordenDocument>({
  _id: mongoose.Types.ObjectId,
  nombre: { type: String, required: true, trim: true }
}, {
  timestamps: true,
  versionKey: false
});

subordenSchema.index({ idOrden: 1 });

export default mongoose.model<ISubordenDocument>('Suborden', subordenSchema);