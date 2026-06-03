import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { register } from '../../api/auth';
import toast from 'react-hot-toast';
import { User, Mail, Lock, Building2, Phone, UserPlus, Eye, EyeOff } from 'lucide-react';

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
      <div className="auth-card animate-up" style={{ maxWidth: 500 }}>
        {/* Brand */}
        <div className="auth-logo">
          <div className="auth-logo-icon">⚗️</div>
          <div className="auth-logo-name">AasaMedChem</div>
          <div className="auth-logo-tagline">Create a Seller Account</div>
        </div>

        <h1 className="auth-title">Get Started</h1>
        <p className="auth-subtitle">Fill in your details to create a seller account</p>

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
            background: 'rgba(99,102,241,0.06)',
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
  );
}
