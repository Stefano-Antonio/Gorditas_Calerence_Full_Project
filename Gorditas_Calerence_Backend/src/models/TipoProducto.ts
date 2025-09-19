import mongoose, { Document, Schema } from 'mongoose';
import { ITipoProducto } from '../types';

export interface ITipoProductoDocument extends ITipoProducto, Document {}

export interface ITipoProductoDocument extends Omit<ITipoProducto, '_id'>, Document {
  _id: number;
}
const tipoProductoSchema = new Schema<ITipoProductoDocument>({
  _id: { type: Number, required: true },
  nombre: { type: String, required: true, trim: true },
  descripcion: { type: String, required: false, trim: true },
  activo: { type: Boolean, default: true }
}, {
  timestamps: true,
  versionKey: false
});

tipoProductoSchema.index({ nombre: 1 });
tipoProductoSchema.index({ activo: 1 });

export default mongoose.model<ITipoProductoDocument>('TipoProducto', tipoProductoSchema);