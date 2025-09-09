import { ApiResponse } from '../types';
import { mockApiService } from './mockApi';
const API_BASE_URL = 'http://localhost:5000/api';
const USE_MOCK_API = import.meta.env.DEV && !import.meta.env.VITE_DISABLE_MOCK;
class ApiService {
  async getOrden(ordenId: string) {
    return this.request(`/ordenes/${ordenId}`);
  }
  private token: string | null = localStorage.getItem('token');
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    // Use mock API if enabled and in development mode
    if (USE_MOCK_API) {
      return this.handleMockRequest<T>(endpoint, options);
    }
    const url = `${API_BASE_URL}${endpoint}`;
    // Siempre obtener el token actualizado de localStorage
    this.token = localStorage.getItem('token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });
      const data = await response.json();
      // Cambia aquí: respeta el campo success del backend
      if (!data.success) {
        return {
        success: false,
        error: data.message || 'Request failed',
        data: data.data,
      };
    }
    return {
      success: true,
      data: data.data,
    };
  } catch (error) {
    console.warn('🔄 Backend unavailable, falling back to mock API for:', endpoint);
    return this.handleMockRequest<T>(endpoint, options);
  }
}
  private async handleMockRequest<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const method = options.method || 'GET';
    const body = options.body ? JSON.parse(options.body as string) : null;
    // Route to appropriate mock method based on endpoint and method
    if (endpoint === '/auth/login' && method === 'POST') {
      return mockApiService.login(body.email, body.password) as Promise<ApiResponse<T>>;
    }
    
    if (endpoint === '/auth/profile') {
      return mockApiService.getProfile() as Promise<ApiResponse<T>>;
    }
    if (endpoint.startsWith('/catalogos/') && method === 'GET') {
      const modelo = endpoint.split('/')[2];
      const response = await mockApiService.getCatalog<T>(modelo);
      // If T is not an array, just return the first element or handle as needed
      return {
        ...response,
        data: (Array.isArray(response.data) ? response.data[0] : response.data) as T,
        // Remove or fix 'items' property if present
        items: Array.isArray(response.data) ? response.data as T[] : undefined
      };
    }
    if (endpoint.startsWith('/catalogos/') && method === 'POST') {
      const modelo = endpoint.split('/')[2];
      return mockApiService.createCatalogItem(modelo, body) as Promise<ApiResponse<T>>;
    }

    if (endpoint === '/ordenes' && method === 'GET') {
      return mockApiService.getOrdenes() as Promise<ApiResponse<T>>;
    }

    if (endpoint === '/ordenes/nueva' && method === 'POST') {
      return mockApiService.createOrden(body) as Promise<ApiResponse<T>>;
    }
    if (endpoint.includes('/suborden') && method === 'POST') {
      const ordenId = endpoint.split('/')[2];
      return mockApiService.addSuborden(ordenId, body) as Promise<ApiResponse<T>>;
    }
    if (endpoint.includes('/platillo') && method === 'POST') {
      const subordenId = endpoint.split('/')[3];
      return mockApiService.addPlatillo(subordenId, body) as Promise<ApiResponse<T>>;
    }

    if (endpoint.includes('/ordenes/') && endpoint.includes('/estatus') && method === 'PUT') {
      const ordenId = endpoint.split('/')[2];
      return mockApiService.updateOrdenStatus(ordenId, body.estatus) as Promise<ApiResponse<T>>;
    }

    if (endpoint.includes('/ordenes/') && !endpoint.includes('/estatus') && method === 'GET') {
      const ordenId = endpoint.split('/')[2];
      return mockApiService.getOrdenDetails(ordenId) as Promise<ApiResponse<T>>;
    }

    if (endpoint.includes('/producto/') && endpoint.includes('/listo') && method === 'PUT') {
      const productoId = endpoint.split('/')[3];
      return mockApiService.markProductoListo(productoId) as Promise<ApiResponse<T>>;
    }

    if (endpoint.includes('/platillo/') && endpoint.includes('/listo') && method === 'PUT') {
      const platilloId = endpoint.split('/')[3];
      return mockApiService.markPlatilloListo(platilloId) as Promise<ApiResponse<T>>;
    }

    if (endpoint.includes('/producto/') && endpoint.includes('/entregado') && method === 'PUT') {
      const productoId = endpoint.split('/')[3];
      return mockApiService.markProductoEntregado(productoId) as Promise<ApiResponse<T>>;
    }

    if (endpoint.includes('/platillo/') && endpoint.includes('/entregado') && method === 'PUT') {
      const platilloId = endpoint.split('/')[3];
      return mockApiService.markPlatilloEntregado(platilloId) as Promise<ApiResponse<T>>;
    }

    if (endpoint === '/inventario' && method === 'GET') {
      return mockApiService.getInventario() as Promise<ApiResponse<T>>;
    }

    // Reports endpoints
    if (endpoint.startsWith('/reportes/ventas') && method === 'GET') {
      const params = new URLSearchParams(endpoint.split('?')[1] || '');
      const fechaInicio = params.get('fechaInicio');
      const fechaFin = params.get('fechaFin');
      return mockApiService.getReporteVentas(fechaInicio || undefined, fechaFin || undefined) as Promise<ApiResponse<T>>;
    }

    if (endpoint.startsWith('/reportes/inventario') && method === 'GET') {
      return mockApiService.getReporteInventario() as Promise<ApiResponse<T>>;
    }

    if (endpoint.startsWith('/reportes/gastos') && method === 'GET') {
      const params = new URLSearchParams(endpoint.split('?')[1] || '');
      const fechaInicio = params.get('fechaInicio');
      const fechaFin = params.get('fechaFin');
      return mockApiService.getReporteGastos(fechaInicio || undefined, fechaFin || undefined) as Promise<ApiResponse<T>>;
    }

    if (endpoint.startsWith('/reportes/productos-vendidos') && method === 'GET') {
      return mockApiService.getProductosVendidos() as Promise<ApiResponse<T>>;
    }

    if (endpoint.startsWith('/reportes/usuarios') && method === 'GET') {
      const params = new URLSearchParams(endpoint.split('?')[1] || '');
      const fechaInicio = params.get('fechaInicio');
      const fechaFin = params.get('fechaFin');
      return mockApiService.getReporteUsuarios(fechaInicio || undefined, fechaFin || undefined) as Promise<ApiResponse<T>>;
    }

    if (endpoint.startsWith('/reportes/mesas') && method === 'GET') {
      const params = new URLSearchParams(endpoint.split('?')[1] || '');
      const fechaInicio = params.get('fechaInicio');
      const fechaFin = params.get('fechaFin');
      return mockApiService.getReporteMesas(fechaInicio || undefined, fechaFin || undefined) as Promise<ApiResponse<T>>;
    }

    // Default mock response
    return {
      success: true,
      data: {} as T
    };
  }
  // Auth methods
  async login(email: string, password: string) {
  const response = await this.request<{ token: string; user: any }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (response.success && response.data?.token) {
    this.token = response.data.token;
    if (this.token !== null) {
      localStorage.setItem('token', this.token);
    }
  }
  return response;
}
  async getProfile() {
    return this.request('/auth/profile');
  }
  logout() {
    this.token = null;
    localStorage.removeItem('token');
  }
  // Orders methods
  async getOrdenes() {
    return this.request('/ordenes');
  }
  async createOrden(orden: any) {
    return this.request('/ordenes/nueva', {
      method: 'POST',
      body: JSON.stringify(orden),
    });
  }
  async addSuborden(ordenId: string, suborden: any) {
    return this.request(`/ordenes/${ordenId}/suborden`, {
      method: 'POST',
      body: JSON.stringify(suborden),
    });
  }
  async addPlatillo(subordenId: string, platillo: any) {
    return this.request(`/ordenes/suborden/${subordenId}/platillo`, {
      method: 'POST',
      body: JSON.stringify(platillo),
    });
  }
  async addProducto(ordenId: string, producto: any) {
    return this.request(`/ordenes/${ordenId}/producto`, {
      method: 'POST',
      body: JSON.stringify(producto),
    });
  }
  async updateOrdenStatus(ordenId: string, estatus: string) {
    return this.request(`/ordenes/${ordenId}/estatus`, {
      method: 'PUT',
      body: JSON.stringify({ estatus }),
    });
  }
  async verifyOrden(ordenId: string, isComplete: boolean) {
    return this.request(`/ordenes/${ordenId}/verificar`, {
      method: 'PUT',
      body: JSON.stringify({ isComplete }),
    });
  }

  async getOrdenDetails(ordenId: string) {
    return this.request(`/ordenes/${ordenId}`);
  }

  async markProductoListo(productoId: string) {
    return this.request(`/ordenes/producto/${productoId}/listo`, {
      method: 'PUT',
    });
  }

  async markPlatilloListo(platilloId: string) {
    return this.request(`/ordenes/platillo/${platilloId}/listo`, {
      method: 'PUT',
    });
  }

  async markProductoEntregado(productoId: string) {
    return this.request(`/ordenes/producto/${productoId}/entregado`, {
      method: 'PUT',
    });
  }

  async markPlatilloEntregado(platilloId: string) {
    return this.request(`/ordenes/platillo/${platilloId}/entregado`, {
      method: 'PUT',
    });
  }
  // Inventory methods
  async getInventario() {
    return this.request('/inventario');
  }
  async recibirProductos(productos: any) {
    return this.request('/inventario/recibir', {
      method: 'POST',
      body: JSON.stringify(productos),
    });
  }
  async ajustarInventario(productoId: string, ajuste: any) {
    return this.request(`/inventario/ajustar/${productoId}`, {
      method: 'PUT',
      body: JSON.stringify(ajuste),
    });
  }
  // Reports methods
  async getReporteVentas(fechaInicio?: string, fechaFin?: string, tipoOrden?: string, mesa?: string, page = 1, limit = 50) {
    const params = new URLSearchParams();
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);
    if (tipoOrden) params.append('tipoOrden', tipoOrden);
    if (mesa) params.append('mesa', mesa);
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    return this.request(`/reportes/ventas?${params.toString()}`);
  }
  
  async getReporteInventario(categoria?: string, stockMinimo?: number, page = 1, limit = 50) {
    const params = new URLSearchParams();
    if (categoria) params.append('categoria', categoria);
    if (stockMinimo) params.append('stockMinimo', stockMinimo.toString());
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    return this.request(`/reportes/inventario?${params.toString()}`);
  }
  
  async getReporteGastos(fechaInicio?: string, fechaFin?: string, tipoGasto?: string, usuario?: string, page = 1, limit = 50) {
    const params = new URLSearchParams();
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);
    if (tipoGasto) params.append('tipoGasto', tipoGasto);
    if (usuario) params.append('usuario', usuario);
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    return this.request(`/reportes/gastos?${params.toString()}`);
  }
  
  async getProductosVendidos(fechaInicio?: string, fechaFin?: string, limit = 10, tipoProducto?: string) {
    const params = new URLSearchParams();
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);
    if (tipoProducto) params.append('tipoProducto', tipoProducto);
    params.append('limit', limit.toString());
    
    return this.request(`/reportes/productos-vendidos?${params.toString()}`);
  }

  async getReporteUsuarios(fechaInicio?: string, fechaFin?: string, tipoUsuario?: string, page = 1, limit = 50) {
    const params = new URLSearchParams();
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);
    if (tipoUsuario) params.append('tipoUsuario', tipoUsuario);
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    return this.request(`/reportes/usuarios?${params.toString()}`);
  }

  async getReporteMesas(fechaInicio?: string, fechaFin?: string, page = 1, limit = 50) {
    const params = new URLSearchParams();
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    return this.request(`/reportes/mesas?${params.toString()}`);
  }
  // Catalogs methods
  async getCatalog<T>(modelo: string): Promise<ApiResponse<T[]>> {
    return this.request(`/catalogos/${modelo}`);
  }
  async createCatalogItem<T>(modelo: string, item: Partial<T>) {
    return this.request(`/catalogos/${modelo}`, {
      method: 'POST',
      body: JSON.stringify(item),
    });
  }
  async updateCatalogItem<T>(modelo: string, id: string, item: Partial<T>) {
    return this.request(`/catalogos/${modelo}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(item),
    });
  }
  async deleteCatalogItem(modelo: string, id: string) {
    return this.request(`/catalogos/${modelo}/${id}`, {
      method: 'DELETE',
    });
  }

  async removePlatillo(platilloId: string) {
    return this.request(`/ordenes/platillo/${platilloId}`, {
      method: 'DELETE',
    });
  }

  async removeProducto(productoId: string) {
    return this.request(`/ordenes/producto/${productoId}`, {
      method: 'DELETE',
    });
  }
}
export const apiService = new ApiService();