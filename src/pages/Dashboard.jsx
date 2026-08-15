import { useState, useEffect, useContext } from 'react';
import { AlertCircle, Users as UsersIcon, Calendar, Filter, Download, Upload } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

export default function Dashboard() {
  const { currentUser } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [paymentRequiredList, setPaymentRequiredList] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!window.electronAPI) return;
      
      if (currentUser?.role === 'ADMIN') {
        const globalStats = await window.electronAPI.getStats();
        const prList = await window.electronAPI.getGlobalPaymentRequiredList();
        const tList = await window.electronAPI.getUsers();
        const allStudents = await window.electronAPI.getStudents();
        setStats(globalStats);
        setPaymentRequiredList(prList);
        setTeachers(tList.filter(u => u.role === 'TEACHER'));
        setStudents(allStudents);
      } else {
        const myStudents = await window.electronAPI.getStudents();
        setStudents(myStudents);
      }
      setLoading(false);
    }
    loadData();
  }, [currentUser]);

  if (loading) return <div>Loading...</div>;

  const handleExport = async () => {
    if (window.electronAPI) {
      const res = await window.electronAPI.exportExcel();
      if (res.success) alert(`Exported to ${res.filePath}`);
    }
  };

  const handleImport = async () => {
    if (window.electronAPI) {
      const res = await window.electronAPI.importExcel();
      if (res.success) {
        alert(`Imported ${res.imported} students successfully!`);
        // Reload data
        const globalStats = await window.electronAPI.getStats();
        const prList = await window.electronAPI.getGlobalPaymentRequiredList();
        const allStudents = await window.electronAPI.getStudents();
        setStats(globalStats);
        setPaymentRequiredList(prList);
        setStudents(allStudents);
      }
    }
  };

  if (currentUser?.role === 'ADMIN') {
    const displayedStudents = selectedTeacher 
      ? students.filter(s => s.teacher_id === selectedTeacher) 
      : students;

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h1 style={{ margin: 0 }}>Admin Dashboard</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="btn btn-secondary" onClick={handleExport} title="Export Students to Excel" style={{ padding: '6px 12px' }}>
              <Download size={16} />
            </button>
            <button className="btn btn-secondary" onClick={handleImport} title="Import Students from Excel" style={{ padding: '6px 12px' }}>
              <Upload size={16} />
            </button>
            <Filter size={16} className="text-muted" style={{ marginLeft: 16 }} />
            <select 
              className="form-control" 
              style={{ width: 250, marginBottom: 0 }}
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
            >
              <option value="">Global View (All Teachers)</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        </div>
        
        {selectedTeacher ? (
          <div className="card">
            <h2 style={{ marginBottom: 16 }}>Teacher's Students</h2>
            {displayedStudents.length === 0 ? (
              <p className="text-muted">This teacher has no students assigned.</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Level</th>
                      <th>Phone</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedStudents.map(s => (
                      <tr key={s.id}>
                        <td><strong>{s.first_name} {s.last_name}</strong></td>
                        <td>{s.level || '-'}</td>
                        <td>{s.student_phone || '-'}</td>
                        <td><span className={`badge ${s.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>{s.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-4" style={{ marginBottom: 32 }}>
              <div className="card" style={{ borderTop: '4px solid var(--danger-color)' }}>
                <div style={{ color: 'var(--text-muted)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertCircle size={16} color="var(--danger-color)" /> Payment Required
                </div>
                <div style={{ fontSize: 32, fontWeight: 700 }}>{stats?.paymentsRequired || 0}</div>
              </div>
              
              <div className="card" style={{ borderTop: '4px solid var(--panel-border)' }}>
                <div style={{ color: 'var(--text-muted)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <UsersIcon size={16} /> Students
                </div>
                <div style={{ fontSize: 32, fontWeight: 700 }}>{stats?.studentsCount || 0}</div>
              </div>

              <div className="card" style={{ borderTop: '4px solid var(--panel-border)' }}>
                <div style={{ color: 'var(--text-muted)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <UsersIcon size={16} /> Teachers
                </div>
                <div style={{ fontSize: 32, fontWeight: 700 }}>{stats?.teachersCount || 0}</div>
              </div>

              <div className="card" style={{ borderTop: '4px solid var(--panel-border)' }}>
                <div style={{ color: 'var(--text-muted)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Calendar size={16} /> Lessons Today
                </div>
                <div style={{ fontSize: 32, fontWeight: 700 }}>{stats?.lessonsToday || 0}</div>
              </div>
            </div>

            <div className="card">
              <h2 style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--danger-color)' }}>
                <AlertCircle size={20} /> Payment Required
              </h2>
              {paymentRequiredList.length === 0 ? (
                <p className="text-muted">No students require payment at this time.</p>
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Contract</th>
                        <th>Teacher</th>
                        <th>Lessons</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentRequiredList.map(s => (
                        <tr key={s.id}>
                          <td><strong>{s.first_name} {s.last_name}</strong></td>
                          <td>{s.contract_number}</td>
                          <td>{s.teacher_name}</td>
                          <td>{s.used_lessons}</td>
                          <td><span className="badge badge-danger">Payment Required</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  // Teacher Dashboard
  return (
    <div>
      <h1>Good morning, {currentUser?.name}</h1>
      
      <div className="grid grid-cols-2" style={{ marginBottom: 32 }}>
        <div className="card">
          <div style={{ color: 'var(--text-muted)', marginBottom: 8 }}>My Students</div>
          <div style={{ fontSize: 32, fontWeight: 700 }}>{students.length}</div>
        </div>
        <div className="card">
          <div style={{ color: 'var(--text-muted)', marginBottom: 8 }}>Lessons Today</div>
          <div style={{ fontSize: 32, fontWeight: 700 }}>-</div>
        </div>
      </div>

      <div className="card">
        <h2>My Students</h2>
        {students.length === 0 ? (
          <p className="text-muted">You have no students assigned.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Level</th>
                  <th>Phone</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s.id}>
                    <td><strong>{s.first_name} {s.last_name}</strong></td>
                    <td>{s.level || '-'}</td>
                    <td>{s.student_phone || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
