import { Component, useEffect } from 'react';
import { Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Header, Footer } from './presentation/shared/layout/Layout';
import { useAuthStore } from './core/auth/store';
import Home from './presentation/features/home/Home';
import Catalog from './presentation/features/catalog/Catalog';
import ProductDetail from './presentation/features/product/ProductDetail';
import Cart from './presentation/features/cart/Cart';
import Checkout from './presentation/features/checkout/Checkout';
import Auth from './presentation/features/auth/Auth';
import Account from './presentation/features/account/Account';
import AdminDashboard from './presentation/features/admin/AdminDashboard';
import NotFound from './presentation/shared/NotFound';

class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4">
          <span className="material-symbols-outlined text-6xl text-error">error</span>
          <h1 className="text-headline-md">Something went wrong</h1>
          <button onClick={() => { this.setState({ hasError: false }); window.location.href = '/'; }}
            className="bg-primary text-on-primary px-6 py-3 rounded-lg text-body-md font-semibold">
            Go Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col" dir="auto">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

function ProtectedRoute({ children, adminOnly }: { children: React.ReactNode; adminOnly?: boolean }) {
  const user = useAuthStore(s => s.user);
  if (!user) return <Navigate to="/auth?mode=login" replace />;
  if (adminOnly && user.role !== 'Admin') return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  const { i18n } = useTranslation();
  const loadUser = useAuthStore(s => s.loadUser);

  useEffect(() => {
    loadUser();
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/catalog" element={<Catalog />} />
          <Route path="/category/:slug" element={<Catalog />} />
          <Route path="/collection/:slug" element={<Catalog />} />
          <Route path="/product/:slug" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/favorites" element={<ProtectedRoute><Account /></ProtectedRoute>} />
          <Route path="/account" element={<ProtectedRoute><Account /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}
