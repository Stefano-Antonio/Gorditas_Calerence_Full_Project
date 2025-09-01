import { ApiResponse } from '../types';

const API_BASE_URL = 'http://localhost:3000/api';

class ApiService {
  private token: string | null = localStorage.getItem('token');

  private async request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  
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
    return {
      success: false,
      error: 'Network error occurred',
    };
  }
}

  // Auth methods
  async login(email: string, password: string) {
  const response = await this.request<{ token: string; user: any }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  if (response.success && response.data?.token) {
    this.token = response.data.token;
    localStorage.setItem('token', this.token);
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
  async getReporteVentas(fechaInicio?: string, fechaFin?: string) {
    const params = new URLSearchParams();
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);
    
    return this.request(`/reportes/ventas?${params.toString()}`);
  }

  async getReporteInventario() {
    return this.request('/reportes/inventario');
  }

  async getReporteGastos(fechaInicio?: string, fechaFin?: string) {
    const params = new URLSearchParams();
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);
    
    return this.request(`/reportes/gastos?${params.toString()}`);
  }

  async getProductosVendidos() {
    return this.request('/reportes/productos-vendidos');
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
}

export const apiService = new ApiService();