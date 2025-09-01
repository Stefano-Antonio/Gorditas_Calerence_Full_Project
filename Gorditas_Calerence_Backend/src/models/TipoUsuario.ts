import mongoose, { Document, Schema } from 'mongoose';
import { ITipoUsuario } from '../types';

export interface ITipoUsuarioDocument extends Omit<ITipoUsuario, '_id'>, Document {
  _id: number;
}

const tipoUsuarioSchema = new Schema<ITipoUsuarioDocument>({
  _id: { type: Number, required: true },
  nombre: { type: String, required: true, trim: true },
  descripcion: { type: String, required: true, trim: true }
}, {
  timestamps: true,
  versionKey: false
});

tipoUsuarioSchema.index({ nombre: 1 });

export default mongoose.model<ITipoUsuarioDocument>('TipoUsuario', tipoUsuarioSchema);