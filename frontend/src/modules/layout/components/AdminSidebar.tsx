import { NavLink } from 'react-router-dom';
import { ClipboardList, LayoutDashboard, LogOut, Megaphone, Package, Settings, Tag, X } from 'lucide-react';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { useUIStore } from '../store/useUIStore';

const ADMIN_LOGO_SRC = '/assets/mk-maker-logo-ultra-realista.png';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
  { icon: Package, label: 'Produtos', path: '/admin/products' },
  { icon: Tag, label: 'Categorias', path: '/admin/categories' },
  { icon: Megaphone, label: 'Marketing', path: '/admin/marketing' },
  { icon: ClipboardList, label: 'Pedidos', path: '/admin/orders' },
  { icon: Settings, label: 'Configuracoes', path: '/admin/settings' },
];

export function AdminSidebar() {
  const logout = useAuthStore((state) => state.logout);
  const { isSidebarOpen, closeSidebar } = useUIStore();

  return (
    <>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-neutral-900/50 backdrop-blur-sm lg:hidden"
          onClick={closeSidebar}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 flex h-screen w-72 flex-col overflow-hidden border-r border-neutral-200 bg-white shadow-[18px_0_52px_rgba(17,24,39,0.06)]
        transform transition-transform duration-300 ease-in-out lg:static lg:w-72 lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="relative border-b border-neutral-100 bg-[linear-gradient(180deg,#ffffff_0%,#fbf7f6_100%)] px-5 pb-5 pt-4">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(201,143,134,0.18),transparent_36%)]" />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex h-24 w-44 items-center">
                <img
                  src={ADMIN_LOGO_SRC}
                  alt="MK Maker"
                  className="h-24 w-44 object-contain object-left"
                />
              </div>
              <div className="-mt-2">
                <p className="text-sm font-black text-neutral-950">Central MK Maker</p>
                <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#9B5F58]">Makeup & Beauty</p>
              </div>
            </div>

            <button
              onClick={closeSidebar}
              className="rounded-xl border border-neutral-200 bg-white p-2 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 lg:hidden"
              aria-label="Fechar menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-5 custom-scrollbar">
          <div className="mb-3 px-2 text-[10px] font-black uppercase tracking-[0.24em] text-neutral-400">Gerenciamento</div>
          <div className="flex flex-col gap-2">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => closeSidebar()}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-[#F8EEEC] text-[#7A4944] shadow-[0_10px_26px_rgba(201,143,134,0.16)]'
                      : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-950'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${isActive ? 'bg-white text-[#8D514B]' : 'bg-neutral-100 text-neutral-500 group-hover:bg-white group-hover:text-neutral-900'}`}>
                      <item.icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 truncate">{item.label}</span>
                    {isActive && <span className="ml-auto h-2 w-2 rounded-full bg-[#C98F86]" />}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="border-t border-neutral-100 bg-white p-4">
          <div className="mb-3 rounded-2xl border border-[#E7C9C4] bg-[#FDF8F7] px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#9B5F58]">Vitrine pronta</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-neutral-600">Produtos, pedidos e campanhas no mesmo painel.</p>
          </div>

          <button
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-black text-red-500 transition-colors hover:bg-red-100"
          >
            <LogOut className="h-4 w-4" />
            Sair do Sistema
          </button>
        </div>
      </aside>
    </>
  );
}
