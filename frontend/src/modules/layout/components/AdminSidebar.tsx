import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, Tag, Settings, LogOut, Image, BarChart, X, ClipboardList, Megaphone } from 'lucide-react';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { useUIStore } from '../store/useUIStore';
import { BrandLogo } from '../../../components/brand/BrandLogo';

export function AdminSidebar() {
  const logout = useAuthStore((state) => state.logout);
  const { isSidebarOpen, closeSidebar } = useUIStore();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
    { icon: Package, label: 'Produtos', path: '/admin/products' },
    { icon: Tag, label: 'Categorias', path: '/admin/categories' },
    { icon: Image, label: 'Mídia e Imagens', path: '/admin/media' },
    { icon: BarChart, label: 'Destaques', path: '/admin/highlights' },
    { icon: Megaphone, label: 'Marketing', path: '/admin/marketing' },
    { icon: ClipboardList, label: 'Pedidos', path: '/admin/orders' },
    { icon: Settings, label: 'Configurações', path: '/admin/settings' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-neutral-900/50 backdrop-blur-sm"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar Content */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 lg:w-64 bg-white border-r border-neutral-200 h-screen flex flex-col overflow-y-auto
        transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-neutral-100 mb-6 flex items-center justify-between lg:justify-center">
          <BrandLogo imageClassName="h-12 w-40 object-contain object-left lg:object-center" />
          <button onClick={closeSidebar} className="lg:hidden p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 flex flex-col gap-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => closeSidebar()} // Auto close on mobile select
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-purple-50 text-purple-800 font-bold'
                    : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-neutral-100">
          <button
            onClick={logout}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-bold text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair do Sistema
          </button>
        </div>
      </aside>
    </>
  );
}
