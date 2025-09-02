import mongoose, { Document, Schema } from 'mongoose';
import { IOrdenDetallePlatillo } from '../types';

export interface IOrdenDetallePlatilloDocument extends Omit<IOrdenDetallePlatillo, '_id'>, Document {}


const ordenDetallePlatilloSchema = new Schema<IOrdenDetallePlatilloDocument>({
  idSuborden: { type: String, ref: 'Suborden' },
  idPlatillo: { type: Schema.Types.Mixed, required: true },
  nombrePlatillo: { type: String, required: true, trim: true },
  idGuiso: { type: Schema.Types.Mixed, required: true },
  nombreGuiso: { type: String, required: true, trim: true },
  costoPlatillo: { type: Number, required: true, min: 0 },
  cantidad: { type: Number, required: true, min: 1 },
  importe: { type: Number, required: true, min: 0 },
  listo: { type: Boolean, default: false },
  entregado: { type: Boolean, default: false }
}, {
  timestamps: true,
  versionKey: false
});

ordenDetallePlatilloSchema.index({ idSuborden: 1 });
ordenDetallePlatilloSchema.index({ idPlatillo: 1 });
ordenDetallePlatilloSchema.index({ idGuiso: 1 });

export default mongoose.model<IOrdenDetallePlatilloDocument>('OrdenDetallePlatillo', ordenDetallePlatilloSchema);