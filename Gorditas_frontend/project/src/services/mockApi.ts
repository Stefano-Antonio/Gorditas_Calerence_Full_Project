import { ApiResponse, Mesa, Platillo, Guiso } from '../types';

// Mock data for testing
const mockMesas: Mesa[] = [
  { _id: '64f8c2e1a2b3c4d5e6f7a8b1', nombre: 'Mesa 1', activo: true, fechaCreacion: new Date(), fechaActualizacion: new Date() },
  { _id: '64f8c2e1a2b3c4d5e6f7a8b2', nombre: 'Mesa 2', activo: true, fechaCreacion: new Date(), fechaActualizacion: new Date() },
  { _id: '64f8c2e1a2b3c4d5e6f7a8b3', nombre: 'Mesa 3', activo: true, fechaCreacion: new Date(), fechaActualizacion: new Date() },
  { _id: '64f8c2e1a2b3c4d5e6f7a8b4', nombre: 'Mesa 4', activo: true, fechaCreacion: new Date(), fechaActualizacion: new Date() },
];

const mockPlatillos: Platillo[] = [
  { 
    _id: '64f8c2e1a2b3c4d5e6f7a8c1', 
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
    _id: '64f8c2e1a2b3c4d5e6f7a8c2', 
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
    _id: '64f8c2e1a2b3c4d5e6f7a8c3', 
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
    _id: '64f8c2e1a2b3c4d5e6f7a8c4', 
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
  { _id: '64f8c2e1a2b3c4d5e6f7a8d1', nombre: 'Chicharrón Prensado', descripcion: 'Chicharrón en salsa verde', activo: true, fechaCreacion: new Date(), fechaActualizacion: new Date() },
  { _id: '64f8c2e1a2b3c4d5e6f7a8d2', nombre: 'Pollo en Mole', descripcion: 'Pollo bañado en mole poblano', activo: true, fechaCreacion: new Date(), fechaActualizacion: new Date() },
  { _id: '64f8c2e1a2b3c4d5e6f7a8d3', nombre: 'Carnitas', descripcion: 'Carne de cerdo confitada', activo: true, fechaCreacion: new Date(), fechaActualizacion: new Date() },
  { _id: '64f8c2e1a2b3c4d5e6f7a8d4', nombre: 'Requesón', descripcion: 'Queso requesón con hierbas', activo: true, fechaCreacion: new Date(), fechaActualizacion: new Date() }
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
    return { success: true, data: [] };
  }

  async getReporteInventario() {
    return { success: true, data: [] };
  }

  async getReporteGastos(fechaInicio?: string, fechaFin?: string) {
    return { success: true, data: [] };
  }

  async getProductosVendidos() {
    return { success: true, data: [] };
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
          _id: '64f8c2e1a2b3c4d5e6f7e01',
          nombre: 'Suborden 1',
          idOrden: ordenId
        }
      ],
      productos: [
        {
          _id: '64f8c2e1a2b3c4d5e6f7e11',
          idOrden: ordenId,
          nombreProducto: 'Coca Cola',
          cantidad: 2,
          precio: 15.00,
          subtotal: 30.00,
          listo: false,
          entregado: false
        },
        {
          _id: '64f8c2e1a2b3c4d5e6f7e12',
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
          _id: '64f8c2e1a2b3c4d5e6f7e21',
          idSuborden: '64f8c2e1a2b3c4d5e6f7e01',
          nombrePlatillo: 'Gordita Sencilla',
          nombreGuiso: 'Chicharrón Prensado',
          cantidad: 2,
          precio: 25.00,
          subtotal: 50.00,
          listo: false,
          entregado: false
        },
        {
          _id: '64f8c2e1a2b3c4d5e6f7e22',
          idSuborden: '64f8c2e1a2b3c4d5e6f7e01',
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