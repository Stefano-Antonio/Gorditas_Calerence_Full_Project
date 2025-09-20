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
  nombreTipoUsuario: Joi.string().valid('Admin', 'Encargado', 'Despachador', 'Mesero', 'Cocinero').required(),
  idTipoUsuario: Joi.number().optional()
});

export const createOrdenSchema = Joi.object({
  idTipoOrden: Joi.number().required(),
  nombreTipoOrden: Joi.string().required(),
  idMesa: Joi.number().optional(),
  nombreMesa: Joi.string().allow('').optional(),
  nombreCliente: Joi.string().max(100).allow('').optional(),
  total: Joi.number().min(0).required(),
  estatus: Joi.string().allow('').optional(),
  notas: Joi.string().max(500).allow('').optional()
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
  cantidad: Joi.number().min(1).required(),
  notas: Joi.string().max(200).allow('').optional() // Notas específicas del platillo
});

export const addExtraToOrdenSchema = Joi.object({
  idOrden: Joi.string().optional(),
  idExtra: Joi.number().required(),
  nombreExtra: Joi.string().required(),
  costoExtra: Joi.number().min(0).required(),
  cantidad: Joi.number().min(1).required()
});

export const createGastoSchema = Joi.object({
  nombre: Joi.string().required(),
  idTipoGasto: Joi.number().required(),
  gastoTotal: Joi.number().min(0).required(),
  descripcion: Joi.string().allow('').optional()
});

// Schemas for catalogs
export const createGuisoSchema = Joi.object({
  nombre: Joi.string().required(),
  descripcion: Joi.string().allow('').optional(),
  activo: Joi.boolean().optional()
});

export const createPlatilloSchema = Joi.object({
  idTipoPlatillo: Joi.number().required(),
  nombreTipoPlatillo: Joi.string().allow('').optional(),
  nombre: Joi.string().required(),
  descripcion: Joi.string().allow('').optional(),
  costo: Joi.number().min(0).required(),
  precio: Joi.number().min(0).required(),
  activo: Joi.boolean().optional()
});

export const createProductoSchema = Joi.object({
  idTipoProducto: Joi.number().required(),
  nombreTipoProducto: Joi.string().allow('').optional(),
  nombre: Joi.string().required(),
  cantidad: Joi.number().min(0).required(),
  costo: Joi.number().min(0).required(),
  activo: Joi.boolean().optional()
});

export const createTipoProductoSchema = Joi.object({
  nombre: Joi.string().required(),
  descripcion: Joi.string().allow('').optional(),
  activo: Joi.boolean().optional()
});

export const createTipoPlatilloSchema = Joi.object({
  nombre: Joi.string().required(),
  descripcion: Joi.string().allow('').optional(),
  activo: Joi.boolean().optional()
});

export const createTipoGastoSchema = Joi.object({
  nombre: Joi.string().required(),
  descripcion: Joi.string().allow('').optional(),
  activo: Joi.boolean().optional()
});

export const createMesaSchema = Joi.object({
  numero: Joi.number().required(),
  nombre: Joi.string().allow('').optional(),
  capacidad: Joi.number().min(1).optional(),
  activo: Joi.boolean().optional()
});

export const createTipoOrdenSchema = Joi.object({
  nombre: Joi.string().required(),
  descripcion: Joi.string().allow('').optional(),
  activo: Joi.boolean().optional()
});