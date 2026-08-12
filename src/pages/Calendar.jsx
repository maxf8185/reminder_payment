import { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, startOfMonth, endOfMonth, isSameMonth, isSameDay } from 'date-fns';

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [lessons, setLessons] = useState([]);
  const [students, setStudents] = useState([]);

  useEffect(() => {
    async function loadData() {
      if (window.electronAPI) {
        const s = await window.electronAPI.getStudents();
        setStudents(s);
        
        // We could fetch actual lessons, but for MVP we will just fetch students and construct dummy views if needed
        // Since we don't have a 'getAllLessons' in IPC yet, I will use students' schedules.
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
      
      // We would match lessons here based on 'cloneDay'
      const dayLessons = students.map(s => {
        // Just mock mapping schedules
        const jsDay = cloneDay.getDay(); 
        const schedDay = jsDay === 0 ? 7 : jsDay;
        // checking if student has schedule today
        return s.schedules?.some(sch => sch.day_of_week === schedDay) ? s : null;
      }).filter(Boolean);

      days.push(
        <div 
          className={`calendar-cell ${!isSameMonth(day, monthStart) ? "disabled" : ""} ${isSameDay(day, new Date()) ? "today" : ""}`} 
          key={day}
          style={{
            padding: 8,
            border: '1px solid var(--panel-border)',
            minHeight: 100,
            background: isSameDay(day, new Date()) ? 'rgba(88, 166, 255, 0.1)' : 'transparent',
            opacity: !isSameMonth(day, monthStart) ? 0.5 : 1
          }}
        >
          <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>{formattedDate}</span>
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
             {/* We mock rendering the students who have schedule on this weekday */}
             {dayLessons.map(stu => (
                <div key={stu.id} style={{ fontSize: 11, background: 'var(--accent-hover)', color: 'white', padding: '2px 4px', borderRadius: 4 }}>
                  {stu.first_name} {stu.last_name}
                </div>
             ))}
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
        <h1>{format(currentDate, "MMMM yyyy")}</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={() => setCurrentDate(addDays(currentDate, -30))}>Prev</button>
          <button className="btn btn-secondary" onClick={() => setCurrentDate(new Date())}>Today</button>
          <button className="btn btn-secondary" onClick={() => setCurrentDate(addDays(currentDate, 30))}>Next</button>
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
