import { useState, useEffect } from 'react';
import { Plus, UserPlus } from 'lucide-react';

import StudentProfile from './StudentProfile';

export default function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', phone: '', email: '', comment: ''
  });

  async function loadStudents() {
    if (window.electronAPI) {
      const data = await window.electronAPI.getStudents();
      setStudents(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadStudents();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (window.electronAPI) {
      await window.electronAPI.createStudent(formData);
      setFormData({ firstName: '', lastName: '', phone: '', email: '', comment: '' });
      setShowAdd(false);
      loadStudents();
    }
  }

  if (loading) return <div>Loading...</div>;

  if (selectedStudentId) {
    return <StudentProfile studentId={selectedStudentId} onBack={() => setSelectedStudentId(null)} />;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>Students</h1>
        <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? 'Cancel' : <><UserPlus size={16} /> Add Student</>}
        </button>
      </div>

      {showAdd && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h2>Add New Student</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2" style={{ marginBottom: 16 }}>
              <div className="form-group">
                <label className="form-label">First Name *</label>
                <input required className="form-control" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name *</label>
                <input required className="form-control" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-control" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-control" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Comment</label>
              <input className="form-control" value={formData.comment} onChange={e => setFormData({...formData, comment: e.target.value})} />
            </div>
            <button type="submit" className="btn btn-primary">Save Student</button>
          </form>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Phone</th>
                <th>Start Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '32px' }} className="text-muted">
                    No students found. Add your first student to get started.
                  </td>
                </tr>
              ) : students.map(s => (
                <tr key={s.id}>
                  <td><strong>{s.first_name} {s.last_name}</strong></td>
                  <td><span className={`badge ${s.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>{s.status}</span></td>
                  <td className="text-muted">{s.phone || '-'}</td>
                  <td className="text-muted">{s.start_date}</td>
                  <td>
                    <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: 12 }} onClick={() => setSelectedStudentId(s.id)}>View Profile</button>
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
