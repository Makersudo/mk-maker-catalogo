import { NavLink } from 'react-router-dom';
import { ClipboardList, LayoutDashboard, LogOut, Megaphone, Package, Settings, Tag, X, Sparkles, TicketPercent, GalleryHorizontalEnd } from 'lucide-react';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { useUIStore } from '../store/useUIStore';

const ADMIN_LOGO_SRC = '/assets/mk-maker-logo-ultra-realista.png';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
  { icon: Package, label: 'Produtos', path: '/admin/products' },
  { icon: Tag, label: 'Categorias', path: '/admin/categories' },
  { icon: ClipboardList, label: 'Pedidos', path: '/admin/orders' },
  { icon: Settings, label: 'Configuracoes', path: '/admin/settings' },
];

const marketingItems = [
  { icon: Megaphone, label: 'Campanhas', path: '/admin/marketing' },
  { icon: Sparkles, label: 'Anúncios Strip', path: '/admin/banners' },
  { icon: GalleryHorizontalEnd, label: 'Banners do Catálogo', path: '/admin/promo-banners' },
  { icon: TicketPercent, label: 'Cupons', path: '/admin/coupons' },
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
        <div className="relative border-b border-neutral-100 bg-[linear-gradient(180deg,#ffffff_0%,#fbf7f6_100%)] px-4 pb-3.5 pt-3">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(201,143,134,0.18),transparent_36%)]" />
          <div className="relative flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex h-16 w-32 items-center">
                <img
                  src={ADMIN_LOGO_SRC}
                  alt="MK Maker"
                  className="h-16 w-32 object-contain object-left"
                />
              </div>
              <div className="-mt-1">
                <p className="text-xs font-black text-neutral-950">Central MK Maker</p>
                <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-[#9B5F58]">Makeup & Beauty</p>
              </div>
            </div>

            <button
              onClick={closeSidebar}
              className="rounded-xl border border-neutral-200 bg-white p-1.5 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 lg:hidden"
              aria-label="Fechar menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>


        <nav className="flex-1 overflow-y-auto px-3 py-3.5 custom-scrollbar">
          <div className="mb-2 px-2 text-[9px] font-black uppercase tracking-[0.24em] text-neutral-400">Gerenciamento</div>
          <div className="flex flex-col gap-1 mb-4">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => closeSidebar()}
                className={({ isActive }) =>
                  `group relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#F8EEEC] text-[#7A4944] shadow-[0_10px_26px_rgba(201,143,134,0.16)]'
                      : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-950'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${isActive ? 'bg-white text-[#8D514B]' : 'bg-neutral-100 text-neutral-500 group-hover:bg-white group-hover:text-neutral-900'}`}>
                      <item.icon className="h-4.5 w-4.5" />
                    </span>
                    <span className="min-w-0 truncate">{item.label}</span>
                    {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#C98F86]" />}
                  </>
                )}
              </NavLink>
            ))}
          </div>

          <div className="mb-2 px-2 text-[9px] font-black uppercase tracking-[0.24em] text-neutral-400">Marketing</div>
          <div className="flex flex-col gap-1">
            {marketingItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => closeSidebar()}
                className={({ isActive }) =>
                  `group relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#F8EEEC] text-[#7A4944] shadow-[0_10px_26px_rgba(201,143,134,0.16)]'
                      : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-950'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${isActive ? 'bg-white text-[#8D514B]' : 'bg-neutral-100 text-neutral-500 group-hover:bg-white group-hover:text-neutral-900'}`}>
                      <item.icon className="h-4.5 w-4.5" />
                    </span>
                    <span className="min-w-0 truncate">{item.label}</span>
                    {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#C98F86]" />}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="border-t border-neutral-100 bg-white p-3">
          <div className="mb-2 rounded-xl border border-[#E7C9C4] bg-[#FDF8F7] px-3 py-2.5">
            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#9B5F58]">Vitrine pronta</p>
            <p className="mt-0.5 text-[11px] font-semibold leading-normal text-neutral-600">Produtos, pedidos e campanhas no mesmo painel.</p>
          </div>

          <button
            onClick={logout}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-xs font-black text-red-500 transition-colors hover:bg-red-100"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sair do Sistema
          </button>
        </div>
      </aside>
    </>
  );
}
