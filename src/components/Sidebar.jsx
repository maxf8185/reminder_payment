import { LayoutDashboard, Users, Calendar, CreditCard, BarChart2, Settings, Zap, Bell, LogOut } from 'lucide-react';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { currentUser, logout } = useContext(AuthContext);

  const adminTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={20} /> },
    { id: 'teachers', label: 'Teachers', icon: <Users size={20} /> },
    { id: 'students', label: 'Students', icon: <Users size={20} /> },
    { id: 'calendar', label: 'Calendar', icon: <Calendar size={20} /> },
    { id: 'payments', label: 'Payments', icon: <CreditCard size={20} /> },
    { id: 'reports', label: 'Reports', icon: <BarChart2 size={20} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  const teacherTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'students', label: 'My Students', icon: <Users size={20} /> },
    { id: 'calendar', label: 'My Lessons', icon: <Calendar size={20} /> },
  ];

  const tabs = currentUser?.role === 'ADMIN' ? adminTabs : teacherTabs;

  return (
    <div className="sidebar" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div className="sidebar-logo">
        <Zap color="#58a6ff" fill="#58a6ff" />
        Reminder
      </div>
      
      <nav style={{ flex: 1 }}>
        {tabs.map(tab => (
          <div 
            key={tab.id}
            className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            {tab.label}
          </div>
        ))}
      </nav>

      <div style={{ padding: 16 }}>
        <div style={{ marginBottom: 16, fontSize: 14, color: 'var(--text-muted)' }}>
          {currentUser?.name} ({currentUser?.role})
        </div>
        <button className="btn btn-secondary" style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: 8 }} onClick={logout}>
          <LogOut size={16} /> Logout
        </button>
      </div>
    </div>
  );
}
