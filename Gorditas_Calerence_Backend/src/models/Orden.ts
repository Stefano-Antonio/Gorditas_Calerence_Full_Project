import mongoose, { Document, Schema } from 'mongoose';
import { IOrden, OrdenStatus } from '../types';

export interface IOrdenDocument extends Omit<IOrden, '_id'>, Document {}

const ordenSchema = new Schema<IOrdenDocument>({
  folio: { type: String, required: true, unique: true },
  idTipoOrden: { type: Number, required: true },
  nombreTipoOrden: { type: String, required: true, trim: true },
  estatus: { 
    type: String, 
    required: true, 
    enum: Object.values(OrdenStatus),
    default: OrdenStatus.RECEPCION
  },
  idMesa: { type: Number },
  nombreMesa: { type: String, trim: true },
  nombreCliente: { type: String, trim: true },
  fechaHora: { type: Date, default: Date.now },
  fechaPago: { type: Date },
  total: { type: Number, required: true, min: 0, default: 0 },
  notas: { type: String, maxlength: 500, trim: true }
}, {
  timestamps: true,
  versionKey: false
});

ordenSchema.index({ folio: 1 });
ordenSchema.index({ estatus: 1 });
ordenSchema.index({ fechaHora: -1 });
ordenSchema.index({ idMesa: 1 });

export default mongoose.model<IOrdenDocument>('Orden', ordenSchema);