import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser } from '../types';

export interface IUserDocument extends Omit<IUser, '_id'>, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const usuarioSchema = new Schema<IUserDocument>({
  nombre: { type: String, required: true, trim: true },
  email: { type: String, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  idTipoUsuario: { type: Number },
  nombreTipoUsuario: { type: String, trim: true },
  activo: { type: Boolean, default: true }
}, {
  timestamps: true,
  versionKey: false
});

usuarioSchema.index({ email: 1 });
usuarioSchema.index({ idTipoUsuario: 1 });
usuarioSchema.index({ activo: 1 });

// Auto-assign idTipoUsuario based on nombreTipoUsuario
usuarioSchema.pre('save', function(next) {
  if (this.nombreTipoUsuario && !this.idTipoUsuario) {
    const tipoUsuarioMap: { [key: string]: number } = {
      'Admin': 1,
      'Encargado': 2,
      'Despachador': 3,
      'Mesero': 4,
      'Cocinero': 5
    };
    
    this.idTipoUsuario = tipoUsuarioMap[this.nombreTipoUsuario] || 4; // Default to Mesero
  }
  next();
});

// Hash password before saving
usuarioSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password!, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
usuarioSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
usuarioSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

export default mongoose.model<IUserDocument>('Usuario', usuarioSchema);