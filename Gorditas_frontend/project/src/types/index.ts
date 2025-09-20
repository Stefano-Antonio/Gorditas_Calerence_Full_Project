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
  idTipoPlatillo: number;
  nombreTipoPlatillo: string;
  precio: number; // This will be mapped from costo in the backend
  costo?: number; // Keep both for compatibility
  descripcion?: string;
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
  idMesa: number;
  mesa: string;
  tipoOrden?: string;
  usuario?: string;
  estatus: 'Pendiente' | 'Recepcion' | 'Preparacion' | 'Surtida' | 'Entregada' | 'Pagada' | 'Cancelado';
  total: number;
  fecha?: Date;
  fechaHora?: Date;
  subordenes?: string[];
  nombreMesa?: string;
  nombreCliente?: string;
  folio?: string;
  notas?: string;
}

export interface OrdenCompleta extends Orden {
  productos?: OrdenDetalleProducto[];
  platillos?: OrdenDetallePlatillo[];
  extras?: any[];
}

export interface Suborden extends BaseEntity {
  nombre: string;
  orden: string;
  platillos?: OrdenDetallePlatillo[];
}

export interface OrdenDetallePlatillo extends BaseEntity {
  suborden?: string;
  platillo?: string;
  guiso?: string;
  cantidad: number;
  precio?: number;
  subtotal?: number;
  importe?: number;
  listo?: boolean;
  entregado?: boolean;
  nombrePlatillo?: string;
  idPlatillo?: number;
  nombreGuiso?: string;
  extras?: OrdenDetalleExtra[]; // Extras vinculados a este platillo
}

export interface OrdenDetalleProducto extends BaseEntity {
  importe?: number;
  nombre?: string;
  orden?: string;
  producto?: string;
  cantidad: number;
  precio?: number;
  subtotal?: number;
  listo?: boolean;
  entregado?: boolean;
  nombreProducto?: string;
  idProducto?: number;
}

export interface Gasto extends BaseEntity {
  nombre: string;
  tipoGasto: string;
  usuario?: string;
  gastoTotal: number;
  descripcion?: string;
  fecha: Date;
}

// API response types
export interface ApiResponse<T> {
  items?: T[];
  [key: string]: any;
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

// Mesa grouping interface for order management
export interface MesaAgrupada {
  idMesa: number;
  nombreMesa: string;
  ordenes: OrdenCompleta[];
  totalOrdenes: number;
  totalMonto: number;
  clientes: { [cliente: string]: OrdenCompleta[] };
}

export interface TipoExtra extends BaseEntity {
  nombre: string;
  descripcion?: string;
}

export interface Extra extends BaseEntity {
  nombre: string;
  descripcion?: string;
  costo: number;
  idTipoExtra: string;
}

export interface OrdenDetalleExtra extends BaseEntity {
  idOrdenDetallePlatillo: string;
  idExtra: number;
  nombreExtra: string;
  costoExtra: number;
  cantidad: number;
  importe: number;
  listo?: boolean;
  entregado?: boolean;
}