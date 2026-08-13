import { useState, useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Calendar from './pages/Calendar';
import Payments from './pages/Payments';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Notifications from './pages/Notifications';
import Teachers from './pages/Teachers';

function App() {
  const { currentUser } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!currentUser) {
    return <Login />;
  }

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="main-content">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'students' && <Students />}
        {activeTab === 'calendar' && <Calendar />}
        {activeTab === 'payments' && <Payments />}
        {activeTab === 'reports' && <Reports />}
        {activeTab === 'settings' && <Settings />}
        {activeTab === 'notifications' && <Notifications />}
        {activeTab === 'teachers' && <Teachers />}
      </div>
    </div>
  );
}

export default App;
