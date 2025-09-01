import mongoose, { Document, Schema } from 'mongoose';
import { IMesa } from '../types';

export interface IMesaDocument extends Omit<IMesa, '_id'>, Document {
  _id: number;
}

const mesaSchema = new Schema<IMesaDocument>({
  _id: { type: Number, required: true },
  nombre: { type: String, required: true, trim: true }
}, {
  timestamps: true,
  versionKey: false
});

mesaSchema.index({ nombre: 1 });

export default mongoose.model<IMesaDocument>('Mesa', mesaSchema);