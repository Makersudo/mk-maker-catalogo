import { Navigate, Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { AdminSidebar } from '../components/AdminSidebar';
import { AdminHeader } from '../components/AdminHeader';
import { AdminBottomNav } from '../components/AdminBottomNav';

export function AdminLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const hydrateSession = useAuthStore((state) => state.hydrateSession);

  useEffect(() => {
    hydrateSession();
  }, [hydrateSession]);

  if (isLoading) {
    return <div className="min-h-screen bg-neutral-50" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-[#f7f5f4]">
      <AdminSidebar />
      <div className="min-w-0 flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto bg-[radial-gradient(circle_at_top_right,rgba(201,143,134,0.12),transparent_28%),linear-gradient(180deg,#fbfaf9_0%,#f6f4f3_100%)] p-4 pb-24 lg:pb-8 lg:p-8">
          <Outlet />
        </main>
        <AdminBottomNav />
      </div>
    </div>
  );
}

