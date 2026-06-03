import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { LoaderProvider } from './context/LoaderContext';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';

// Auth
import Login    from './pages/auth/Login';
import Register from './pages/auth/Register';

// Admin
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts  from './pages/admin/Products';
import AdminOrders    from './pages/admin/Orders';
import AdminUsers     from './pages/admin/Users';

// Seller
import SellerCatalog from './pages/seller/Catalog';
import SellerCart    from './pages/seller/Cart';
import SellerOrders  from './pages/seller/MyOrders';

export default function App() {
  return (
    <AuthProvider>
      <LoaderProvider>
        <BrowserRouter>
        <Toaster
          position="top-right"
          gutter={8}
          toastOptions={{
            duration: 3500,
            style: {
              background: '#111827',
              color: '#f0f4ff',
              border: '1px solid rgba(99,120,200,0.28)',
              borderRadius: '12px',
              fontSize: '0.875rem',
              fontFamily: "'Inter', sans-serif",
              fontWeight: 500,
              boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 16px rgba(99,102,241,0.1)',
              padding: '12px 16px',
              maxWidth: 380,
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#111827' },
              style: { borderColor: 'rgba(16,185,129,0.25)' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#111827' },
              style: { borderColor: 'rgba(239,68,68,0.25)' },
            },
          }}
        />

        <Routes>
          {/* Root → login */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Public routes */}
          <Route element={<PublicRoute />}>
            <Route path="/login"    element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          {/* Admin routes */}
          <Route element={<ProtectedRoute role="admin" />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/products"  element={<AdminProducts />} />
            <Route path="/admin/orders"    element={<AdminOrders />} />
            <Route path="/admin/users"     element={<AdminUsers />} />
          </Route>

          {/* Seller routes */}
          <Route element={<ProtectedRoute role="seller" />}>
            <Route path="/seller/catalog" element={<SellerCatalog />} />
            <Route path="/seller/cart"    element={<SellerCart />} />
            <Route path="/seller/orders"  element={<SellerOrders />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
      </LoaderProvider>
    </AuthProvider>
  );
}
