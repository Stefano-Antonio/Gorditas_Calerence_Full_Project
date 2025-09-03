import mongoose, { Document, Schema } from 'mongoose';
import { IOrdenDetalleProducto } from '../types';

export interface IOrdenDetalleProductoDocument extends Document, Omit<IOrdenDetalleProducto, '_id'> {}


const ordenDetalleProductoSchema = new Schema<IOrdenDetalleProductoDocument>({
  idOrden: { type: String, ref: 'Orden', required: true },
  idProducto: { type: Number, required: true },
  nombreProducto: { type: String, required: true, trim: true },
  costoProducto: { type: Number, required: true, min: 0 },
  cantidad: { type: Number, required: true, min: 1 },
  importe: { type: Number, required: true, min: 0 },
  listo: { type: Boolean, default: false },
  entregado: { type: Boolean, default: false }
}, {
  timestamps: true,
  versionKey: false,
  toObject: { transform: (doc, ret) => { ret.idOrden = String(ret.idOrden); return ret; } },
  toJSON: { transform: (doc, ret) => { ret.idOrden = String(ret.idOrden); return ret; } },
});

ordenDetalleProductoSchema.index({ idOrden: 1 });
ordenDetalleProductoSchema.index({ idProducto: 1 });

export default mongoose.model<IOrdenDetalleProductoDocument>('OrdenDetalleProducto', ordenDetalleProductoSchema);