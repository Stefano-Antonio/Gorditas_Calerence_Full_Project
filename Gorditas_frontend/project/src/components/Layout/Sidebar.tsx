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
  BookOpen,
  ChefHat,
  PlusCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { MenuItem } from '../../types';

const menuItems: MenuItem[] = [
  { id: 'dashboard', label: 'Panel Principal', icon: 'Home', path: '/', roles: ['Admin', 'Encargado'] },
  { id: 'nueva-orden', label: 'Nueva Orden', icon: 'PlusCircle', path: '/nueva-orden', roles: ['Admin', 'Encargado', 'Mesero'] },
  { id: 'editar-orden', label: 'Editar Orden', icon: 'Edit3', path: '/editar-orden', roles: ['Admin', 'Encargado', 'Mesero'] },
  { id: 'surtir-orden', label: 'Surtir Orden', icon: 'ChefHat', path: '/surtir-orden', roles: ['Admin', 'Encargado', 'Despachador', 'Cocinero'] },
  { id: 'despachar', label: 'Despachar', icon: 'Truck', path: '/despachar', roles: ['Admin', 'Encargado', 'Mesero', 'Despachador'] },
  { id: 'recibir-productos', label: 'Recibir Productos', icon: 'Package', path: '/recibir-productos', roles: ['Admin', 'Encargado'] },
  { id: 'cobrar', label: 'Cobrar', icon: 'CreditCard', path: '/cobrar', roles: ['Admin', 'Encargado', 'Mesero'] },
  { id: 'catalogos', label: 'Catálogos', icon: 'BookOpen', path: '/catalogos', roles: ['Admin', 'Mesero', 'Despachador'] },
  { id: 'reportes', label: 'Reportes', icon: 'BarChart3', path: '/reportes', roles: ['Admin'] },
];

const iconMap: { [key: string]: React.ComponentType<any> } = {
  Home,
  ShoppingCart,
  Edit3,
  Package,
  Truck,
  CreditCard,
  BarChart3,
  BookOpen,
  ChefHat,
  PlusCircle,
};


interface SidebarProps {
  minimized?: boolean;
  onToggleMinimized?: () => void;
  isMobile?: boolean;
  isIconBar?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  minimized = false, 
  onToggleMinimized, 
  isMobile = false,
  isIconBar = false
}) => {
  const { hasPermission } = useAuth();

  const filteredMenuItems = menuItems.filter(item => 
    hasPermission(item.roles as any)
  );

  const handleMenuClick = () => {
    if (isMobile && onToggleMinimized) {
      onToggleMinimized();
    }
  };

  // Para la barra de iconos móvil, no mostrar el botón de toggle
  const showToggleButton = !isIconBar;

  return (
    <aside className={`bg-gray-900 min-h-screen transition-all duration-200 ${
      isMobile ? 'w-64' : (minimized ? 'w-16' : 'w-64')
    }`}>
      {showToggleButton && (
        <div className="flex items-center justify-end p-2">
          <button
            onClick={onToggleMinimized}
            className="text-gray-300 hover:text-white focus:outline-none"
            title={isMobile ? 'Cerrar menú' : (minimized ? 'Expandir menú' : 'Minimizar menú')}
          >
            {isMobile ? <span>✕</span> : (minimized ? <span>&#9776;</span> : <span>&#10094;</span>)}
          </button>
        </div>
      )}
      <nav className={`${showToggleButton ? 'mt-4' : 'mt-2'}`}>
        <div className="px-2">
          <ul className="space-y-2">
            {filteredMenuItems.map((item) => {
              const Icon = iconMap[item.icon];
              return (
                <li key={item.id}>
                  <NavLink
                    to={item.path}
                    onClick={handleMenuClick}
                    className={({ isActive }) =>
                      `flex items-center space-x-3 px-2 py-3 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-orange-600 text-white'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }`
                    }
                  >
                    <Icon className="w-5 h-5" />
                    {(!minimized || isMobile) && <span>{item.label}</span>}
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