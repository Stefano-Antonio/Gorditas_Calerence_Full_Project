import mongoose, { Document, Schema } from 'mongoose';
import { ITipoPlatillo } from '../types';

export interface ITipoPlatilloDocument extends ITipoPlatillo, Document {
  _id: number;
}

const tipoPlatilloSchema = new Schema<ITipoPlatilloDocument>({
  _id: { type: Number, required: true },
  nombre: { type: String, required: true, trim: true },
  descripcion: { type: String, required: false, trim: true },
  activo: { type: Boolean, default: true }
}, {
  timestamps: true,
  versionKey: false
});

tipoPlatilloSchema.index({ nombre: 1 });
tipoPlatilloSchema.index({ activo: 1 });

export default mongoose.model<ITipoPlatilloDocument>('TipoPlatillo', tipoPlatilloSchema);