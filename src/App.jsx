import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Calendar from './pages/Calendar';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="main-content">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'students' && <Students />}
        {activeTab === 'calendar' && <Calendar />}
        {/* Placeholder for others */}
        {['payments', 'reports', 'settings'].includes(activeTab) && (
          <div>
            <h1>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
            <p className="text-muted">This page is under construction.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
