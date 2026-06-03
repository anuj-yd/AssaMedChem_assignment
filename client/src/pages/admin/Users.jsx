import { useEffect, useState, useCallback } from 'react';
import api from '../../api/axios';
import { RoleBadge } from '../../components/Badges';
import toast from 'react-hot-toast';
import { UserX, UserCheck, Users, RefreshCw, Building2, Phone, Mail } from 'lucide-react';

export default function AdminUsers() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleF,   setRoleF]   = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = roleF ? { role: roleF } : {};
      const { data } = await api.get('/users', { params });
      setUsers(data.users);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  }, [roleF]);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchUsers();
    });
  }, [fetchUsers]);

  const toggleActive = async (id, currentlyActive, name) => {
    const action = currentlyActive ? 'deactivate' : 'activate';
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} user "${name}"?`)) return;
    try {
      const { data } = await api.patch(`/users/${id}/toggle`);
      toast.success(`${data.user.name} ${data.user.isActive ? 'activated' : 'deactivated'}`);
      fetchUsers();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const activeCount   = users.filter(u => u.isActive).length;
  const inactiveCount = users.filter(u => !u.isActive).length;
  const sellerCount   = users.filter(u => u.role === 'seller').length;

  return (
    <div className="page-body animate-fade">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="page-description">Manage seller and admin accounts</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={fetchUsers} title="Refresh">
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Quick Stats */}
      {!loading && users.length > 0 && (
        <div className="grid-4 mb-lg stagger">
          {[
            { label:'Total Users',   value: users.length,   color:'rgba(99,102,241,0.1)',  border:'rgba(99,102,241,0.2)',  text:'var(--color-primary-h)' },
            { label:'Active',        value: activeCount,    color:'rgba(16,185,129,0.1)',  border:'rgba(16,185,129,0.2)',  text:'var(--color-success-h)' },
            { label:'Inactive',      value: inactiveCount,  color:'rgba(100,116,139,0.1)', border:'rgba(100,116,139,0.2)', text:'var(--text-muted)' },
            { label:'Sellers',       value: sellerCount,    color:'rgba(6,182,212,0.1)',   border:'rgba(6,182,212,0.2)',   text:'var(--color-accent-h)' },
          ].map((s) => (
            <div key={s.label} className="card animate-up" style={{
              background: s.color,
              border: `1px solid ${s.border}`,
              padding:'var(--spacing-md)',
            }}>
              <div style={{ fontSize:'1.6rem', fontWeight:900, color: s.text, letterSpacing:'-0.03em' }}>
                {s.value}
              </div>
              <div style={{ fontSize:'0.72rem', fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginTop:4 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="card mb-lg" style={{ padding:'var(--spacing-md)' }}>
        <div className="filter-row">
          {[
            { val:'',       label:'All Roles' },
            { val:'admin',  label:'👑 Admins' },
            { val:'seller', label:'🏪 Sellers' },
          ].map(f => (
            <button
              key={f.val}
              className={`btn btn-sm ${roleF === f.val ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setRoleF(f.val)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Contact</th>
              <th>Company</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th style={{ textAlign:'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign:'center', padding:48 }}>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
                    <div className="spinner" />
                    <span className="text-sm text-muted">Loading users…</span>
                  </div>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state">
                    <div className="empty-state-icon"><Users size={24} /></div>
                    <div className="empty-state-title">No users found</div>
                    <p className="text-sm text-muted">No {roleF || ''} accounts registered yet</p>
                  </div>
                </td>
              </tr>
            ) : users.map((u) => (
              <tr key={u._id}>
                <td>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    {/* Avatar */}
                    <div style={{
                      width:36, height:36, borderRadius:'50%', flexShrink:0,
                      background: u.role === 'admin' ? 'var(--grad-primary)' : 'linear-gradient(135deg, #06b6d4, #6366f1)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:'0.72rem', fontWeight:800,
                    }}>
                      {u.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)}
                    </div>
                    <div>
                      <div className="font-semibold" style={{ letterSpacing:'-0.01em' }}>{u.name}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className="flex items-center gap-sm text-sm text-muted">
                    <Mail size={12} style={{ flexShrink:0 }} /> {u.email}
                  </div>
                  {u.phone && (
                    <div className="flex items-center gap-sm text-xs text-muted" style={{ marginTop:3 }}>
                      <Phone size={11} style={{ flexShrink:0 }} /> {u.phone}
                    </div>
                  )}
                </td>
                <td>
                  {u.company ? (
                    <div className="flex items-center gap-sm text-sm">
                      <Building2 size={13} style={{ color:'var(--text-muted)', flexShrink:0 }} />
                      {u.company}
                    </div>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
                <td><RoleBadge role={u.role} /></td>
                <td>
                  {u.isActive
                    ? <span className="badge badge-success">● Active</span>
                    : <span className="badge badge-muted">● Inactive</span>
                  }
                </td>
                <td>
                  <div className="text-sm">{new Date(u.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</div>
                </td>
                <td>
                  <div style={{ display:'flex', justifyContent:'flex-end' }}>
                    <button
                      id={`toggle-user-${u._id}`}
                      className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-success'}`}
                      onClick={() => toggleActive(u._id, u.isActive, u.name)}
                    >
                      {u.isActive
                        ? <><UserX size={13} /> Deactivate</>
                        : <><UserCheck size={13} /> Activate</>
                      }
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Count footer */}
      {!loading && users.length > 0 && (
        <div className="text-sm text-muted mt-md" style={{ textAlign:'right' }}>
          Showing {users.length} user{users.length !== 1 ? 's' : ''}
          {roleF ? ` · ${roleF} role` : ''}
        </div>
      )}
    </div>
  );
}
