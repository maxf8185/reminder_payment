import { Database, Monitor } from 'lucide-react';

export default function Settings() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>Settings</h1>
      </div>

      <div className="grid grid-cols-2">
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <Monitor size={24} color="var(--accent-color)" />
            <h2 style={{ marginBottom: 0 }}>Application</h2>
          </div>
          <div className="form-group">
            <label className="form-label">Theme</label>
            <select className="form-control" defaultValue="dark">
              <option value="dark">Dark Mode</option>
              <option value="light">Light Mode (Coming Soon)</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Language</label>
            <select className="form-control" defaultValue="en">
              <option value="en">English</option>
              <option value="uk">Ukrainian (Coming Soon)</option>
            </select>
          </div>
          <button className="btn btn-primary" style={{ marginTop: 16 }}>Save Preferences</button>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <Database size={24} color="var(--accent-color)" />
            <h2 style={{ marginBottom: 0 }}>Data Management</h2>
          </div>
          <p className="text-muted" style={{ marginBottom: 24 }}>
            Manage your application data, create backups, or reset the database.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>Export Data Backup</button>
            <button className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>Import Data Backup</button>
            <div style={{ marginTop: 12, paddingTop: 16, borderTop: '1px solid var(--panel-border)' }}>
              <button className="btn" style={{ background: 'rgba(248, 81, 73, 0.1)', color: 'var(--danger-color)', border: '1px solid var(--danger-color)', width: '100%', justifyContent: 'center' }}>
                Reset All Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
