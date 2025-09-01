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
          user: { id: '1', nombre: 'Usuario Test', email: 'test@test.com' }
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
      data: { id: '1', nombre: 'Usuario Test', email: 'test@test.com' }
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
    return { success: true, data: [] };
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
}

export const mockApiService = new MockApiService();