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
  mesa: string;
  tipoOrden?: string;
  usuario?: string;
  estatus: 'Pendiente' | 'Recepcion' | 'Preparacion' | 'Surtida' | 'Entregada' | 'Pagada' | 'Cancelado';
  total: number;
  fecha?: Date;
  fechaHora?: Date;
  subordenes?: string[];
  nombreMesa?: string;
  folio?: string;
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
  listo?: boolean;
  entregado?: boolean;
  nombrePlatillo?: string;
  idPlatillo?: number;
  nombreGuiso?: string;
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
  tipoGasto: string;
  usuario: string;
  monto: number;
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
  ordenes: Orden[];
  resumen: {
    totalVentas: number;
    cantidadOrdenes: number;
    promedioVenta: number;
  };
  ventasPorDia: {
    _id: string;
    ventas: number;
    ordenes: number;
  }[];
  ventasPorTipo: {
    _id: string;
    ventas: number;
    ordenes: number;
  }[];
  pagination: PaginationInfo;
}

export interface ReporteInventario {
  productos: {
    producto: Producto;
    valorTotal: number;
    stockMinimo: boolean;
    stockAgotado: boolean;
  }[];
  resumen: {
    totalProductos: number;
    stockBajo: number;
    stockAgotado: number;
    valorInventario: number;
  };
  alertas: {
    stockBajo: Producto[];
    stockAlto: Producto[];
  };
  pagination: PaginationInfo;
}

export interface ProductoVendido {
  producto: string;
  nombre: string;
  cantidadVendida: number;
  totalVendido: number;
  vecesVendido: number;
}

export interface PlatilloVendido {
  platillo: string;
  nombre: string;
  cantidadVendida: number;
  totalVendido: number;
  vecesVendido: number;
}

export interface ReporteProductosVendidos {
  productos: ProductoVendido[];
  platillos: PlatilloVendido[];
  resumen: {
    totalProductosVendidos: number;
    totalPlatillosVendidos: number;
    ingresosTotalProductos: number;
    ingresosTotalPlatillos: number;
  };
}

export interface ReporteGastos {
  gastos: Gasto[];
  resumen: {
    totalGastos: number;
    cantidadGastos: number;
    promedioGasto: number;
  };
  gastosPorTipo: {
    _id: string;
    gastos: number;
    cantidad: number;
  }[];
  gastosPorDia: {
    _id: string;
    gastos: number;
    cantidad: number;
  }[];
  gastosPorUsuario: {
    _id: string;
    gastos: number;
    cantidad: number;
  }[];
  pagination: PaginationInfo;
}

export interface ReporteUsuarios {
  usuarios: {
    idUsuario: number;
    nombreUsuario: string;
    totalOrdenes: number;
    totalVentas: number;
    promedioVenta: number;
  }[];
  resumen: {
    totalUsuariosActivos: number;
    ventasTotales: number;
    ordenesTotales: number;
  };
  pagination: PaginationInfo;
}

export interface ReporteMesas {
  mesas: {
    idMesa: number;
    nombreMesa: string;
    totalOrdenes: number;
    totalVentas: number;
    promedioVenta: number;
    ultimaOrden: Date;
  }[];
  resumen: {
    totalMesas: number;
    ventasTotales: number;
    ordenesTotales: number;
    mesaMasVentas: any;
  };
  pagination: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
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