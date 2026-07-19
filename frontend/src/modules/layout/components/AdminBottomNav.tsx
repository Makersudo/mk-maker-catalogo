import { useLocation, useNavigate } from 'react-router-dom';
import { ClipboardList, LayoutDashboard, Megaphone, Menu, Package } from 'lucide-react';
import { useUIStore } from '../store/useUIStore';

export function AdminBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const isSidebarOpen = useUIStore((state) => state.isSidebarOpen);

  const adminNavItems = [
    { id: 'dashboard', label: 'Painel', icon: LayoutDashboard, path: '/admin/dashboard' },
    { id: 'products', label: 'Produtos', icon: Package, path: '/admin/products' },
    { id: 'orders', label: 'Pedidos', icon: ClipboardList, path: '/admin/orders' },
    { id: 'marketing', label: 'Marketing', icon: Megaphone, path: '/admin/marketing' },
    { id: 'menu', label: 'Menu', icon: Menu, isMenu: true },
  ] as const;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 rounded-2xl bg-white/94 backdrop-blur-md border border-neutral-200 shadow-lg shadow-neutral-900/5 lg:hidden pointer-events-auto">
      <nav className="flex justify-around items-center h-16 px-1">
        {adminNavItems.map((item) => {
          const isMenu = 'isMenu' in item && item.isMenu;
          const isTabActive = isMenu ? isSidebarOpen : ('path' in item && location.pathname === item.path);
          const Icon = item.icon;

          const handleClick = () => {
            if (isMenu) {
              toggleSidebar();
            } else if ('path' in item && item.path) {
              navigate(item.path);
            }
          };

          return (
            <button
              key={item.id}
              onClick={handleClick}
              className="relative flex flex-col items-center justify-center flex-1 h-full py-1 focus:outline-none"
            >
              <div
                className={`flex items-center justify-center rounded-xl w-12 h-8 bottom-nav-badge ${
                  isTabActive ? 'bg-[#F8EEEC] text-[#7A4944]' : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span
                className={`text-[10px] mt-0.5 font-bold transition-colors ${
                  isTabActive ? 'text-[#7A4944]' : 'text-neutral-500'
                }`}
              >
                {item.label}
              </span>
              
              {/* Dot Indicator */}
              <div
                className={`w-1 h-1 rounded-full bg-[#C98F86] mt-0.5 active-dot ${
                  isTabActive ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
                }`}
              />
            </button>
          );
        })}
      </nav>
    </div>
  );
}
