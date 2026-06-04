import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, Bell, Search, User, LogOut, Smartphone, CheckCheck } from 'lucide-react';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { useUIStore } from '../store/useUIStore';
import {
  AdminNotification,
  PushPublicConfig,
  enableBrowserPushNotifications,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../../services/notificationService';

const ADMIN_LOGO_SRC = '/assets/mk-maker-logo-ultra-realista.png';

function playNewOrderSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = 880;
    gain.gain.value = 0.08;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    window.setTimeout(() => {
      oscillator.stop();
      context.close();
    }, 220);
  } catch {
    // Browsers may block audio before user interaction. Notification data still updates.
  }
}

function formatNotificationTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export function AdminHeader() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const navigate = useNavigate();
  const location = useLocation();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pushConfig, setPushConfig] = useState<PushPublicConfig>({ enabled: false, publicKey: '' });
  const [pushStatus, setPushStatus] = useState('');
  const previousUnreadRef = useRef<number | null>(null);
  const isProductsRoute = location.pathname.startsWith('/admin/products');

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  const refreshNotifications = useCallback(async () => {
    try {
      const response = await listNotifications(12);
      setNotifications(response.items);
      setPushConfig(response.push);
      setUnreadCount(response.unreadCount);

      if (previousUnreadRef.current !== null && response.unreadCount > previousUnreadRef.current) {
        playNewOrderSound();
      }
      previousUnreadRef.current = response.unreadCount;
    } catch {
      // Keep the admin header usable even if notification polling fails.
    }
  }, []);

  useEffect(() => {
    refreshNotifications();
    const timer = window.setInterval(refreshNotifications, 15000);
    return () => window.clearInterval(timer);
  }, [refreshNotifications]);

  const openNotification = async (notification: AdminNotification) => {
    if (!notification.is_read) {
      await markNotificationRead(notification.id);
      setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, is_read: true } : item));
      setUnreadCount((current) => Math.max(0, current - 1));
    }

    const code = notification.order_code?.trim();
    setIsNotificationOpen(false);
    navigate(code ? `/admin/orders?ticket=${encodeURIComponent(code)}` : '/admin/orders');
  };

  const readAll = async () => {
    await markAllNotificationsRead();
    setNotifications((current) => current.map((item) => ({ ...item, is_read: true })));
    setUnreadCount(0);
  };

  const enablePush = async () => {
    setPushStatus('Solicitando permissao...');
    try {
      const result = await enableBrowserPushNotifications();
      if (result.status === 'subscribed') setPushStatus('Celular conectado.');
      if (result.status === 'denied') setPushStatus('Permissao negada no navegador.');
      if (result.status === 'unsupported') setPushStatus('Navegador sem suporte a push.');
      if (result.status === 'not_configured') setPushStatus('Push ainda nao configurado no servidor.');
    } catch (error) {
      setPushStatus(error instanceof Error ? error.message : 'Nao foi possivel ativar o push.');
    }
  };

  return (
    <header className="h-16 md:h-20 bg-white/95 backdrop-blur border-b border-neutral-200 px-4 md:px-8 flex items-center justify-between shrink-0 sticky top-0 z-30">
      <div className="flex items-center gap-2 md:gap-4 flex-1">
        <button 
          onClick={toggleSidebar} 
          className="lg:hidden p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="hidden min-w-0 items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-3 py-2 shadow-sm sm:flex">
          <img src={ADMIN_LOGO_SRC} alt="MK Maker" className="h-9 w-16 object-contain object-left" />
          <div className="hidden min-w-0 xl:block">
            <p className="truncate text-sm font-black text-neutral-950">MK Maker Admin</p>
            <p className="truncate text-[10px] font-black uppercase tracking-[0.2em] text-[#9B5F58]">Painel operacional</p>
          </div>
        </div>

        {!isProductsRoute && (
        <div className="flex-1 max-w-xl hidden sm:block">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-neutral-400" />
            </div>
            <input
              type="text"
              placeholder="Pesquisar produtos..."
              className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-[#c98f86] focus:ring-1 focus:ring-[#c98f86] transition-colors"
            />
          </div>
        </div>
        )}
      </div>

      <div className="flex items-center gap-4 md:gap-6 ml-4">
        <button onClick={handleLogout} title="Sair" className="p-2 text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-full transition-colors flex items-center">
           <LogOut className="w-4 h-4 ml-[-2px]" />
        </button>

        <div className="relative">
          <button
            onClick={() => setIsNotificationOpen((current) => !current)}
            className="relative rounded-full p-2 text-neutral-500 transition-colors hover:bg-[#fbf4f3] hover:text-[#8f5e59]"
            title="Notificacoes"
          >
            <Bell className="w-5 h-5 md:w-6 md:h-6" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[10px] font-black text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {isNotificationOpen && (
            <div className="absolute right-0 top-12 z-50 w-[340px] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl shadow-neutral-900/10 sm:w-[390px]">
              <div className="flex items-start justify-between gap-3 border-b border-neutral-100 px-4 py-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#9d6a63]">Central</p>
                  <h2 className="text-sm font-black uppercase text-neutral-900">Notificacoes</h2>
                </div>
                <button onClick={readAll} className="inline-flex items-center gap-1 rounded-lg bg-neutral-50 px-2 py-1 text-[10px] font-black uppercase text-neutral-600 hover:bg-neutral-100">
                  <CheckCheck className="h-3.5 w-3.5" />
                  Lidas
                </button>
              </div>

              <div className="border-b border-neutral-100 bg-[#fbf4f3]/60 px-4 py-3">
                <button
                  onClick={enablePush}
                  disabled={!pushConfig.enabled}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#8f5e59] px-3 py-2 text-xs font-black uppercase tracking-wide text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Smartphone className="h-4 w-4" />
                  Ativar no celular
                </button>
                <p className="mt-2 text-[11px] font-semibold text-neutral-500">
                  {pushStatus || (pushConfig.enabled ? 'Use no celular para receber pedidos em tempo real.' : 'Push aguardando configuracao do servidor.')}
                </p>
              </div>

              <div className="max-h-[360px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-neutral-400">Nenhuma notificacao ainda.</div>
                ) : (
                  notifications.map((notification) => (
                    <button
                      key={notification.id}
                      onClick={() => openNotification(notification)}
                      className={`block w-full border-b border-neutral-100 px-4 py-3 text-left transition-colors hover:bg-neutral-50 ${notification.is_read ? 'bg-white' : 'bg-[#fff8f6]'}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-black text-neutral-900">{notification.title}</h3>
                        {!notification.is_read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-red-500" />}
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs font-semibold leading-relaxed text-neutral-600">{notification.message}</p>
                      <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-[#9d6a63]">
                        {notification.order_code || 'Pedido'} - {formatNotificationTime(notification.created_at)}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3 pl-4 md:pl-6 border-l border-neutral-200">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-bold text-neutral-900 truncate max-w-[120px]">Admin</span>
            <span className="text-[10px] md:text-xs text-neutral-500 truncate max-w-[150px]">{user?.email || 'admin'}</span>
          </div>
          <div className="w-8 h-8 md:w-10 md:h-10 shrink-0 bg-[#fbf4f3] rounded-full flex items-center justify-center text-[#8f5e59] font-bold">
            <User className="w-4 h-4 md:w-5 md:h-5" />
          </div>
        </div>
      </div>
    </header>
  );
}
