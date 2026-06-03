import { useEffect, useState, useCallback } from 'react';
import api from '../../api/axios';
import { RoleBadge } from '../../components/Badges';
import toast from 'react-hot-toast';
import { UserX, UserCheck, Shield } from 'lucide-react';

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

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const toggleActive = async (id) => {
    try {
      const { data } = await api.patch(`/users/${id}/toggle`);
      toast.success(`User ${data.user.isActive ? 'activated' : 'deactivated'}`);
      fetchUsers();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div className="page-body animate-fade">
      <div className="page-header">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="page-description">Manage seller accounts</p>
        </div>
      </div>

      <div className="filter-row mb-lg">
        <select className="form-select" style={{ width: 180 }} value={roleF}
          onChange={(e) => setRoleF(e.target.value)}>
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="seller">Seller</option>
        </select>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Company</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign:'center', padding:40 }}><div className="spinner" style={{ margin:'0 auto' }} /></td></tr>
            ) : users.map((u) => (
              <tr key={u._id}>
                <td className="font-semibold">{u.name}</td>
                <td className="text-sm text-muted">{u.email}</td>
                <td className="text-sm text-muted">{u.company || '—'}</td>
                <td><RoleBadge role={u.role} /></td>
                <td>
                  {u.isActive
                    ? <span className="badge badge-success">Active</span>
                    : <span className="badge badge-muted">Inactive</span>
                  }
                </td>
                <td className="text-xs text-muted">{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
                <td>
                  <button
                    id={`toggle-user-${u._id}`}
                    className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-secondary'}`}
                    onClick={() => toggleActive(u._id)}
                  >
                    {u.isActive ? <><UserX size={14}/> Deactivate</> : <><UserCheck size={14}/> Activate</>}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
