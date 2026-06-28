import React, { useState, useEffect } from 'react';

export default function StaffList({ backendUrl = '' }) {
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/masters/employees`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setEmployees(data.data);
      } else {
        setError(data.message || 'Failed to load staff list.');
      }
    } catch (err) {
      console.error(err);
      setError('Could not connect to database server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [backendUrl]);

  const filteredEmployees = employees.filter(e => {
    const term = searchTerm.toLowerCase();
    return (
      e.name?.toLowerCase().includes(term) ||
      e.department_name?.toLowerCase().includes(term) ||
      e.unit_name?.toLowerCase().includes(term) ||
      e.phone?.includes(term) ||
      e.email?.toLowerCase().includes(term)
    );
  });

  return (
    <div style={{ padding: '10px 0' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ textAlign: 'left' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>Staff Directory</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14.5px', marginTop: '4px', fontWeight: 500 }}>
            List of registered personnel, contact details, and department allocations.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '350px' }}>
          <input 
            type="text" className="input" style={{ padding: '10px 14px', fontSize: '14px' }}
            placeholder="Search directory..." 
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)} 
          />
          <button className="btn btn-secondary btn-sm" onClick={fetchEmployees}>
            🔄
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(220, 38, 38, 0.08)', color: 'var(--red)', border: '1px solid rgba(220, 38, 38, 0.2)', borderRadius: 'var(--radius-sm)', padding: '12px', marginBottom: '20px', fontSize: '14px', textAlign: 'left' }}>
          ⚠️ {error}
        </div>
      )}

      <div className="glass">
        {loading ? (
          <p style={{ color: 'var(--text-secondary)', padding: '40px 0', fontWeight: 500 }}>Loading staff directory...</p>
        ) : filteredEmployees.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', padding: '40px 0', fontWeight: 500 }}>No matching staff records found.</p>
        ) : (
          <div className="table-container">
            <table className="table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Employee Name</th>
                  <th>Department</th>
                  <th>Location Branch</th>
                  <th>Contact Number</th>
                  <th>Email Address</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((e) => (
                  <tr key={e.id}>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{e.name}</td>
                    <td style={{ fontWeight: 600 }}>
                      <span style={{ 
                        fontSize: '12.5px', color: 'var(--orange)', background: 'var(--orange-glow)', 
                        padding: '4px 10px', borderRadius: '4px', fontWeight: 700 
                      }}>
                        {e.department_name || 'Unassigned'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500 }}>{e.unit_name || 'Unassigned'}</td>
                    <td style={{ fontSize: '13.5px', fontWeight: 500 }}>{e.phone || '-'}</td>
                    <td style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>{e.email || '-'}</td>
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
