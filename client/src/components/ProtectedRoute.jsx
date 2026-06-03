import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import { useEffect, useState } from 'react';

/* ── Page meta map ── */
const PAGE_META = {
  '/admin/dashboard': { title: 'Dashboard',          sub: 'Overview & analytics' },
  '/admin/products':  { title: 'Products',            sub: 'Inventory management' },
  '/admin/orders':    { title: 'Orders & Quotations', sub: 'Manage order pipeline' },
  '/admin/users':     { title: 'Users',               sub: 'Seller account management' },
  '/seller/catalog':  { title: 'Product Catalog',     sub: 'Browse & add to cart' },
  '/seller/cart':     { title: 'My Cart',             sub: 'Review before placing quotation' },
  '/seller/orders':   { title: 'My Orders',           sub: 'Track your quotations & orders' },
};

function Spinner() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: 'var(--color-bg)',
      gap: 16,
    }}>
      <div style={{
        width: 48, height: 48,
        background: 'var(--grad-primary)',
        borderRadius: 'var(--radius-md)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22,
        boxShadow: 'var(--shadow-glow)',
        animation: 'glow-pulse 2s ease-in-out infinite',
      }}>⚗️</div>
      <div className="spinner" />
      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
        Loading AasaMedChem…
      </span>
    </div>
  );
}

function Topbar() {
  const location = useLocation();
  const { user, isAdmin } = useAuth();
  const meta = PAGE_META[location.pathname] || { title: 'AasaMedChem', sub: '' };

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="topbar-title">{meta.title}</div>
        {meta.sub && <div className="topbar-subtitle">{meta.sub}</div>}
      </div>
      <div className="topbar-right">
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'right' }}>
          <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{timeStr}</div>
          <div>{dateStr}</div>
        </div>
        <div className="topbar-badge">
          <span className="live-dot" />
          Live
        </div>
        <div style={{
          width: 32, height: 32,
          borderRadius: '50%',
          background: 'var(--grad-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.7rem', fontWeight: 800,
          boxShadow: 'var(--shadow-glow-xs)',
          flexShrink: 0,
          cursor: 'default',
        }} title={user?.name}>
          {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2) || '??'}
        </div>
      </div>
    </header>
  );
}

export function ProtectedRoute({ role }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/seller/catalog'} replace />;
  }
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Topbar />
        <Outlet />
      </div>
    </div>
  );
}

export function PublicRoute() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/seller/catalog'} replace />;
  }
  return <Outlet />;
}
