import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Plus, Edit, Save } from 'lucide-react';

export default function Teachers() {
  const { currentUser } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ id: null, username: '', password: '', role: 'TEACHER', name: '' });

  async function loadUsers() {
    if (window.electronAPI && currentUser?.role === 'ADMIN') {
      const data = await window.electronAPI.getUsers();
      setUsers(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (window.electronAPI) {
      if (formData.id) {
        await window.electronAPI.updateUser(formData.id, formData);
      } else {
        await window.electronAPI.createUser(formData);
      }
      setShowForm(false);
      loadUsers();
    }
  };

  const handleEdit = (user) => {
    setFormData({ ...user, password: '' });
    setShowForm(true);
  };

  const handleNew = () => {
    setFormData({ id: null, username: '', password: '', role: 'TEACHER', name: '' });
    setShowForm(true);
  };

  if (currentUser?.role !== 'ADMIN') return <div>Access Denied</div>;
  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>Teachers / Users</h1>
        <button className="btn btn-primary" onClick={handleNew}>
          <Plus size={16} style={{ marginRight: 8 }} /> Add User
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3>{formData.id ? 'Edit User' : 'New User'}</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-2">
            <div className="form-group">
              <label className="form-label">Name</label>
              <input type="text" className="form-control" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Username</label>
              <input type="text" className="form-control" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password (leave blank to keep current)</label>
              <input type="password" className="form-control" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required={!formData.id} />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-control" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                <option value="TEACHER">TEACHER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
            <div style={{ gridColumn: 'span 2', display: 'flex', gap: 8 }}>
              <button type="submit" className="btn btn-primary"><Save size={16} /> Save</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td><strong>{u.name}</strong></td>
                  <td>{u.username}</td>
                  <td><span className={`badge ${u.role === 'ADMIN' ? 'badge-warning' : ''}`}>{u.role}</span></td>
                  <td>
                    <button className="btn btn-secondary" onClick={() => handleEdit(u)} style={{ padding: '4px 8px' }}>
                      <Edit size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
