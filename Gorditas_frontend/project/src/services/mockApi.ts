import { ApiResponse, Mesa, Platillo, Guiso } from '../types';

// Mock data for testing
const mockMesas: Mesa[] = [
  { _id: '1', nombre: 'Mesa 1', activo: true, fechaCreacion: new Date(), fechaActualizacion: new Date() },
  { _id: '2', nombre: 'Mesa 2', activo: true, fechaCreacion: new Date(), fechaActualizacion: new Date() },
  { _id: '3', nombre: 'Mesa 3', activo: true, fechaCreacion: new Date(), fechaActualizacion: new Date() },
  { _id: '4', nombre: 'Mesa 4', activo: true, fechaCreacion: new Date(), fechaActualizacion: new Date() },
];

const mockPlatillos: Platillo[] = [
  { 
    _id: '1', 
    nombre: 'Gordita Sencilla', 
    idTipoPlatillo: 1,
    nombreTipoPlatillo: 'Gorditas',
    precio: 25, 
    descripcion: 'Gordita de maíz rellena',
    activo: true,
    fechaCreacion: new Date(),
    fechaActualizacion: new Date()
  },
  { 
    _id: '2', 
    nombre: 'Gordita Especial', 
    idTipoPlatillo: 1,
    nombreTipoPlatillo: 'Gorditas',
    precio: 35, 
    descripcion: 'Gordita con extra ingredientes',
    activo: true,
    fechaCreacion: new Date(),
    fechaActualizacion: new Date()
  },
  { 
    _id: '3', 
    nombre: 'Quesadilla Chica', 
    idTipoPlatillo: 2,
    nombreTipoPlatillo: 'Quesadillas',
    precio: 20, 
    descripcion: 'Quesadilla pequeña',
    activo: true,
    fechaCreacion: new Date(),
    fechaActualizacion: new Date()
  },
  { 
    _id: '4', 
    nombre: 'Quesadilla Grande', 
    idTipoPlatillo: 2,
    nombreTipoPlatillo: 'Quesadillas',
    precio: 30, 
    descripcion: 'Quesadilla familiar',
    activo: true,
    fechaCreacion: new Date(),
    fechaActualizacion: new Date()
  }
];

const mockGuisos: Guiso[] = [
  { _id: '1', nombre: 'Chicharrón Prensado', descripcion: 'Chicharrón en salsa verde', activo: true, fechaCreacion: new Date(), fechaActualizacion: new Date() },
  { _id: '2', nombre: 'Pollo en Mole', descripcion: 'Pollo bañado en mole poblano', activo: true, fechaCreacion: new Date(), fechaActualizacion: new Date() },
  { _id: '3', nombre: 'Carnitas', descripcion: 'Carne de cerdo confitada', activo: true, fechaCreacion: new Date(), fechaActualizacion: new Date() },
  { _id: '4', nombre: 'Requesón', descripcion: 'Queso requesón con hierbas', activo: true, fechaCreacion: new Date(), fechaActualizacion: new Date() }
];

class MockApiService {
  private token: string | null = 'mock-token';

  // Mock auth methods
  async login(email: string, password: string): Promise<ApiResponse<{ token: string; user: any }>> {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    
    if (email === 'test@test.com' && password === 'password123') {
      return {
        success: true,
        data: {
          token: 'mock-token',
          user: { 
            _id: '1', 
            nombre: 'Usuario Mesero', 
            email: 'test@test.com',
            nombreTipoUsuario: 'Mesero'
          }
        }
      };
    }
    
    if (email === 'admin@test.com' && password === 'password123') {
      return {
        success: true,
        data: {
          token: 'mock-token',
          user: { 
            _id: '2', 
            nombre: 'Usuario Admin', 
            email: 'admin@test.com',
            nombreTipoUsuario: 'Admin'
          }
        }
      };
    }
    
    if (email === 'despachador@test.com' && password === 'password123') {
      return {
        success: true,
        data: {
          token: 'mock-token',
          user: { 
            _id: '3', 
            nombre: 'Usuario Despachador', 
            email: 'despachador@test.com',
            nombreTipoUsuario: 'Despachador'
          }
        }
      };
    }
    
    return {
      success: false,
      error: 'Credenciales inválidas'
    };
  }

