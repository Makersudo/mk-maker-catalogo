import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { Hero } from './components/hero/Hero';
import { Catalog } from './components/catalog/Catalog';
import { ProductDetail } from './components/catalog/ProductDetail';
import { CartDrawer } from './components/cart/CartDrawer';
import { useStore } from './store/useStore';
import { getPublicCatalogBootstrap } from './services/catalogService';
import { dismissPublicCatalogSplash, getCriticalPublicMedia, preparePublicCatalogSplash } from './publicCatalogSplash';

const LoginView = lazy(() => import('./modules/auth/views/LoginView').then((module) => ({ default: module.LoginView })));
const AdminLayout = lazy(() => import('./modules/layout/views/AdminLayout').then((module) => ({ default: module.AdminLayout })));
const DashboardView = lazy(() => import('./modules/dashboard/views/DashboardView').then((module) => ({ default: module.DashboardView })));
const ProductsListView = lazy(() => import('./modules/products/views/ProductsListView').then((module) => ({ default: module.ProductsListView })));
const CategoriesView = lazy(() => import('./modules/categories/views/CategoriesView').then((module) => ({ default: module.CategoriesView })));
const MediaView = lazy(() => import('./modules/media/views/MediaView').then((module) => ({ default: module.MediaView })));
const HighlightsView = lazy(() => import('./modules/highlights/views/HighlightsView').then((module) => ({ default: module.HighlightsView })));
const MarketingView = lazy(() => import('./modules/marketing/views/MarketingView').then((module) => ({ default: module.MarketingView })));
const OrdersKanbanView = lazy(() => import('./modules/orders/views/OrdersKanbanView').then((module) => ({ default: module.OrdersKanbanView })));
const SettingsView = lazy(() => import('./modules/settings/views/SettingsView').then((module) => ({ default: module.SettingsView })));
const ContactView = lazy(() => import('./modules/contact/views/ContactView').then((module) => ({ default: module.ContactView })));

type PublicTab = 'inicio' | 'catalogo' | 'contato';

const publicTabByPath: Record<string, PublicTab> = {
  '/inicio': 'inicio',
  '/catalogo': 'catalogo',
  '/contato': 'contato'
};

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  return null;
}

function AppSplashController() {
  const { pathname } = useLocation();

  useEffect(() => {
    const isPublicCatalogRoute = pathname === '/'
      || pathname === '/inicio'
      || pathname === '/catalogo'
      || pathname === '/contato'
      || pathname.startsWith('/produto/');

    if (isPublicCatalogRoute) {
      void preparePublicCatalogSplash(getPublicCatalogBootstrap, getCriticalPublicMedia(pathname));
      return;
    }

    dismissPublicCatalogSplash();
  }, [pathname]);

  return null;
}

function RouteFallback() {
  return <div className="min-h-[240px] bg-neutral-50" />;
}

// Mini componente para a página pública
function PublicStore() {
  const location = useLocation();
  const { activeTab, setActiveTab } = useStore();
  const isProductPage = location.pathname.startsWith('/produto/');
  const routedTab = isProductPage ? 'catalogo' : publicTabByPath[location.pathname] ?? 'catalogo';

  useEffect(() => {
    if (activeTab !== routedTab) {
      setActiveTab(routedTab);
    }
  }, [activeTab, routedTab, setActiveTab]);

  return (
    <div className="min-h-screen flex flex-col font-sans bg-neutral-50 text-neutral-900 selection:bg-purple-200">
      <ScrollToTop />
      <Header />
      <main className="flex-1 flex flex-col">
        {routedTab === 'inicio' && <Hero />}
        {isProductPage ? <ProductDetail /> : routedTab === 'catalogo' && <Catalog />}
        {routedTab === 'contato' && (
          <Suspense fallback={<RouteFallback />}>
            <ContactView />
          </Suspense>
        )}
      </main>
      <CartDrawer />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppSplashController />
      <Routes>
        {/* Rota pública da Loja */}
        <Route path="/" element={<Navigate to="/catalogo" replace />} />
        <Route path="/inicio" element={<PublicStore />} />
        <Route path="/catalogo" element={<PublicStore />} />
        <Route path="/produto/:slug" element={<PublicStore />} />
        <Route path="/contato" element={<PublicStore />} />

        {/* Rota pública de login admin */}
        <Route
          path="/login"
          element={(
            <Suspense fallback={<RouteFallback />}>
              <LoginView />
            </Suspense>
          )}
        />
        {/* Rotas Privadas (Admin Layout) */}
        <Route
          path="/admin"
          element={(
            <Suspense fallback={<RouteFallback />}>
              <AdminLayout />
            </Suspense>
          )}
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route
            path="dashboard"
            element={(
              <Suspense fallback={<RouteFallback />}>
                <DashboardView />
              </Suspense>
            )}
          />
          <Route
            path="products"
            element={(
              <Suspense fallback={<RouteFallback />}>
                <ProductsListView />
              </Suspense>
            )}
          />
          <Route
            path="categories"
            element={(
              <Suspense fallback={<RouteFallback />}>
                <CategoriesView />
              </Suspense>
            )}
          />
          <Route
            path="media"
            element={(
              <Suspense fallback={<RouteFallback />}>
                <MediaView />
              </Suspense>
            )}
          />
          <Route
            path="highlights"
            element={(
              <Suspense fallback={<RouteFallback />}>
                <HighlightsView />
              </Suspense>
            )}
          />
          <Route
            path="marketing"
            element={(
              <Suspense fallback={<RouteFallback />}>
                <MarketingView />
              </Suspense>
            )}
          />
          <Route
            path="orders"
            element={(
              <Suspense fallback={<RouteFallback />}>
                <OrdersKanbanView />
              </Suspense>
            )}
          />
          <Route
            path="settings"
            element={(
              <Suspense fallback={<RouteFallback />}>
                <SettingsView />
              </Suspense>
            )}
          />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/catalogo" replace />} />
      </Routes>
    </Router>
  );
}
