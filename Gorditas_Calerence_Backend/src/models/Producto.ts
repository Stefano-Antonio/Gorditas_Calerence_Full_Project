import mongoose, { Document, Schema } from 'mongoose';
import { IProducto } from '../types';

export interface IProductoDocument extends Omit<IProducto, '_id'>, Document {}

const productoSchema = new Schema<IProductoDocument>({
  _id: { type: Number, required: true },
  idTipoProducto: { type: Number, required: true },
  nombreTipoProducto: { type: String, trim: true },
  nombre: { type: String, required: true, trim: true },
  cantidad: { type: Number, required: true, min: 0 },
  costo: { type: Number, required: true, min: 0 },
  activo: { type: Boolean, default: true }
}, {
  timestamps: true,
  versionKey: false
});

productoSchema.index({ nombre: 1 });
productoSchema.index({ idTipoProducto: 1 });
productoSchema.index({ activo: 1 });
productoSchema.index({ cantidad: 1 });

export default mongoose.model<IProductoDocument>('Producto', productoSchema);