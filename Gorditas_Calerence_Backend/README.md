# Restaurant API

API REST para gestión de restaurante desarrollada con Node.js, Express, TypeScript y MongoDB.

## 🚀 Características

- **Gestión completa de restaurante**: Órdenes, inventario, catálogos y reportes
- **Autenticación JWT**: Sistema de autenticación seguro con roles
- **Base de datos MongoDB**: Usando Mongoose para modelado de datos
- **TypeScript**: Tipado estático para mayor robustez
- **Arquitectura modular**: Código organizado y mantenible
- **Validaciones**: Usando Joi para validación de datos
- **Seguridad**: Helmet, CORS y manejo de errores

## 📋 Requisitos

- Node.js 18+
- MongoDB 4.4+
- npm o yarn

## 🛠️ Instalación

1. Clonar el repositorio:
```bash
git clone <repository-url>
cd restaurant-api
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
```bash
cp .env.example .env
```

4. Editar el archivo `.env` con tus configuraciones:
```env
MONGODB_URI=mongodb://localhost:27017/restaurant-db
JWT_SECRET=tu-jwt-secret-muy-seguro
PORT=3000
```

5. Construir el proyecto:
```bash
npm run build
```

6. Iniciar el servidor de desarrollo:
```bash
npm run dev
```

## 📁 Estructura del Proyecto

```
src/
├── config/          # Configuración de base de datos
├── middleware/      # Middlewares (auth, validación, errores)
├── models/          # Modelos de MongoDB
├── routes/          # Rutas de la API
├── types/           # Tipos TypeScript
├── utils/           # Utilidades y helpers
└── server.ts        # Punto de entrada
```

## 🔗 API Endpoints

### Autenticación
- `POST /api/v1/auth/login` - Iniciar sesión
- `GET /api/v1/auth/profile` - Obtener perfil del usuario

### Órdenes
- `GET /api/v1/ordenes` - Listar órdenes
- `POST /api/v1/ordenes/nueva` - Crear nueva orden
- `POST /api/v1/ordenes/:id/suborden` - Agregar suborden
- `POST /api/v1/ordenes/suborden/:id/platillo` - Agregar platillo
- `POST /api/v1/ordenes/:id/producto` - Agregar producto
- `PUT /api/v1/ordenes/:id/estatus` - Cambiar estatus

### Inventario
- `GET /api/v1/inventario` - Consultar inventario
- `POST /api/v1/inventario/recibir` - Recibir productos
- `PUT /api/v1/inventario/ajustar/:id` - Ajustar inventario

### Reportes
- `GET /api/v1/reportes/ventas` - Reporte de ventas
- `GET /api/v1/reportes/inventario` - Reporte de inventario
- `GET /api/v1/reportes/gastos` - Reporte de gastos
- `GET /api/v1/reportes/productos-vendidos` - Productos más vendidos

### Catálogos (CRUD)
- `GET /api/v1/catalogos/{modelo}` - Listar
- `POST /api/v1/catalogos/{modelo}` - Crear
- `PUT /api/v1/catalogos/{modelo}/:id` - Actualizar
- `DELETE /api/v1/catalogos/{modelo}/:id` - Eliminar

**Modelos disponibles**: `guiso`, `tipoproducto`, `producto`, `tipoplatillo`, `platillo`, `tipousuario`, `usuario`, `tipoorden`, `mesa`, `tipogasto`

## 🔒 Roles y Permisos

### Admin
- Acceso completo a todas las funcionalidades

### Encargado
- Gestión de catálogos, inventario y reportes
- No puede eliminar registros críticos

### Mesero
- Crear y editar órdenes en estatus "Recepcion"

### Despachador
- Surtir órdenes y marcar productos como entregados

### Cocinero
- Ver órdenes en preparación

## 📊 Modelos de Datos

### Catálogos Maestros
- **Guisos**: Tipos de guisos disponibles
- **TipoProducto**: Categorías de productos
- **Productos**: Inventario de productos
- **TipoPlatillo**: Tipos de platillos
- **Platillos**: Platillos del menú
- **TipoUsuario**: Roles de usuarios
- **Usuarios**: Usuarios del sistema
- **TipoOrden**: Tipos de orden (mesa, para llevar, etc.)
- **Mesas**: Mesas del restaurante
- **TipoGasto**: Categorías de gastos

### Transaccionales
- **Ordenes**: Órdenes principales
- **Subordenes**: Subórdenes para organizar platillos
- **OrdenDetalleProducto**: Productos en órdenes
- **OrdenDetallePlatillo**: Platillos en subórdenes
- **Gastos**: Registro de gastos

## 🧪 Testing

```bash
npm test
```

## 📝 Contribuir

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE.md](LICENSE.md) para más detalles.

## 🤝 Soporte

Para soporte, envía un email a [tu-email@ejemplo.com] o crea un issue en GitHub.