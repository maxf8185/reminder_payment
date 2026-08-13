import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Bell, CheckCircle } from 'lucide-react';

export default function Notifications() {
  const { currentUser } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadNotifications() {
    if (window.electronAPI && currentUser?.role === 'ADMIN') {
      const data = await window.electronAPI.getNotifications();
      setNotifications(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadNotifications();
  }, [currentUser]);

  const handleMarkRead = async (id) => {
    if (window.electronAPI) {
      await window.electronAPI.markNotificationRead(id);
      loadNotifications();
    }
  };

  if (currentUser?.role !== 'ADMIN') return <div>Access Denied</div>;
  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Bell size={24} /> Notifications
      </h1>

      <div className="card">
        {notifications.length === 0 ? (
          <p className="text-muted">No notifications.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {notifications.map(n => (
              <div key={n.id} style={{ 
                padding: 16, 
                borderRadius: 8, 
                background: n.status === 'UNREAD' ? 'rgba(255,88,88,0.1)' : 'rgba(255,255,255,0.02)',
                border: n.status === 'UNREAD' ? '1px solid var(--danger-color)' : '1px solid var(--panel-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    {n.status === 'UNREAD' && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--danger-color)' }} />}
                    <strong>{n.type}</strong>
                    <span className="text-muted" style={{ fontSize: 12 }}>{n.created_at}</span>
                  </div>
                  <div>{n.message}</div>
                </div>
                {n.status === 'UNREAD' && (
                  <button className="btn btn-secondary" onClick={() => handleMarkRead(n.id)}>
                    <CheckCircle size={16} /> Mark Read
                  </button>
                )}
                {n.status === 'RESOLVED' && (
                  <span className="badge badge-success">Resolved</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
