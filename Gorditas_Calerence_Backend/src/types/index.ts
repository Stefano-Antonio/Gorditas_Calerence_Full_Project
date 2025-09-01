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
  fechaHora: Date;
  total: number;
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
}

export interface IGasto {
  _id?: string;
  idTipoGasto: number;
  nombreTipoGasto: string;
  costo: number;
  fecha: Date;
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