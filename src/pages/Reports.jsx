import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, BookOpen } from 'lucide-react';

export default function Reports() {
  const [packages, setPackages] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (window.electronAPI) {
        const pkgs = await window.electronAPI.getAllPackages();
        const less = await window.electronAPI.getAllLessons();
        setPackages(pkgs);
        setLessons(less);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) return <div>Loading...</div>;

  const totalRevenue = packages.reduce((acc, pkg) => acc + pkg.price, 0);
  const totalLessons = lessons.length;
  const activePackagesCount = packages.filter(p => p.status === 'Active').length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>Reports Overview</h1>
      </div>
      
      <div className="grid grid-cols-3" style={{ marginBottom: 32 }}>
        <div className="card" style={{ borderTop: '4px solid var(--success-color)' }}>
          <div style={{ color: 'var(--text-muted)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={16} color="var(--success-color)" /> Total Revenue
          </div>
          <div style={{ fontSize: 32, fontWeight: 700 }}>${totalRevenue.toFixed(2)}</div>
        </div>

        <div className="card" style={{ borderTop: '4px solid var(--info-color)' }}>
          <div style={{ color: 'var(--text-muted)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookOpen size={16} color="var(--info-color)" /> Lessons Completed
          </div>
          <div style={{ fontSize: 32, fontWeight: 700 }}>{totalLessons}</div>
        </div>
        
        <div className="card" style={{ borderTop: '4px solid var(--warning-color)' }}>
          <div style={{ color: 'var(--text-muted)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart3 size={16} color="var(--warning-color)" /> Active Packages
          </div>
          <div style={{ fontSize: 32, fontWeight: 700 }}>{activePackagesCount}</div>
        </div>
      </div>

      <div className="card">
        <h2>Recent Lessons Activity</h2>
        {lessons.length === 0 ? (
          <p className="text-muted">No lessons recorded yet.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {lessons.slice(0, 10).map(lesson => (
                  <tr key={lesson.id}>
                    <td><strong>{lesson.first_name} {lesson.last_name}</strong></td>
                    <td>{lesson.date}</td>
                    <td>{lesson.start_time} - {lesson.end_time}</td>
                    <td><span className="badge badge-success">{lesson.status}</span></td>
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
