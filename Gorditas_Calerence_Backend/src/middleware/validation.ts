import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    if (error) {
      console.error('Error de validación Joi:', error.details.map(detail => detail.message));
      return res.status(400).json({
        message: 'Error de validación',
        details: error.details.map(detail => detail.message)
      });
    }
    next();
  };
};

// Validation schemas
export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

export const createUserSchema = Joi.object({
  nombre: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  idTipoUsuario: Joi.number().required()
});

export const createOrdenSchema = Joi.object({
  idTipoOrden: Joi.number().required(),
  nombreTipoOrden: Joi.string().required(),
  idMesa: Joi.number().optional(),
  nombreMesa: Joi.string().optional(),
  nombreCliente: Joi.string().max(100).optional(),
  total: Joi.number().min(0).required(),
  estatus: Joi.string().optional()
});

export const addProductToOrdenSchema = Joi.object({
  idOrden: Joi.string().optional(),
  idProducto: Joi.number().required(),
  nombreProducto: Joi.string().required(),
  costoProducto: Joi.number().min(0).required(),
  cantidad: Joi.number().min(1).required()
});

export const addPlatilloToSubordenSchema = Joi.object({
  idPlatillo: Joi.number().required(),
  nombrePlatillo: Joi.string().required(),
  idGuiso: Joi.number().required(),
  nombreGuiso: Joi.string().required(),
  costoPlatillo: Joi.number().min(0).required(),
  cantidad: Joi.number().min(1).required()
});

export const createGastoSchema = Joi.object({
  nombre: Joi.string().required(),
  idTipoGasto: Joi.number().required(),
  gastoTotal: Joi.number().min(0).required(),
  descripcion: Joi.string().optional()
});