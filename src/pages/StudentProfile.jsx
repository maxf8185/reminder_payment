import { useState, useEffect, useContext } from 'react';
import { ArrowLeft, CreditCard, Edit, Save, Trash2, Send } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

export default function StudentProfile({ studentId, onBack }) {
  const { currentUser } = useContext(AuthContext);
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Payment Form
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentData, setPaymentData] = useState({
    totalLessons: 5, price: 100, paymentDate: new Date().toISOString().split('T')[0], startDate: new Date().toISOString().split('T')[0]
  });

  // Lesson Form
  const [lessonDate, setLessonDate] = useState(new Date().toISOString().split('T')[0]);

  // Edit Mode
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [teachers, setTeachers] = useState([]);

  async function loadData() {
    if (window.electronAPI) {
      try {
        const data = await window.electronAPI.getStudent(studentId);
        const calc = await window.electronAPI.calculateNextPayment(studentId);
        setStudent({ ...data, paymentStatus: calc });
        setEditData({
          firstName: data.first_name,
          lastName: data.last_name,
          level: data.level || '',
          studentPhone: data.student_phone || '',
          parentPhone: data.parent_phone || '',
          contractNumber: data.contract_number || '',
          teacherId: data.teacher_id || '',
          status: data.status || 'Active'
        });

        if (currentUser?.role === 'ADMIN') {
          const t = await window.electronAPI.getUsers();
          setTeachers(t.filter(u => u.role === 'TEACHER'));
        }
      } catch (e) {
        console.error(e);
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

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
    const activePackage = student.packages.find(p => p.status === 'Active');
    if (!activePackage) {
      alert("No active payment cycle!");
      return;
    }
    if (window.electronAPI) {
      try {
        await window.electronAPI.completeLesson({
          studentId,
          packageId: activePackage.id,
          date: lessonDate,
          startTime: '18:00', // Could be dynamic if needed
          endTime: '19:00',
          comment: ''
        });
        loadData();
      } catch (error) {
        alert(error.message);
      }
    }
  }

  async function handleDeleteLesson(lessonId) {
    if (window.confirm("Are you sure you want to delete this lesson?")) {
      if (window.electronAPI) {
        await window.electronAPI.deleteLesson(lessonId);
        loadData();
      }
    }
  }

  async function handleSendInvoice(packageId) {
    if (window.electronAPI) {
      await window.electronAPI.markInvoiceSent(packageId);
      loadData();
    }
  }

  async function handleSaveEdit() {
    if (window.electronAPI) {
      await window.electronAPI.updateStudent(studentId, {
        ...student,
        firstName: editData.firstName,
        lastName: editData.lastName,
        level: editData.level,
        studentPhone: editData.studentPhone,
        parentPhone: editData.parentPhone,
        contractNumber: editData.contractNumber,
        teacherId: editData.teacherId,
        status: editData.status
      });
      setEditMode(false);
      loadData();
    }
  }

  if (loading) return <div>Loading...</div>;
  if (!student) return <div>Student not found or access denied.</div>;

  // Active or INVOICE_SENT or PAYMENT_REQUIRED
  const activePackage = student.packages.find(p => p.status === 'Active' || p.status === 'PAYMENT_REQUIRED' || p.status === 'INVOICE_SENT');
  const isAdmin = currentUser?.role === 'ADMIN';

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button className="btn btn-secondary" onClick={onBack} style={{ padding: '8px' }}>
            <ArrowLeft size={16} />
          </button>
          <h1 style={{ margin: 0 }}>{student.first_name} {student.last_name}</h1>
          <span className={`badge ${student.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>
            {student.status}
          </span>
        </div>
        
        {isAdmin && !editMode && (
          <button className="btn btn-secondary" onClick={() => setEditMode(true)}>
            <Edit size={16} /> Edit Profile
          </button>
        )}
      </div>

      <div className="grid grid-cols-3" style={{ marginBottom: 32 }}>
        <div className="card" style={{ gridColumn: 'span 2' }}>
          {editMode ? (
            <div style={{ padding: 16, border: '1px solid var(--panel-border)', borderRadius: 8 }}>
              <h3>Edit Profile</h3>
              <div className="grid grid-cols-2">
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input type="text" className="form-control" value={editData.firstName} onChange={e => setEditData({...editData, firstName: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input type="text" className="form-control" value={editData.lastName} onChange={e => setEditData({...editData, lastName: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-control" value={editData.status} onChange={e => setEditData({...editData, status: e.target.value})}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Level</label>
                  <input type="text" className="form-control" value={editData.level} onChange={e => setEditData({...editData, level: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Contract Number</label>
                  <input type="text" className="form-control" value={editData.contractNumber} onChange={e => setEditData({...editData, contractNumber: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Teacher</label>
                  <select className="form-control" value={editData.teacherId} onChange={e => setEditData({...editData, teacherId: e.target.value})}>
                    <option value="">No Teacher</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Student Phone</label>
                  <input type="text" className="form-control" value={editData.studentPhone} onChange={e => setEditData({...editData, studentPhone: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Parent Phone</label>
                  <input type="text" className="form-control" value={editData.parentPhone} onChange={e => setEditData({...editData, parentPhone: e.target.value})} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button className="btn btn-primary" onClick={handleSaveEdit}><Save size={16} /> Save</button>
                <button className="btn btn-secondary" onClick={() => setEditMode(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <h2>Payment Cycle Information</h2>
                {isAdmin && (
                  <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => setShowPaymentForm(!showPaymentForm)}>
                    <CreditCard size={14} /> {showPaymentForm ? 'Cancel' : 'Add Payment (Start New Cycle)'}
                  </button>
                )}
              </div>

              {showPaymentForm && isAdmin && (
                <div style={{ marginBottom: 24, padding: 16, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--panel-border)' }}>
                  <h3 style={{ marginBottom: 16, fontSize: 16 }}>New Payment</h3>
                  <form onSubmit={handleAddPayment} className="grid grid-cols-2">
                    <div className="form-group">
                      <label className="form-label">Lessons in Cycle</label>
                      <input type="number" required className="form-control" value={paymentData.totalLessons} onChange={e => setPaymentData({...paymentData, totalLessons: e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Price</label>
                      <input type="number" step="0.01" required className="form-control" value={paymentData.price} onChange={e => setPaymentData({...paymentData, price: e.target.value})} />
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <button type="submit" className="btn btn-primary">Record Payment</button>
                    </div>
                  </form>
                </div>
              )}
              
              {activePackage ? (
                <div className="grid grid-cols-3" style={{ gap: 16 }}>
                  <div>
                    <div className="text-muted" style={{ fontSize: 12, marginBottom: 4 }}>Cycle Length</div>
                    <div style={{ fontSize: 24, fontWeight: 700 }}>{activePackage.total_lessons}</div>
                  </div>
                  <div>
                    <div className="text-muted" style={{ fontSize: 12, marginBottom: 4 }}>Completed</div>
                    <div style={{ fontSize: 24, fontWeight: 700 }}>{activePackage.used_lessons}</div>
                  </div>
                  <div>
                    <div className="text-muted" style={{ fontSize: 12, marginBottom: 4 }}>Status</div>
                    <div>
                      {activePackage.status === 'PAYMENT_REQUIRED' && <span className="badge badge-danger">Payment Required</span>}
                      {activePackage.status === 'INVOICE_SENT' && <span className="badge badge-warning">Invoice Sent</span>}
                      {activePackage.status === 'Active' && <span className="badge badge-success">Active</span>}
                    </div>
                  </div>
                  
                  <div style={{ gridColumn: 'span 3', marginTop: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
                    {activePackage.status === 'Active' ? (
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '8px 16px', borderRadius: 8, border: '1px solid var(--panel-border)' }}>
                        <input 
                          type="date" 
                          className="form-control" 
                          style={{ marginBottom: 0 }}
                          value={lessonDate}
                          onChange={(e) => setLessonDate(e.target.value)}
                        />
                        <button className="btn btn-secondary" onClick={handleCompleteLesson}>
                          Mark Lesson
                        </button>
                      </div>
                    ) : (
                      <div className="text-muted">Cycle is complete. Waiting for new payment.</div>
                    )}

                    {isAdmin && activePackage.status === 'PAYMENT_REQUIRED' && (
                      <button className="btn btn-secondary" onClick={() => handleSendInvoice(activePackage.id)}>
                        <Send size={16} style={{ marginRight: 8 }} /> Mark as Invoice Sent
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-muted">No active payment cycle. {isAdmin && "Add a payment to create one."}</div>
              )}
            </div>
          )}
        </div>

        <div className="card">
          <h2>Student Details</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div className="text-muted" style={{ fontSize: 12 }}>Level</div>
              <div>{student.level || '-'}</div>
            </div>
            <div>
              <div className="text-muted" style={{ fontSize: 12 }}>Teacher</div>
              <div>{student.teacher_name || '-'}</div>
            </div>
            <div>
              <div className="text-muted" style={{ fontSize: 12 }}>Contract</div>
              <div>{student.contract_number || '-'}</div>
            </div>
            <div>
              <div className="text-muted" style={{ fontSize: 12 }}>Student Phone</div>
              <div>{student.student_phone || '-'}</div>
            </div>
            <div>
              <div className="text-muted" style={{ fontSize: 12 }}>Parent Phone</div>
              <div>{student.parent_phone || '-'}</div>
            </div>
          </div>
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
                      {isAdmin && (
                        <td style={{ textAlign: 'right' }}>
                          <button className="btn" style={{ padding: 4, background: 'transparent' }} onClick={() => handleDeleteLesson(l.id)}>
                            <Trash2 size={16} color="var(--danger-color)" />
                          </button>
                        </td>
                      )}
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
                      <td>{p.price}</td>
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
