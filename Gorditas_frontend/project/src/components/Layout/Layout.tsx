import React, { useState } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarMinimized, setSidebarMinimized] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const toggleDesktopSidebar = () => {
    setSidebarMinimized(!sidebarMinimized);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar para desktop */}
      <div className="hidden lg:block">
        <Sidebar 
          minimized={sidebarMinimized} 
          onToggleMinimized={toggleDesktopSidebar} 
        />
      </div>

      {/* Barra lateral móvil - solo iconos siempre visible (se oculta cuando panel está abierto) */}
      <div className={`lg:hidden ${sidebarOpen ? 'hidden' : 'block'}`}>
        <Sidebar 
          minimized={true} 
          onToggleMinimized={() => {}} // No hace nada, solo navega
          isMobile={false}
          isIconBar={true}
        />
      </div>

      {/* Panel completo para móvil con overlay */}
      {sidebarOpen && (
        <>
          {/* Overlay que bloquea la vista */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={closeSidebar}
          />
          {/* Sidebar completo móvil */}
          <div className="fixed inset-y-0 left-0 z-50 lg:hidden">
            <Sidebar 
              minimized={false} 
              onToggleMinimized={closeSidebar}
              isMobile={true}
            />
          </div>
        </>
      )}

      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        <Header onToggleSidebar={toggleSidebar} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          <div className="container mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;