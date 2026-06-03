import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { login } from '../../api/auth';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Mail, Lock, Zap, ShieldCheck } from 'lucide-react';

/* Floating particle background */
const STATIC_PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  size:  Math.random() * 4 + 1,
  x:     Math.random() * 100,
  y:     Math.random() * 100,
  dur:   Math.random() * 10 + 8,
  delay: Math.random() * 6,
  opacity: Math.random() * 0.4 + 0.1,
}));

function Particles() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      {STATIC_PARTICLES.map(p => (
        <div key={p.id} style={{
          position: 'absolute',
          width:  p.size,
          height: p.size,
          left:   `${p.x}%`,
          top:    `${p.y}%`,
          borderRadius: '50%',
          background: p.id % 3 === 0
            ? 'var(--color-primary)'
            : p.id % 3 === 1
              ? 'var(--color-secondary)'
              : 'var(--color-accent)',
          opacity: p.opacity,
          animation: `float-particle ${p.dur}s ease-in-out ${p.delay}s infinite`,
        }} />
      ))}
      <style>{`
        @keyframes float-particle {
          0%, 100% { transform: translateY(0) scale(1); opacity: var(--op, 0.2); }
          50%       { transform: translateY(-30px) scale(1.2); opacity: calc(var(--op, 0.2) * 1.5); }
        }
      `}</style>
    </div>
  );
}

export default function Login() {
  const { loginUser } = useAuth();
  const navigate      = useNavigate();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await login(form);
      loginUser(data.token, data.user);
      toast.success(`Welcome back, ${data.user.name}! 👋`);
      navigate(data.user.role === 'admin' ? '/admin/dashboard' : '/seller/catalog', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    setForm(role === 'admin'
      ? { email: 'admin@aasa.com',  password: 'Admin@123' }
      : { email: 'seller@aasa.com', password: 'Seller@123' }
    );
    toast('Demo credentials filled ✓', { icon: '💡' });
  };

  return (
    <div className="auth-page">
      <Particles />

      {/* Auth Card */}
      <div className="auth-card animate-up" style={{ position: 'relative', zIndex: 1 }}>
        
        {/* Left Side: Brand Panel */}
        <div className="auth-card-sidebar">
          <div className="auth-logo" style={{ textAlign: 'left', marginBottom: 20 }}>
            <div className="auth-logo-icon" style={{ margin: '0 0 var(--spacing-md)' }}>⚗️</div>
            <h2 className="auth-logo-name">AasaMedChem</h2>
            <p className="auth-logo-tagline">Inventory & Order Management</p>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.6, marginBottom: 24 }}>
            Manage your chemical and medical product inventory with precision. Real-time tracking, multi-unit pricing, and streamlined quotation workflow.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              'Real-time low stock alerts',
              'Multi-unit pricing (g, kg, L, mL)',
              'Seller quotation workflow',
              'Role-based access control',
            ].map((feat, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={14} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="auth-card-form">
          <h1 className="auth-title" style={{ textAlign: 'left', marginBottom: 4 }}>Welcome back</h1>
          <p className="auth-subtitle" style={{ textAlign: 'left', marginBottom: 20 }}>Sign in to your account to continue</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            {/* Email */}
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                <Mail size={12} /> Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{
                  position: 'absolute', left: 13, top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--text-muted)',
                  pointerEvents: 'none',
                }} />
                <input
                  id="email"
                  className="form-input"
                  style={{ paddingLeft: 40 }}
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="password">
                <Lock size={12} /> Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{
                  position: 'absolute', left: 13, top: '50%',
                  transform: 'translateY(-50%)', color: 'var(--text-muted)',
                  pointerEvents: 'none',
                }} />
                <input
                  id="password"
                  className="form-input"
                  style={{ paddingLeft: 40, paddingRight: 44 }}
                  type={showPwd ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  style={{
                    position: 'absolute', right: 12, top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)', background: 'none',
                    border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 2, borderRadius: 4,
                    transition: 'color var(--transition-fast)',
                  }}
                >
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              id="login-submit"
              className="btn btn-primary btn-lg w-full"
              type="submit"
              disabled={loading}
              style={{ justifyContent: 'center', marginTop: 4 }}
            >
              {loading ? (
                <>
                  <div className="spinner spinner-sm" style={{ borderTopColor: 'rgba(255,255,255,0.9)', borderColor: 'rgba(255,255,255,0.25)' }} />
                  Signing in…
                </>
              ) : (
                <>
                  <Zap size={16} />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="auth-divider"><span>Quick Demo Access</span></div>

          <div className="flex gap-sm">
            <button
              id="demo-admin"
              className="btn btn-secondary w-full btn-sm"
              onClick={() => fillDemo('admin')}
              style={{ justifyContent: 'center' }}
            >
              👑 Admin Demo
            </button>
            <button
              id="demo-seller"
              className="btn btn-secondary w-full btn-sm"
              onClick={() => fillDemo('seller')}
              style={{ justifyContent: 'center' }}
            >
              🏪 Seller Demo
            </button>
          </div>

          <p className="auth-link">
            Don't have an account?{' '}
            <Link to="/register">Register as Seller</Link>
          </p>

          {/* Footer note */}
          <div style={{
            marginTop: 20,
            paddingTop: 16,
            borderTop: '1px solid var(--color-border)',
            textAlign: 'center',
            fontSize: '0.68rem',
            color: 'var(--text-faint)',
          }}>
            🔒 Secured with JWT · AasaMedChem v2.0
          </div>
        </div>
      </div>
    </div>
  );
}