  async getProfile() {
    return {
      success: true,
      data: { 
        _id: '1', 
        nombre: 'Usuario Mesero', 
        email: 'test@test.com',
        nombreTipoUsuario: 'Mesero'
      }
    };
  }

  logout() {
    this.token = null;
    localStorage.removeItem('token');
  }

  // Mock catalog methods
  async getCatalog<T>(modelo: string): Promise<ApiResponse<T[]>> {
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
    
    let items: any[] = [];
    switch (modelo.toLowerCase()) {
      case 'mesa':
        items = mockMesas;
        break;
      case 'platillo':
        items = mockPlatillos;
        break;
      case 'guiso':
        items = mockGuisos;
        break;
      default:
        items = [];
    }
    
    return {
      success: true,
      data: { items, pagination: { page: 1, limit: 20, total: items.length, pages: 1 } } as any
    };
  }

  async createCatalogItem<T>(modelo: string, item: Partial<T>) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      success: true,
      data: { ...item, _id: Math.random().toString(36).substr(2, 9) }
    };
  }

  async updateCatalogItem<T>(modelo: string, id: string, item: Partial<T>) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      success: true,
      data: { ...item, _id: id }
    };
  }

  async deleteCatalogItem(modelo: string, id: string) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
      success: true,
      data: null
    };
  }

  // Mock order methods
  async createOrden(orden: any) {
    await new Promise(resolve => setTimeout(resolve, 800));
    return {
      success: true,
      data: { _id: Math.random().toString(36).substr(2, 9), folio: 'ORD-001', ...orden }
    };
  }

  async addSuborden(ordenId: string, suborden: any) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      success: true,
      data: { _id: Math.random().toString(36).substr(2, 9), idOrden: ordenId, ...suborden }
    };
  }

  async addPlatillo(subordenId: string, platillo: any) {
    await new Promise(resolve => setTimeout(resolve, 400));
    return {
      success: true,
      data: { _id: Math.random().toString(36).substr(2, 9), idSuborden: subordenId, ...platillo }
    };
  }

  // Mock other methods with basic responses
  async getOrdenes() {
    // Mock orders with different statuses to demonstrate workflow
    const mockOrdersData = {
      ordenes: [
        {
          _id: '1',
          mesa: 'Mesa 1',
          nombreMesa: 'Mesa 1',
          estatus: 'Pendiente',
          total: 75.50,
          fecha: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
          fechaHora: new Date(Date.now() - 30 * 60 * 1000),
          folio: 'ORD-001'
        },
        {
          _id: '2',
          mesa: 'Mesa 2',
          nombreMesa: 'Mesa 2',
          estatus: 'Recepcion',
          total: 125.00,
          fecha: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
          fechaHora: new Date(Date.now() - 45 * 60 * 1000),
          folio: 'ORD-002'
        },
        {
          _id: '3',
          mesa: 'Mesa 3',
          nombreMesa: 'Mesa 3',
          estatus: 'Preparacion',
          total: 89.25,
          fecha: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
          fechaHora: new Date(Date.now() - 60 * 60 * 1000),
          folio: 'ORD-003'
        },
        {
          _id: '4',
          mesa: 'Mesa 4',
          nombreMesa: 'Mesa 4',
          estatus: 'Surtida',
          total: 156.75,
          fecha: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
          fechaHora: new Date(Date.now() - 15 * 60 * 1000),
          folio: 'ORD-004'
        },
        {
          _id: '5',
          mesa: 'Mesa 5',
          nombreMesa: 'Mesa 5',
          estatus: 'Entregada',
          total: 98.50,
          fecha: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
          fechaHora: new Date(Date.now() - 10 * 60 * 1000),
          folio: 'ORD-005'
        }
      ]
    };
    return { success: true, data: mockOrdersData };
  }

  async addProducto(ordenId: string, producto: any) {
    return { success: true, data: { _id: Math.random().toString(36).substr(2, 9), ...producto } };
  }

  async updateOrdenStatus(ordenId: string, estatus: string) {
    return { success: true, data: { _id: ordenId, estatus } };
  }

  async getInventario() {
    return { success: true, data: [] };
  }

  async recibirProductos(productos: any) {
    return { success: true, data: productos };
  }

  async ajustarInventario(productoId: string, ajuste: any) {
    return { success: true, data: { _id: productoId, ...ajuste } };
  }

  async getReporteVentas(fechaInicio?: string, fechaFin?: string) {
    // Mock sales data with proper structure
    const mockVentas = [
      {
        fecha: '2024-01-15',
        ventasTotales: 2500.00,
        gastosTotales: 800.00,
        utilidad: 1700.00,
        ordenes: 25
      },
      {
        fecha: '2024-01-16',
        ventasTotales: 3200.00,
        gastosTotales: 950.00,
        utilidad: 2250.00,
        ordenes: 32
      },
      {
        fecha: '2024-01-17',
        ventasTotales: 2800.00,
        gastosTotales: 750.00,
        utilidad: 2050.00,
        ordenes: 28
      }
    ];
    
    return { success: true, data: { data: mockVentas } };
  }

  async getReporteInventario() {
    // Mock inventory data with proper structure
    const mockInventario = [
      {
        producto: {
          _id: '1',
          nombre: 'Harina de Maíz',
          cantidad: 50,
          costo: 25.00,
          precio: 32.50,
          idTipoProducto: 1,
          nombreTipoProducto: 'Ingredientes',
          activo: true
        },
        valorTotal: 1250.00,
        stockMinimo: false
      },
      {
        producto: {
          _id: '2',
          nombre: 'Frijoles',
          cantidad: 3,
          costo: 15.00,
          precio: 19.50,
          idTipoProducto: 1,
          nombreTipoProducto: 'Ingredientes',
          activo: true
        },
        valorTotal: 45.00,
        stockMinimo: true
      },
      {
        producto: {
          _id: '3',
          nombre: 'Queso',
          cantidad: 25,
          costo: 45.00,
          precio: 58.50,
          idTipoProducto: 1,
          nombreTipoProducto: 'Ingredientes',
          activo: true
        },
        valorTotal: 1125.00,
        stockMinimo: false
      }
    ];
    
    return { success: true, data: { data: mockInventario } };
  }

  async getReporteGastos(fechaInicio?: string, fechaFin?: string) {
    // Mock expenses data
    const mockGastos = [
      {
        _id: '1',
        fecha: new Date('2024-01-15'),
        tipoGasto: 'Compra Ingredientes',
        descripcion: 'Compra semanal de ingredientes',
        monto: 500.00,
        usuario: 'Admin'
      },
      {
        _id: '2',
        fecha: new Date('2024-01-16'),
        tipoGasto: 'Servicios',
        descripcion: 'Pago de luz',
        monto: 300.00,
        usuario: 'Encargado'
      },
      {
        _id: '3',
        fecha: new Date('2024-01-17'), 
        tipoGasto: 'Mantenimiento',
        descripcion: 'Reparación equipo',
        monto: 150.00,
        usuario: 'Admin'
      }
    ];
    
    return { success: true, data: { data: mockGastos } };
  }

  async getProductosVendidos(fechaInicio?: string, fechaFin?: string, limit?: number) {
    // Mock best selling products
    const mockProductos = [
      {
        producto: '1',
        nombre: 'Gordita Sencilla',
        cantidadVendida: 85,
        totalVendido: 2125.00
      },
      {
        producto: '2',
        nombre: 'Gordita Especial',
        cantidadVendida: 65,
        totalVendido: 2275.00
      },
      {
        producto: '3',
        nombre: 'Quesadilla',
        cantidadVendida: 45,
        totalVendido: 1350.00
      },
      {
        producto: '4',
        nombre: 'Refresco',
        cantidadVendida: 120,
        totalVendido: 600.00
      }
    ];
    
    return { success: true, data: { data: mockProductos.slice(0, limit || 10) } };
  }

  async getReporteUsuarios(fechaInicio?: string, fechaFin?: string) {
    // Mock user activity data
    const mockUsuarios = [
      {
        usuario: 'Juan Pérez',
        cantidadOrdenes: 45,
        totalVentas: 3250.00,
        promedioVenta: 72.22,
        cantidadGastos: 5,
        totalGastos: 450.00
      },
      {
        usuario: 'María García',
        cantidadOrdenes: 38,
        totalVentas: 2890.00,
        promedioVenta: 76.05,
        cantidadGastos: 3,
        totalGastos: 200.00
      },
      {
        usuario: 'Carlos López',
        cantidadOrdenes: 29,
        totalVentas: 2100.00,
        promedioVenta: 72.41,
        cantidadGastos: 2,
        totalGastos: 120.00
      }
    ];
    
    return { success: true, data: { data: mockUsuarios } };
  }

  async getReporteMesas(fechaInicio?: string, fechaFin?: string) {
    // Mock table usage data
    const mockMesas = [
      {
        mesa: 'Mesa 1',
        cantidadOrdenes: 35,
        totalVentas: 2800.00,
        promedioVenta: 80.00,
        tiempoPromedioMinutos: 45
      },
      {
        mesa: 'Mesa 2',
        cantidadOrdenes: 42,
        totalVentas: 3360.00,
        promedioVenta: 80.00,
        tiempoPromedioMinutos: 38
      },
      {
        mesa: 'Mesa 3',
        cantidadOrdenes: 28,
        totalVentas: 2240.00,
        promedioVenta: 80.00,
        tiempoPromedioMinutos: 52
      },
      {
        mesa: 'Para Llevar',
        cantidadOrdenes: 67,
        totalVentas: 4020.00,
        promedioVenta: 60.00,
        tiempoPromedioMinutos: 15
      }
    ];
    
    return { success: true, data: { data: mockMesas } };
  }

  async getReporteResumen(fechaInicio?: string, fechaFin?: string) {
    // Mock summary data
    const mockResumen = {
      ventas: {
        totalVentas: 8500.00,
        cantidadOrdenes: 85,
        promedioVenta: 100.00
      },
      gastos: {
        totalGastos: 2500.00,
        cantidadGastos: 10
      },
      inventario: {
        totalProductos: 25,
        stockBajo: 5,
        valorInventario: 15750.00
      },
      ordenesHoy: 12,
      utilidad: 6000.00
    };
    
    return { success: true, data: { data: mockResumen } };
  }

  async getOrdenDetails(ordenId: string) {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Mock order details with products and platillos
    const mockOrderDetails = {
      _id: ordenId,
      mesa: 'Mesa 1',
      nombreMesa: 'Mesa 1',
      estatus: 'Preparacion',
      total: 125.00,
      fecha: new Date(Date.now() - 45 * 60 * 1000),
      fechaHora: new Date(Date.now() - 45 * 60 * 1000),
      folio: 'ORD-002',
      subordenes: [
        {
          _id: 'sub1',
          nombre: 'Suborden 1',
          idOrden: ordenId
        }
      ],
      productos: [
        {
          _id: 'prod1',
          idOrden: ordenId,
          nombreProducto: 'Coca Cola',
          cantidad: 2,
          precio: 15.00,
          subtotal: 30.00,
          listo: false,
          entregado: false
        },
        {
          _id: 'prod2',
          idOrden: ordenId,
          nombreProducto: 'Agua',
          cantidad: 1,
          precio: 10.00,
          subtotal: 10.00,
          listo: true,
          entregado: false
        }
      ],
      platillos: [
        {
          _id: 'plat1',
          idSuborden: 'sub1',
          nombrePlatillo: 'Gordita Sencilla',
          nombreGuiso: 'Chicharrón Prensado',
          cantidad: 2,
          precio: 25.00,
          subtotal: 50.00,
          listo: false,
          entregado: false
        },
        {
          _id: 'plat2',
          idSuborden: 'sub1',
          nombrePlatillo: 'Quesadilla Grande',
          nombreGuiso: 'Requesón',
          cantidad: 1,
          precio: 35.00,
          subtotal: 35.00,
          listo: true,
          entregado: false
        }
      ]
    };
    
    return { success: true, data: mockOrderDetails };
  }

  async markProductoListo(productoId: string) {
    await new Promise(resolve => setTimeout(resolve, 200));
    return { success: true, data: { _id: productoId, listo: true } };
  }

  async markPlatilloListo(platilloId: string) {
    await new Promise(resolve => setTimeout(resolve, 200));
    return { success: true, data: { _id: platilloId, listo: true } };
  }

  async markProductoEntregado(productoId: string) {
    await new Promise(resolve => setTimeout(resolve, 200));
    return { success: true, data: { _id: productoId, entregado: true } };
  }

  async markPlatilloEntregado(platilloId: string) {
    await new Promise(resolve => setTimeout(resolve, 200));
    return { success: true, data: { _id: platilloId, entregado: true } };
  }
}

export const mockApiService = new MockApiService();