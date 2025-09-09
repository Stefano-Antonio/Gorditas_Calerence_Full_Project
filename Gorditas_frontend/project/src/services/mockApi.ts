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
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return { 
      success: true, 
      data: {
        ordenes: [
          {
            _id: '1',
            fechaHora: new Date(),
            total: 250.00,
            nombreMesa: 'Mesa 1',
            estatus: 'Entregada'
          },
          {
            _id: '2',
            fechaHora: new Date(),
            total: 180.50,
            nombreMesa: 'Mesa 2',
            estatus: 'Entregada'
          }
        ],
        resumen: {
          totalVentas: 430.50,
          cantidadOrdenes: 2,
          promedioVenta: 215.25
        },
        ventasPorDia: [
          { _id: '2023-12-01', ventas: 430.50, ordenes: 2 }
        ],
        ventasPorTipo: [
          { _id: 'Local', ventas: 430.50, ordenes: 2 }
        ],
        pagination: {
          page: 1,
          limit: 50,
          total: 2,
          totalPages: 1
        }
      }
    };
  }

  async getReporteInventario() {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return { 
      success: true, 
      data: {
        productos: [
          {
            producto: {
              _id: '1',
              nombre: 'Harina de Maíz',
              cantidad: 50,
              costo: 25.00,
              precio: 30.00,
              tipoProducto: 'Ingredientes'
            },
            valorTotal: 1250.00,
            stockMinimo: false,
            stockAgotado: false
          },
          {
            producto: {
              _id: '2',
              nombre: 'Queso Oaxaca',
              cantidad: 3,
              costo: 45.00,
              precio: 60.00,
              tipoProducto: 'Lácteos'
            },
            valorTotal: 135.00,
            stockMinimo: true,
            stockAgotado: false
          }
        ],
        resumen: {
          totalProductos: 2,
          stockBajo: 1,
          stockAgotado: 0,
          valorInventario: 1385.00
        },
        alertas: {
          stockBajo: [
            {
              _id: '2',
              nombre: 'Queso Oaxaca',
              cantidad: 3,
              costo: 45.00
            }
          ],
          stockAlto: []
        },
        pagination: {
          page: 1,
          limit: 50,
          total: 2,
          totalPages: 1
        }
      }
    };
  }

  async getReporteGastos(fechaInicio?: string, fechaFin?: string) {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return { 
      success: true, 
      data: {
        gastos: [
          {
            _id: '1',
            fecha: new Date(),
            tipoGasto: 'Ingredientes',
            descripcion: 'Compra de harina',
            monto: 500.00,
            usuario: 'Juan Pérez'
          },
          {
            _id: '2',
            fecha: new Date(),
            tipoGasto: 'Servicios',
            descripcion: 'Pago de luz',
            monto: 750.00,
            usuario: 'Admin'
          }
        ],
        resumen: {
          totalGastos: 1250.00,
          cantidadGastos: 2,
          promedioGasto: 625.00
        },
        gastosPorTipo: [
          { _id: 'Servicios', gastos: 750.00, cantidad: 1 },
          { _id: 'Ingredientes', gastos: 500.00, cantidad: 1 }
        ],
        gastosPorDia: [
          { _id: '2023-12-01', gastos: 1250.00, cantidad: 2 }
        ],
        gastosPorUsuario: [
          { _id: 'Admin', gastos: 750.00, cantidad: 1 },
          { _id: 'Juan Pérez', gastos: 500.00, cantidad: 1 }
        ],
        pagination: {
          page: 1,
          limit: 50,
          total: 2,
          totalPages: 1
        }
      }
    };
  }

  async getProductosVendidos() {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return { 
      success: true, 
      data: {
        productos: [
          {
            producto: '1',
            nombre: 'Coca Cola',
            cantidadVendida: 15,
            totalVendido: 225.00,
            vecesVendido: 8
          },
          {
            producto: '2',
            nombre: 'Agua Natural',
            cantidadVendida: 10,
            totalVendido: 150.00,
            vecesVendido: 6
          }
        ],
        platillos: [
          {
            platillo: '1',
            nombre: 'Gordita de Chicharrón',
            cantidadVendida: 25,
            totalVendido: 625.00,
            vecesVendido: 12
          },
          {
            platillo: '2',
            nombre: 'Quesadilla Grande',
            cantidadVendida: 18,
            totalVendido: 540.00,
            vecesVendido: 9
          }
        ],
        resumen: {
          totalProductosVendidos: 25,
          totalPlatillosVendidos: 43,
          ingresosTotalProductos: 375.00,
          ingresosTotalPlatillos: 1165.00
        }
      }
    };
  }

  async getReporteUsuarios(fechaInicio?: string, fechaFin?: string) {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return { 
      success: true, 
      data: {
        usuarios: [
          {
            idUsuario: 1,
            nombreUsuario: 'Juan Mesero',
            totalOrdenes: 15,
            totalVentas: 2250.00,
            promedioVenta: 150.00
          },
          {
            idUsuario: 2,
            nombreUsuario: 'María Mesera',
            totalOrdenes: 12,
            totalVentas: 1800.00,
            promedioVenta: 150.00
          }
        ],
        resumen: {
          totalUsuariosActivos: 2,
          ventasTotales: 4050.00,
          ordenesTotales: 27
        },
        pagination: {
          page: 1,
          limit: 50,
          total: 2,
          totalPages: 1
        }
      }
    };
  }

  async getReporteMesas(fechaInicio?: string, fechaFin?: string) {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return { 
      success: true, 
      data: {
        mesas: [
          {
            idMesa: 1,
            nombreMesa: 'Mesa 1',
            totalOrdenes: 8,
            totalVentas: 1200.00,
            promedioVenta: 150.00,
            ultimaOrden: new Date()
          },
          {
            idMesa: 2,
            nombreMesa: 'Mesa 2',
            totalOrdenes: 6,
            totalVentas: 900.00,
            promedioVenta: 150.00,
            ultimaOrden: new Date()
          }
        ],
        resumen: {
          totalMesas: 2,
          ventasTotales: 2100.00,
          ordenesTotales: 14,
          mesaMasVentas: {
            idMesa: 1,
            nombreMesa: 'Mesa 1',
            totalVentas: 1200.00
          }
        },
        pagination: {
          page: 1,
          limit: 50,
          total: 2,
          totalPages: 1
        }
      }
    };
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