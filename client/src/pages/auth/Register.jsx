import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { register } from '../../api/auth';
import toast from 'react-hot-toast';
import { User, Mail, Lock, Building2, Phone, UserPlus, Eye, EyeOff, ShieldCheck } from 'lucide-react';

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

export default function Register() {
  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', company: '', phone: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    setLoading(true);
    try {
      const { data } = await register(form);
      loginUser(data.token, data.user);
      toast.success('Account created! Welcome to AasaMedChem. 🎉');
      navigate('/seller/catalog', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const pwdStrength = (() => {
    const p = form.password;
    if (!p) return null;
    let score = 0;
    if (p.length >= 6)  score++;
    if (p.length >= 10) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return score;
  })();

  const pwdLabel = pwdStrength === null ? '' : pwdStrength <= 1 ? 'Weak' : pwdStrength <= 3 ? 'Fair' : 'Strong';
  const pwdColor = pwdStrength === null ? '' : pwdStrength <= 1 ? 'var(--color-danger)' : pwdStrength <= 3 ? 'var(--color-warning)' : 'var(--color-success)';

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
            Join our network of verified sellers. List products, manage pricing, handle customer orders, and track your performance in real time.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              'Direct-to-buyer sales channel',
              'Easy bulk product upload',
              'Instant notifications & alerts',
              'Secure payments & tracking',
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
          <h1 className="auth-title" style={{ textAlign: 'left', marginBottom: 4 }}>Get Started</h1>
          <p className="auth-subtitle" style={{ textAlign: 'left', marginBottom: 20 }}>Fill in your details to create a seller account</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            {/* Name + Email row */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="reg-name">
                  <User size={12} /> Full Name <span className="form-required">*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', pointerEvents:'none' }} />
                  <input
                    id="reg-name"
                    className="form-input"
                    style={{ paddingLeft: 38 }}
                    placeholder="John Doe"
                    value={form.name}
                    onChange={set('name')}
                    required
                    autoFocus
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-email">
                  <Mail size={12} /> Email <span className="form-required">*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', pointerEvents:'none' }} />
                  <input
                    id="reg-email"
                    className="form-input"
                    style={{ paddingLeft: 38 }}
                    type="email"
                    placeholder="you@company.com"
                    value={form.email}
                    onChange={set('email')}
                    required
                />
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="reg-password">
                <Lock size={12} /> Password <span className="form-required">*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', pointerEvents:'none' }} />
                <input
                  id="reg-password"
                  className="form-input"
                  style={{ paddingLeft: 38, paddingRight: 44 }}
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={set('password')}
                  required
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} style={{
                  position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
                  color:'var(--text-muted)', background:'none', border:'none', cursor:'pointer',
                  display:'flex', alignItems:'center',
                }}>
                  {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {/* Password strength */}
              {form.password && (
                <div style={{ marginTop: 6 }}>
                  <div style={{ display:'flex', gap:4, marginBottom:4 }}>
                    {[1,2,3,4,5].map(i => (
                      <div key={i} style={{
                        flex: 1, height: 3, borderRadius: 99,
                        background: i <= pwdStrength ? pwdColor : 'var(--color-surface-3)',
                        transition: 'background 0.3s ease',
                      }} />
                    ))}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: pwdColor, fontWeight: 600 }}>
                    {pwdLabel} password
                  </div>
                </div>
              )}
            </div>

            {/* Company + Phone row */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="reg-company">
                  <Building2 size={12} /> Company
                </label>
                <div style={{ position: 'relative' }}>
                  <Building2 size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', pointerEvents:'none' }} />
                  <input
                    id="reg-company"
                    className="form-input"
                    style={{ paddingLeft: 38 }}
                    placeholder="Your Company Ltd."
                    value={form.company}
                    onChange={set('company')}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-phone">
                  <Phone size={12} /> Phone
                </label>
                <div style={{ position: 'relative' }}>
                  <Phone size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)', pointerEvents:'none' }} />
                  <input
                    id="reg-phone"
                    className="form-input"
                    style={{ paddingLeft: 38 }}
                    placeholder="+91-9000000000"
                    value={form.phone}
                    onChange={set('phone')}
                  />
                </div>
              </div>
            </div>

            {/* Terms notice */}
            <div style={{
              background: 'rgba(194,39,45,0.05)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              lineHeight: 1.5,
            }}>
              🔒 Your account will be created as a <strong style={{ color:'var(--color-primary-h)' }}>Seller</strong>.
              Admins can manage your access and view your orders.
            </div>

            <button
              id="reg-submit"
              className="btn btn-primary btn-lg w-full"
              type="submit"
              disabled={loading}
              style={{ justifyContent: 'center' }}
            >
              {loading ? (
                <>
                  <div className="spinner spinner-sm" style={{ borderTopColor: 'rgba(255,255,255,0.9)', borderColor: 'rgba(255,255,255,0.25)' }} />
                  Creating account…
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  Create Seller Account
                </>
              )}
            </button>
          </form>

          <p className="auth-link">
            Already have an account?{' '}
            <Link to="/login">Sign in instead</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
