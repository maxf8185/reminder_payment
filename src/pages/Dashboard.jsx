import { useState, useEffect, useContext } from 'react';
import { AlertCircle, Clock, CheckCircle, Users as UsersIcon, Calendar } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

export default function Dashboard() {
  const { currentUser } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [paymentRequiredList, setPaymentRequiredList] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!window.electronAPI) return;
      
      if (currentUser?.role === 'ADMIN') {
        const globalStats = await window.electronAPI.getStats();
        const prList = await window.electronAPI.getGlobalPaymentRequiredList();
        setStats(globalStats);
        setPaymentRequiredList(prList);
      } else {
        const myStudents = await window.electronAPI.getStudents();
        setStudents(myStudents);
      }
      setLoading(false);
    }
    loadData();
  }, [currentUser]);

  if (loading) return <div>Loading...</div>;

  if (currentUser?.role === 'ADMIN') {
    return (
      <div>
        <h1>Admin Dashboard</h1>
        
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
