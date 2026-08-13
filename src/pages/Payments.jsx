import { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, AlertCircle } from 'lucide-react';

export default function Payments() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (window.electronAPI) {
        const data = await window.electronAPI.getAllPackages();
        setPackages(data);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>Payments History</h1>
      </div>
      
      <div className="card">
        {packages.length === 0 ? (
          <p className="text-muted">No payment records found.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Date</th>
                  <th>Total Lessons</th>
                  <th>Price</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {packages.map(pkg => (
                  <tr key={pkg.id}>
                    <td><strong>{pkg.first_name} {pkg.last_name}</strong></td>
                    <td>{pkg.payment_date}</td>
                    <td>{pkg.total_lessons}</td>
                    <td>${pkg.price.toFixed(2)}</td>
                    <td>
                      {pkg.status === 'Active' ? (
                        <span className="badge badge-success" style={{display: 'inline-flex', alignItems: 'center'}}><CheckCircle size={12} style={{marginRight: 4}}/> Active</span>
                      ) : (
                        <span className="badge badge-warning" style={{display: 'inline-flex', alignItems: 'center'}}><AlertCircle size={12} style={{marginRight: 4}}/> {pkg.status}</span>
                      )}
                    </td>
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
