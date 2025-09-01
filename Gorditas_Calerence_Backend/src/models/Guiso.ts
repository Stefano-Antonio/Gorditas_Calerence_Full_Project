import mongoose, { Document, Schema } from 'mongoose';
import { IGuiso } from '../types';

export interface IGuisoDocument extends Omit<IGuiso, '_id'>, Document {
  _id: number;
}

const guisoSchema = new Schema<IGuisoDocument>({
  _id: { type: Number, required: true },
  nombre: { type: String, required: true, trim: true },
  descripcion: { type: String, required: true, trim: true },
  activo: { type: Boolean, default: true }
}, {
  timestamps: true,
  versionKey: false
});

guisoSchema.index({ nombre: 1 });
guisoSchema.index({ activo: 1 });

export default mongoose.model<IGuisoDocument>('Guiso', guisoSchema);