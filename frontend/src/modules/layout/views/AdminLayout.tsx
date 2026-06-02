import { Navigate, Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { AdminSidebar } from '../components/AdminSidebar';
import { AdminHeader } from '../components/AdminHeader';

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
    <div className="flex h-dvh overflow-hidden bg-neutral-50">
      <AdminSidebar />
      <div className="min-w-0 flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto bg-neutral-50/50 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
