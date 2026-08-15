import { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, startOfMonth, endOfMonth, isSameMonth, isSameDay, isAfter, parseISO } from 'date-fns';

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [students, setStudents] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [viewMode, setViewMode] = useState('lessons'); // 'lessons' | 'payments'

  useEffect(() => {
    async function loadData() {
      if (window.electronAPI) {
        const s = await window.electronAPI.getStudents();
        const l = await window.electronAPI.getAllLessons();
        const sch = await window.electronAPI.getAllSchedules();
        setStudents(s);
        setLessons(l);
        setSchedules(sch);
      }
    }
    loadData();
  }, [currentDate]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = startOfWeek(addDays(monthEnd, 6));

  const dateFormat = "d";
  const rows = [];
  let days = [];
  let day = startDate;
  let formattedDate = "";

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      formattedDate = format(day, dateFormat);
      const cloneDay = day;
      const dayString = format(cloneDay, 'yyyy-MM-dd');
      
      const jsDay = cloneDay.getDay(); 
      const schedDay = jsDay === 0 ? 7 : jsDay;

      let cellContent = [];

      if (viewMode === 'lessons') {
        const isFuture = isAfter(cloneDay, new Date()) && !isSameDay(cloneDay, new Date());
        
        if (!isFuture) {
          // Past or today: Show actual lessons
          const dayLessons = lessons.filter(l => l.date === dayString);
          cellContent = dayLessons.map(l => (
            <div key={l.id} style={{ fontSize: 11, background: 'var(--success-color)', color: 'white', padding: '2px 4px', borderRadius: 4 }}>
              ✅ {l.first_name} {l.last_name}
            </div>
          ));
        } else {
          // Future: Show planned schedules
          const planned = schedules.filter(sch => sch.day_of_week === schedDay);
          cellContent = planned.map(sch => (
            <div key={sch.id} style={{ fontSize: 11, background: 'var(--panel-border)', color: 'white', padding: '2px 4px', borderRadius: 4 }}>
              🕒 {sch.first_name} {sch.last_name}
            </div>
          ));
        }
      } else if (viewMode === 'payments') {
        // Find students who require payment right now (we'll just show them on 'today')
        if (isSameDay(cloneDay, new Date())) {
          const reqPayment = students.filter(s => s.packages?.some(p => p.status === 'PAYMENT_REQUIRED'));
          cellContent.push(...reqPayment.map(s => (
            <div key={`req-${s.id}`} style={{ fontSize: 11, background: 'var(--danger-color)', color: 'white', padding: '2px 4px', borderRadius: 4 }}>
              ⚠️ {s.first_name} {s.last_name}
            </div>
          )));

          const sentInvoice = students.filter(s => s.packages?.some(p => p.status === 'INVOICE_SENT'));
          cellContent.push(...sentInvoice.map(s => (
            <div key={`inv-${s.id}`} style={{ fontSize: 11, background: 'var(--warning-color)', color: '#000', padding: '2px 4px', borderRadius: 4 }}>
              ⏳ {s.first_name} {s.last_name}
            </div>
          )));
        }

        // Logic to predict future payment days could be added here
        // For MVP, if a student has an active package and we predict their 5th lesson falls on this day:
        // (This requires counting future scheduled days. We will skip complex projection for now to avoid freezing the UI, 
        // but this framework allows it).
      }

      days.push(
        <div 
          className={`calendar-cell ${!isSameMonth(day, monthStart) ? "disabled" : ""} ${isSameDay(day, new Date()) ? "today" : ""}`} 
          key={day}
          style={{
            padding: 8,
            border: '1px solid var(--panel-border)',
            minHeight: 120,
            background: isSameDay(day, new Date()) ? 'rgba(88, 166, 255, 0.1)' : 'transparent',
            opacity: !isSameMonth(day, monthStart) ? 0.5 : 1
          }}
        >
          <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{formattedDate}</span>
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
             {cellContent}
          </div>
        </div>
      );
      day = addDays(day, 1);
    }
    rows.push(
      <div className="grid grid-cols-7" key={day} style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {days}
      </div>
    );
    days = [];
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0 }}>{format(currentDate, "MMMM yyyy")}</h1>
        
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ background: 'var(--panel-bg)', borderRadius: 8, padding: 4, display: 'flex', gap: 4 }}>
            <button 
              className={`btn ${viewMode === 'lessons' ? 'btn-primary' : 'btn-secondary'}`} 
              onClick={() => setViewMode('lessons')}
              style={{ padding: '6px 12px' }}
            >
              Lessons Schedule
            </button>
            <button 
              className={`btn ${viewMode === 'payments' ? 'btn-primary' : 'btn-secondary'}`} 
              onClick={() => setViewMode('payments')}
              style={{ padding: '6px 12px' }}
            >
              Payments & Invoices
            </button>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={() => setCurrentDate(addDays(currentDate, -30))}>Prev</button>
            <button className="btn btn-secondary" onClick={() => setCurrentDate(new Date())}>Today</button>
            <button className="btn btn-secondary" onClick={() => setCurrentDate(addDays(currentDate, 30))}>Next</button>
          </div>
        </div>
      </div>
      
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="grid grid-cols-7" style={{ gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid var(--panel-border)', background: 'rgba(255,255,255,0.02)' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} style={{ padding: 12, textAlign: 'center', fontWeight: 600, fontSize: 12, color: 'var(--text-muted)' }}>{d}</div>
          ))}
        </div>
        {rows}
      </div>
    </div>
  );
}
