import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  ShoppingCart, 
  Edit3, 
  Package, 
  Truck, 
  CreditCard, 
  BarChart3, 
  Settings,
  ChefHat,
  PlusCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { MenuItem } from '../../types';

const menuItems: MenuItem[] = [
  { id: 'dashboard', label: 'Panel Principal', icon: 'Home', path: '/', roles: ['Admin', 'Encargado', 'Mesero', 'Despachador', 'Cocinero'] },
  { id: 'nueva-orden', label: 'Nueva Orden', icon: 'PlusCircle', path: '/nueva-orden', roles: ['Admin', 'Encargado', 'Mesero'] },
  { id: 'editar-orden', label: 'Editar Orden', icon: 'Edit3', path: '/editar-orden', roles: ['Admin', 'Encargado', 'Mesero'] },
  { id: 'surtir-orden', label: 'Surtir Orden', icon: 'ChefHat', path: '/surtir-orden', roles: ['Admin', 'Despachador', 'Cocinero'] },
  { id: 'despachar', label: 'Despachar', icon: 'Truck', path: '/despachar', roles: ['Admin', 'Despachador'] },
  { id: 'recibir-productos', label: 'Recibir Productos', icon: 'Package', path: '/recibir-productos', roles: ['Admin', 'Encargado'] },
  { id: 'cobrar', label: 'Cobrar', icon: 'CreditCard', path: '/cobrar', roles: ['Admin', 'Encargado', 'Mesero'] },
  { id: 'catalogos', label: 'Catálogos', icon: 'Settings', path: '/catalogos', roles: ['Admin', 'Encargado'] },
  { id: 'reportes', label: 'Reportes', icon: 'BarChart3', path: '/reportes', roles: ['Admin', 'Encargado'] },
];

const iconMap: { [key: string]: React.ComponentType<any> } = {
  Home,
  ShoppingCart,
  Edit3,
  Package,
  Truck,
  CreditCard,
  BarChart3,
  Settings,
  ChefHat,
  PlusCircle,
};

const Sidebar: React.FC = () => {
  const { hasPermission } = useAuth();

  const filteredMenuItems = menuItems.filter(item => 
    hasPermission(item.roles as any)
  );

  return (
    <aside className="w-64 bg-gray-900 min-h-screen">
      <nav className="mt-8">
        <div className="px-4">
          <ul className="space-y-2">
            {filteredMenuItems.map((item) => {
              const Icon = iconMap[item.icon];
              return (
                <li key={item.id}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-orange-600 text-white'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }`
                    }
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;