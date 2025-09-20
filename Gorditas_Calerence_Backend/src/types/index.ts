export interface IUser {
  _id?: string;
  nombre: string;
  idTipoUsuario: number;
  nombreTipoUsuario: string;
  activo: boolean;
  password?: string;
  email?: string;
}

export interface IGuiso {
  _id?: number;
  nombre: string;
  descripcion: string;
  activo: boolean;
}

export interface ITipoProducto {
  _id?: number;
  nombre: string;
  descripcion: string;
  activo: boolean;
}

export interface IProducto {
  _id?: number;
  idTipoProducto: number;
  nombreTipoProducto: string;
  nombre: string;
  cantidad: number;
  costo: number;
  activo: boolean;
}

export interface ITipoPlatillo {
  _id?: number;
  nombre: string;
  descripcion: string;
  activo: boolean;
}

export interface IPlatillo {
  _id?: number;
  idTipoPlatillo: number;
  nombreTipoPlatillo: string;
  nombre: string;
  descripcion?: string;
  costo: number;
  precio: number; // Added for frontend compatibility
  activo: boolean;
}

export interface ITipoUsuario {
  _id?: number;
  nombre: string;
  descripcion: string;
}

export interface ITipoOrden {
  _id?: number;
  nombre: string;
  activo: boolean;
}

export interface IMesa {
  _id?: number;
  nombre: string;
}

export interface ITipoGasto {
  _id?: number;
  nombre: string;
  activo: boolean;
}

export interface IOrden {
  _id?: string;
  folio: string;
  idTipoOrden: number;
  nombreTipoOrden: string;
  estatus: string;
  idMesa?: number;
  nombreMesa?: string;
  nombreCliente?: string;
  fechaHora: Date;
  fechaPago?: Date;
  total: number;
  notas?: string;
}

export interface ISuborden {
  _id?: string;
  idOrden: string;
  nombre: string;
}

export interface IOrdenDetalleProducto {
  _id?: string;
  idOrden: string;
  idProducto: number;
  nombreProducto: string;
  costoProducto: number;
  cantidad: number;
  importe: number;
  listo?: boolean;
  entregado?: boolean;
}

export interface IOrdenDetallePlatillo {
  _id?: string;
  idSuborden: string;
  idPlatillo: number;
  nombrePlatillo: string;
  idGuiso: number;
  nombreGuiso: string;
  costoPlatillo: number;
  cantidad: number;
  importe: number;
  listo?: boolean;
  entregado?: boolean;
  extras?: IOrdenDetalleExtra[]; // Extras vinculados a este platillo
}

export interface IGasto {
  _id?: string;
  nombre: string;
  idTipoGasto: number;
  nombreTipoGasto: string;
  gastoTotal: number;
  descripcion?: string;
  fecha: Date;
}

export interface ITipoExtra {
  _id?: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
}

export interface IExtra {
  _id?: number;
  nombre: string;
  descripcion?: string;
  costo: number;
  idTipoExtra: number;
  activo: boolean;
}

export interface IOrdenDetalleExtra {
  _id?: string;
  idOrdenDetallePlatillo: string;
  idExtra: number;
  nombreExtra: string;
  costoExtra: number;
  cantidad: number;
  importe: number;
  listo?: boolean;
  entregado?: boolean;
}

export enum UserRole {
  ADMIN = 'Admin',
  ENCARGADO = 'Encargado',
  MESERO = 'Mesero',
  DESPACHADOR = 'Despachador',
  COCINERO = 'Cocinero'
}

export enum OrdenStatus {
  PENDIENTE = 'Pendiente',
  RECEPCION = 'Recepcion',
  PREPARACION = 'Preparacion',
  SURTIDA = 'Surtida',
  ENTREGADA = 'Entregada',
  PAGADA = 'Pagada',
  CANCELADO = 'Cancelado'
}