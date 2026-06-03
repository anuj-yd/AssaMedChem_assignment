import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Package, ShoppingCart, ClipboardList,
  Users, LogOut, FlaskConical, BookOpen, ChevronRight
} from 'lucide-react';

const adminLinks = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard',  desc: 'Overview & stats' },
  { to: '/admin/products',  icon: Package,          label: 'Products',   desc: 'Manage inventory' },
  { to: '/admin/orders',    icon: ClipboardList,    label: 'Orders',     desc: 'Quotations & orders' },
  { to: '/admin/users',     icon: Users,            label: 'Users',      desc: 'Seller accounts' },
];

const sellerLinks = [
  { to: '/seller/catalog', icon: FlaskConical,  label: 'Catalog',    desc: 'Browse products' },
  { to: '/seller/cart',    icon: ShoppingCart,  label: 'My Cart',    desc: 'Review & order' },
  { to: '/seller/orders',  icon: BookOpen,      label: 'My Orders',  desc: 'Track quotations' },
];

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const links     = isAdmin ? adminLinks : sellerLinks;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  // Get current page label for topbar
  const currentLink = links.find(l => location.pathname.startsWith(l.to));

  return (
    <aside className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">⚗️</div>
          <div>
            <div className="sidebar-logo-text">AasaMedChem</div>
            <div className="sidebar-logo-sub">Inventory System</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">
          {isAdmin ? '⚙ Admin Panel' : '🏪 Seller Panel'}
        </div>
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={17} />
            <span style={{ flex: 1 }}>{label}</span>
            <ChevronRight size={13} style={{ opacity: 0.3, flexShrink: 0 }} />
          </NavLink>
        ))}
      </nav>

      {/* Connection Status */}
      <div style={{ padding: '8px 16px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(16,185,129,0.06)',
          border: '1px solid rgba(16,185,129,0.15)',
          borderRadius: 'var(--radius-sm)',
          padding: '6px 10px',
          fontSize: '0.68rem',
          color: 'var(--color-success-h)',
          fontWeight: 600,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--color-success)',
            boxShadow: '0 0 6px var(--color-success)',
            animation: 'pulse-dot 2s ease-in-out infinite',
            flexShrink: 0,
          }} />
          Server Connected
        </div>
      </div>

      {/* Footer / User */}
      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="user-name">{user?.name || 'User'}</div>
            <div className="user-role" style={{
              color: isAdmin ? 'var(--color-primary-h)' : 'var(--color-accent-h)',
              fontWeight: 600,
            }}>
              {isAdmin ? '👑 Admin' : '🏪 Seller'}
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Sign out">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
