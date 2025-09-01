// Base interfaces
export interface BaseEntity {
  _id?: string;
  activo: boolean;
  fechaCreacion?: Date;
  fechaActualizacion?: Date;
}

// Catalog models
export interface Guiso extends BaseEntity {
  nombre: string;
  descripcion?: string;
}

export interface TipoProducto extends BaseEntity {
  nombre: string;
  descripcion?: string;
}

export interface Producto extends BaseEntity {
  nombre: string;
  codigoBarras?: string;
  tipoProducto: string;
  cantidad: number;
  costo: number;
  precio: number;
}

export interface TipoPlatillo extends BaseEntity {
  nombre: string;
  descripcion?: string;
}

export interface Platillo extends BaseEntity {
  nombre: string;
  tipoPlatillo: string;
  precio: number;
  descripcion?: string;
  guisos?: string[];
}

export interface TipoUsuario extends BaseEntity {
  nombre: string;
  permisos: string[];
}

export interface Usuario extends BaseEntity {
  nombre: string;
  email: string;
  password: string;
  tipoUsuario: string;
  telefono?: string;
}

export interface TipoOrden extends BaseEntity {
  nombre: string;
  descripcion?: string;
}

export interface Mesa extends BaseEntity {
  nombre: string;
  numero?: number;
  capacidad?: number;
  ubicacion?: string;
}

export interface TipoGasto extends BaseEntity {
  nombre: string;
  descripcion?: string;
}

// Transactional models
export interface Orden extends BaseEntity {
  mesa: string;
  tipoOrden: string;
  usuario: string;
  estatus: 'Pendiente' | 'Recepcion' | 'Preparacion' | 'Surtida' | 'Entregada' | 'Pagada' | 'Cancelado';
  total: number;
  fecha: Date;
  subordenes?: string[];
}

export interface Suborden extends BaseEntity {
  nombre: string;
  orden: string;
  platillos?: OrdenDetallePlatillo[];
}

export interface OrdenDetallePlatillo extends BaseEntity {
  suborden: string;
  platillo: string;
  guiso: string;
  cantidad: number;
  precio: number;
  subtotal: number;
  entregado: boolean;
}

export interface OrdenDetalleProducto extends BaseEntity {
  orden: string;
  producto: string;
  cantidad: number;
  precio: number;
  subtotal: number;
  entregado: boolean;
}

export interface Gasto extends BaseEntity {
  tipoGasto: string;
  usuario: string;
  monto: number;
  descripcion?: string;
  fecha: Date;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthUser {
  _id: string;
  nombre: string;
  email: string;
  idTipoUsuario: number;
  nombreTipoUsuario: string;
  activo: boolean;
}

// Report types
export interface ReporteVentas {
  fecha: string;
  ventasTotales: number;
  gastosTotales: number;
  utilidad: number;
  ordenes: number;
}

export interface ReporteInventario {
  producto: Producto;
  valorTotal: number;
  stockMinimo: boolean;
}

export interface ProductoVendido {
  producto: string;
  nombre: string;
  cantidadVendida: number;
  totalVendido: number;
}

// UI types
export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  roles: string[];
}

export type UserRole = 'Admin' | 'Encargado' | 'Mesero' | 'Despachador' | 'Cocinero';

export interface OrderStep {
  step: number;
  title: string;
  completed: boolean;
}