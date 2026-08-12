import { useState, useEffect } from 'react';
import { AlertCircle, Clock, CheckCircle } from 'lucide-react';

export default function Dashboard() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (window.electronAPI) {
        const data = await window.electronAPI.getStudents();
        
        // Enhance with next payment dates
        const enhanced = await Promise.all(data.map(async (s) => {
          const calc = await window.electronAPI.calculateNextPayment(s.id);
          return { ...s, paymentStatus: calc };
        }));
        
        setStudents(enhanced);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) return <div>Loading...</div>;

  const overdue = students.filter(s => s.paymentStatus?.status === 'OVERDUE');
  const dueSoon = students.filter(s => s.paymentStatus?.status === 'DUE_SOON');
  const active = students.filter(s => s.paymentStatus?.status === 'ACTIVE');
  const noPackage = students.filter(s => !s.paymentStatus);

  return (
    <div>
      <h1>Dashboard</h1>
      
      <div className="grid grid-cols-4" style={{ marginBottom: 32 }}>
        <div className="card" style={{ borderTop: '4px solid var(--danger-color)' }}>
          <div style={{ color: 'var(--text-muted)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={16} color="var(--danger-color)" /> Overdue
          </div>
          <div style={{ fontSize: 32, fontWeight: 700 }}>{overdue.length}</div>
        </div>
        
        <div className="card" style={{ borderTop: '4px solid var(--warning-color)' }}>
          <div style={{ color: 'var(--text-muted)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={16} color="var(--warning-color)" /> Due Soon
          </div>
          <div style={{ fontSize: 32, fontWeight: 700 }}>{dueSoon.length}</div>
        </div>

        <div className="card" style={{ borderTop: '4px solid var(--success-color)' }}>
          <div style={{ color: 'var(--text-muted)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle size={16} color="var(--success-color)" /> Active Paid
          </div>
          <div style={{ fontSize: 32, fontWeight: 700 }}>{active.length}</div>
        </div>

        <div className="card" style={{ borderTop: '4px solid var(--panel-border)' }}>
          <div style={{ color: 'var(--text-muted)', marginBottom: 8 }}>
            No Active Package
          </div>
          <div style={{ fontSize: 32, fontWeight: 700 }}>{noPackage.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-2">
        <div className="card">
          <h2>Payment Action Required</h2>
          {overdue.length === 0 && dueSoon.length === 0 ? (
            <p className="text-muted">All payments are up to date.</p>
          ) : (
            <div className="table-container">
              <table>
                <tbody>
                  {overdue.map(s => (
                    <tr key={s.id}>
                      <td>
                        <strong>{s.first_name} {s.last_name}</strong>
                      </td>
                      <td>
                        <span className="badge badge-danger">OVERDUE</span>
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>
                        {s.paymentStatus.remaining} lessons left
                      </td>
                    </tr>
                  ))}
                  {dueSoon.map(s => (
                    <tr key={s.id}>
                      <td>
                        <strong>{s.first_name} {s.last_name}</strong>
                      </td>
                      <td>
                        <span className="badge badge-warning">DUE SOON</span>
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>
                        {s.paymentStatus.remaining} lessons left
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <h2>Today's Lessons</h2>
          <p className="text-muted">Coming soon (requires schedule processing)</p>
        </div>
      </div>
    </div>
  );
}
