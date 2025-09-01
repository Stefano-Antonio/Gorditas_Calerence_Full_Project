import mongoose, { Document, Schema } from 'mongoose';
import { IOrdenDetallePlatillo } from '../types';

export interface IOrdenDetallePlatilloDocument extends Omit<IOrdenDetallePlatillo, '_id'>, Document {}

const ordenDetallePlatilloSchema = new Schema<IOrdenDetallePlatilloDocument>({
  _id: { type: String, ref: 'Suborden', required: true },
  idPlatillo: { type: Number, required: true },
  nombrePlatillo: { type: String, required: true, trim: true },
  idGuiso: { type: Number, required: true },
  nombreGuiso: { type: String, required: true, trim: true },
  costoPlatillo: { type: Number, required: true, min: 0 },
  cantidad: { type: Number, required: true, min: 1 },
  importe: { type: Number, required: true, min: 0 }
}, {
  timestamps: true,
  versionKey: false
});

ordenDetallePlatilloSchema.index({ idSuborden: 1 });
ordenDetallePlatilloSchema.index({ idPlatillo: 1 });
ordenDetallePlatilloSchema.index({ idGuiso: 1 });

export default mongoose.model<IOrdenDetallePlatilloDocument>('OrdenDetallePlatillo', ordenDetallePlatilloSchema);