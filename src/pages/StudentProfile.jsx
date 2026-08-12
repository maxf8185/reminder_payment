import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Calendar as CalendarIcon, CreditCard } from 'lucide-react';

export default function StudentProfile({ studentId, onBack }) {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentData, setPaymentData] = useState({
    totalLessons: 5, price: 100, paymentDate: new Date().toISOString().split('T')[0], startDate: new Date().toISOString().split('T')[0]
  });

  async function loadData() {
    if (window.electronAPI) {
      const data = await window.electronAPI.getStudent(studentId);
      const calc = await window.electronAPI.calculateNextPayment(studentId);
      setStudent({ ...data, paymentStatus: calc });
    }
    setLoading(false);
  }

  async function handleAddPayment(e) {
    e.preventDefault();
    if (window.electronAPI) {
      await window.electronAPI.createPackage({
        studentId,
        totalLessons: parseInt(paymentData.totalLessons),
        price: parseFloat(paymentData.price),
        paymentDate: paymentData.paymentDate,
        startDate: paymentData.startDate
      });
      setShowPaymentForm(false);
      loadData();
    }
  }

  async function handleCompleteLesson() {
    if (!activePackage) return;
    if (window.electronAPI) {
      const today = new Date().toISOString().split('T')[0];
      await window.electronAPI.completeLesson({
        studentId,
        packageId: activePackage.id,
        date: today,
        startTime: '18:00', // Mock time for now
        endTime: '19:00',
        comment: ''
      });
      loadData();
    }
  }

  useEffect(() => {
    loadData();
  }, [studentId]);

  if (loading) return <div>Loading...</div>;
  if (!student) return <div>Student not found</div>;

  const activePackage = student.packages.find(p => p.status === 'Active');

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <button className="btn btn-secondary" onClick={onBack} style={{ padding: '8px' }}>
          <ArrowLeft size={16} />
        </button>
        <h1 style={{ margin: 0 }}>{student.first_name} {student.last_name}</h1>
        <span className={`badge ${student.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>
          {student.status}
        </span>
      </div>

      <div className="grid grid-cols-3" style={{ marginBottom: 32 }}>
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <h2>Active Package</h2>
            <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => setShowPaymentForm(!showPaymentForm)}>
              <CreditCard size={14} /> {showPaymentForm ? 'Cancel' : 'Add Payment'}
            </button>
          </div>

          {showPaymentForm && (
            <div style={{ marginBottom: 24, padding: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--panel-border)' }}>
              <h3 style={{ marginBottom: 16, fontSize: 16 }}>New Payment</h3>
              <form onSubmit={handleAddPayment} className="grid grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Number of Lessons</label>
                  <input type="number" required className="form-control" value={paymentData.totalLessons} onChange={e => setPaymentData({...paymentData, totalLessons: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Price (€)</label>
                  <input type="number" step="0.01" required className="form-control" value={paymentData.price} onChange={e => setPaymentData({...paymentData, price: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Payment Date</label>
                  <input type="date" required className="form-control" value={paymentData.paymentDate} onChange={e => setPaymentData({...paymentData, paymentDate: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Package Start Date</label>
                  <input type="date" required className="form-control" value={paymentData.startDate} onChange={e => setPaymentData({...paymentData, startDate: e.target.value})} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <button type="submit" className="btn btn-primary">Save Payment</button>
                </div>
              </form>
            </div>
          )}
          
          {activePackage ? (
            <div className="grid grid-cols-3" style={{ gap: 16 }}>
              <div>
                <div className="text-muted" style={{ fontSize: 12, marginBottom: 4 }}>Total Lessons</div>
                <div style={{ fontSize: 24, fontWeight: 700 }}>{activePackage.total_lessons}</div>
              </div>
              <div>
                <div className="text-muted" style={{ fontSize: 12, marginBottom: 4 }}>Used</div>
                <div style={{ fontSize: 24, fontWeight: 700 }}>{activePackage.used_lessons}</div>
              </div>
              <div>
                <div className="text-muted" style={{ fontSize: 12, marginBottom: 4 }}>Remaining</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent-color)' }}>
                  {activePackage.total_lessons - activePackage.used_lessons}
                </div>
              </div>
              <div style={{ gridColumn: 'span 3', marginTop: 16 }}>
                <button className="btn btn-secondary" onClick={handleCompleteLesson}>
                  Mark Lesson as Completed
                </button>
              </div>
            </div>
          ) : (
            <div className="text-muted">No active package. Add a payment to create one.</div>
          )}

          {student.paymentStatus && (
            <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--panel-border)' }}>
              <div className="text-muted" style={{ fontSize: 12, marginBottom: 4 }}>Expected Next Payment</div>
              <div style={{ fontWeight: 600, color: student.paymentStatus.status === 'OVERDUE' ? 'var(--danger-color)' : student.paymentStatus.status === 'DUE_SOON' ? 'var(--warning-color)' : 'var(--text-main)' }}>
                {student.paymentStatus.expectedDate || 'Unknown'} 
                <span className="badge" style={{ marginLeft: 8 }}>{student.paymentStatus.status}</span>
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2>Schedule</h2>
            <button className="btn btn-secondary" style={{ padding: '4px', border: 'none' }}>
              <Plus size={16} />
            </button>
          </div>
          {student.schedules.length === 0 ? (
            <p className="text-muted">No schedule added.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {student.schedules.map(s => {
                const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                return (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 6 }}>
                    <CalendarIcon size={14} className="text-muted" />
                    <span>{days[s.day_of_week === 7 ? 0 : s.day_of_week]} at {s.time}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2">
        <div className="card">
          <h2>Lesson History</h2>
          {student.lessons.length === 0 ? (
            <p className="text-muted">No lessons recorded.</p>
          ) : (
            <div className="table-container">
              <table>
                <tbody>
                  {student.lessons.map(l => (
                    <tr key={l.id}>
                      <td>{l.date}</td>
                      <td><span className="badge">{l.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card">
          <h2>Payment History</h2>
          {student.packages.length === 0 ? (
            <p className="text-muted">No payments recorded.</p>
          ) : (
            <div className="table-container">
              <table>
                <tbody>
                  {student.packages.map(p => (
                    <tr key={p.id}>
                      <td>{p.payment_date}</td>
                      <td>€{p.price}</td>
                      <td className="text-muted">{p.total_lessons} lessons</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
