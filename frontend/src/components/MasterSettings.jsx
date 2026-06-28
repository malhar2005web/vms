import React, { useState, useEffect } from 'react';

export default function MasterSettings({ backendUrl = '', panelType = 'units' }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Data lists
  const [units, setUnits] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [gates, setGates] = useState([]);
  const [purposes, setPurposes] = useState([]);
  const [users, setUsers] = useState([]);

  // Form input states
  const [unitForm, setUnitForm] = useState({ id: null, name: '', address: '' });
  const [deptForm, setDeptForm] = useState({ id: null, name: '' });
  const [empForm, setEmpForm] = useState({ id: null, name: '', email: '', phone: '', department_id: '', unit_id: '' });
  const [gateForm, setGateForm] = useState({ id: null, name: '', unit_id: '' });
  const [purposeForm, setPurposeForm] = useState({ id: null, name: '' });
  const [userForm, setUserForm] = useState({ id: null, username: '', password: '', role: 'admin' });

  // Fetch data based on panelType
  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${backendUrl}/api/masters/${panelType}`, { credentials: 'include' });
      const json = await res.json();
      if (json.success) {
        if (panelType === 'units') setUnits(json.data);
        if (panelType === 'departments') setDepartments(json.data);
        if (panelType === 'employees') setEmployees(json.data);
        if (panelType === 'gates') setGates(json.data);
        if (panelType === 'purposes') setPurposes(json.data);
        if (panelType === 'users') setUsers(json.data);
      } else {
        setError(json.message || `Failed to fetch ${panelType}`);
      }
    } catch (err) {
      console.error(err);
      setError('Network connection error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Load helper relation items for dropdown mappings
    if (panelType === 'employees' || panelType === 'gates') {
      loadHelperData();
    }
  }, [panelType]);

  const loadHelperData = async () => {
    try {
      const uRes = await fetch(`${backendUrl}/api/masters/units`, { credentials: 'include' });
      const uJson = await uRes.json();
      if (uJson.success) setUnits(uJson.data);

      const dRes = await fetch(`${backendUrl}/api/masters/departments`, { credentials: 'include' });
      const dJson = await dRes.json();
      if (dJson.success) setDepartments(dJson.data);
    } catch (e) {
      console.error('Helper load error:', e);
    }
  };

  // 1. UNITS CRUD SUBMIT
  const handleUnitSubmit = async (e) => {
    e.preventDefault();
    const isEdit = !!unitForm.id;
    const url = isEdit ? `${backendUrl}/api/masters/units/${unitForm.id}` : `${backendUrl}/api/masters/units`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(unitForm),
        credentials: 'include'
      });
      const json = await res.json();
      if (json.success) {
        setUnitForm({ id: null, name: '', address: '' });
        fetchData();
      } else {
        alert(json.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnitDelete = async (id) => {
    if (!window.confirm('Delete unit? Doing so deletes associated gates recursively!')) return;
    try {
      const res = await fetch(`${backendUrl}/api/masters/units/${id}`, { method: 'DELETE', credentials: 'include' });
      const json = await res.json();
      if (json.success) fetchData();
      else alert(json.message);
    } catch (err) {
      console.error(err);
    }
  };

  // 2. DEPARTMENTS CRUD SUBMIT
  const handleDeptSubmit = async (e) => {
    e.preventDefault();
    const isEdit = !!deptForm.id;
    const url = isEdit ? `${backendUrl}/api/masters/departments/${deptForm.id}` : `${backendUrl}/api/masters/departments`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deptForm),
        credentials: 'include'
      });
      const json = await res.json();
      if (json.success) {
        setDeptForm({ id: null, name: '' });
        fetchData();
      } else {
        alert(json.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeptDelete = async (id) => {
    if (!window.confirm('Delete department?')) return;
    try {
      const res = await fetch(`${backendUrl}/api/masters/departments/${id}`, { method: 'DELETE', credentials: 'include' });
      const json = await res.json();
      if (json.success) fetchData();
      else alert(json.message);
    } catch (err) {
      console.error(err);
    }
  };

  // 3. EMPLOYEES CRUD SUBMIT
  const handleEmpSubmit = async (e) => {
    e.preventDefault();
    const isEdit = !!empForm.id;
    const url = isEdit ? `${backendUrl}/api/masters/employees/${empForm.id}` : `${backendUrl}/api/masters/employees`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(empForm),
        credentials: 'include'
      });
      const json = await res.json();
      if (json.success) {
        setEmpForm({ id: null, name: '', email: '', phone: '', department_id: '', unit_id: '' });
        fetchData();
      } else {
        alert(json.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEmpDelete = async (id) => {
    if (!window.confirm('Delete employee record?')) return;
    try {
      const res = await fetch(`${backendUrl}/api/masters/employees/${id}`, { method: 'DELETE', credentials: 'include' });
      const json = await res.json();
      if (json.success) fetchData();
      else alert(json.message);
    } catch (err) {
      console.error(err);
    }
  };

  // 4. GATES CRUD SUBMIT
  const handleGateSubmit = async (e) => {
    e.preventDefault();
    const isEdit = !!gateForm.id;
    const url = isEdit ? `${backendUrl}/api/masters/gates/${gateForm.id}` : `${backendUrl}/api/masters/gates`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gateForm),
        credentials: 'include'
      });
      const json = await res.json();
      if (json.success) {
        setGateForm({ id: null, name: '', unit_id: '' });
        fetchData();
      } else {
        alert(json.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGateDelete = async (id) => {
    if (!window.confirm('Delete Gate entrance?')) return;
    try {
      const res = await fetch(`${backendUrl}/api/masters/gates/${id}`, { method: 'DELETE', credentials: 'include' });
      const json = await res.json();
      if (json.success) fetchData();
      else alert(json.message);
    } catch (err) {
      console.error(err);
    }
  };

  // 5. PURPOSES CRUD SUBMIT
  const handlePurposeSubmit = async (e) => {
    e.preventDefault();
    const isEdit = !!purposeForm.id;
    const url = isEdit ? `${backendUrl}/api/masters/purposes/${purposeForm.id}` : `${backendUrl}/api/masters/purposes`;
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(purposeForm),
        credentials: 'include'
      });
      const json = await res.json();
      if (json.success) {
        setPurposeForm({ id: null, name: '' });
        fetchData();
      } else {
        alert(json.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePurposeDelete = async (id) => {
    if (!window.confirm('Delete purpose?')) return;
    try {
      const res = await fetch(`${backendUrl}/api/masters/purposes/${id}`, { method: 'DELETE', credentials: 'include' });
      const json = await res.json();
      if (json.success) fetchData();
      else alert(json.message);
    } catch (err) {
      console.error(err);
    }
  };

  // 6. SUB-USERS CRUD SUBMIT
  const handleUserSubmit = async (e) => {
    e.preventDefault();
    const isEdit = !!userForm.id;
    const url = isEdit ? `${backendUrl}/api/masters/users/${userForm.id}` : `${backendUrl}/api/masters/users`;
    const method = isEdit ? 'PUT' : 'POST';

    if (!isEdit && !userForm.password) {
      alert('Password is required when creating a new user.');
      return;
    }

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm),
        credentials: 'include'
      });
      const json = await res.json();
      if (json.success) {
        setUserForm({ id: null, username: '', password: '', role: 'admin' });
        fetchData();
      } else {
        alert(json.message);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUserDelete = async (id) => {
    if (!window.confirm('Delete this user account?')) return;
    try {
      const res = await fetch(`${backendUrl}/api/masters/users/${id}`, { method: 'DELETE', credentials: 'include' });
      const json = await res.json();
      if (json.success) fetchData();
      else alert(json.message);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: '10px 0' }}>
      
      {error && (
        <div style={{ 
          background: 'rgba(220, 38, 38, 0.08)', color: 'var(--red)', 
          border: '1px solid rgba(220, 38, 38, 0.2)', borderRadius: 'var(--radius-sm)', 
          padding: '12px', marginBottom: '20px', fontSize: '14px',
          display: 'flex', gap: '8px', alignItems: 'center'
        }}>
          ⚠️ {error}
        </div>
      )}

      <div className="grid-2" style={{ alignItems: 'start' }}>
        
        {/* LEFT COLUMN: ADD / EDIT PANEL */}
        <div className="glass">
          <h3 style={{ color: 'var(--orange)', marginBottom: '20px', fontSize: '18px', fontWeight: 700 }}>
            {panelType === 'units' && (unitForm.id ? 'Edit Unit Details' : 'Add New Unit')}
            {panelType === 'departments' && (deptForm.id ? 'Edit Department Details' : 'Add New Department')}
            {panelType === 'employees' && (empForm.id ? 'Edit Employee Details' : 'Add New Employee')}
            {panelType === 'gates' && (gateForm.id ? 'Edit Gate Details' : 'Add New Gate')}
            {panelType === 'purposes' && (purposeForm.id ? 'Edit Purpose Details' : 'Add New Purpose')}
            {panelType === 'users' && (userForm.id ? 'Edit User Details' : 'Add New Sub-User')}
          </h3>

          {/* 1. UNITS FORM */}
          {panelType === 'units' && (
            <form onSubmit={handleUnitSubmit}>
              <div className="form-group">
                <label className="form-label">Unit Name *</label>
                <input type="text" className="input" placeholder="e.g. Pune Corporate Office" required value={unitForm.name} onChange={e => setUnitForm(prev => ({ ...prev, name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <textarea className="input" rows="3" placeholder="Full postal address" value={unitForm.address} onChange={e => setUnitForm(prev => ({ ...prev, address: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn btn-primary">{unitForm.id ? 'Update' : 'Create Unit'}</button>
                {unitForm.id && <button type="button" className="btn btn-secondary" onClick={() => setUnitForm({ id: null, name: '', address: '' })}>Cancel</button>}
              </div>
            </form>
          )}

          {/* 2. DEPARTMENTS FORM */}
          {panelType === 'departments' && (
            <form onSubmit={handleDeptSubmit}>
              <div className="form-group">
                <label className="form-label">Department Name *</label>
                <input type="text" className="input" placeholder="e.g. Finance & Audits" required value={deptForm.name} onChange={e => setDeptForm(prev => ({ ...prev, name: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn btn-primary">{deptForm.id ? 'Update' : 'Create Dept'}</button>
                {deptForm.id && <button type="button" className="btn btn-secondary" onClick={() => setDeptForm({ id: null, name: '' })}>Cancel</button>}
              </div>
            </form>
          )}

          {/* 3. EMPLOYEES FORM */}
          {panelType === 'employees' && (
            <form onSubmit={handleEmpSubmit}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input type="text" className="input" placeholder="e.g. Richard Hendricks" required value={empForm.name} onChange={e => setEmpForm(prev => ({ ...prev, name: e.target.value }))} />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" className="input" placeholder="richard@hooli.com" value={empForm.email} onChange={e => setEmpForm(prev => ({ ...prev, email: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input type="tel" className="input" placeholder="e.g. 9876543210" value={empForm.phone} onChange={e => setEmpForm(prev => ({ ...prev, phone: e.target.value }))} />
                </div>
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Unit/Branch Location</label>
                  <select className="input select" value={empForm.unit_id} onChange={e => setEmpForm(prev => ({ ...prev, unit_id: e.target.value }))}>
                    <option value="">Select Location</option>
                    {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select className="input select" value={empForm.department_id} onChange={e => setEmpForm(prev => ({ ...prev, department_id: e.target.value }))}>
                    <option value="">Select Dept</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn btn-primary">{empForm.id ? 'Update' : 'Register Employee'}</button>
                {empForm.id && <button type="button" className="btn btn-secondary" onClick={() => setEmpForm({ id: null, name: '', email: '', phone: '', department_id: '', unit_id: '' })}>Cancel</button>}
              </div>
            </form>
          )}

          {/* 4. GATES FORM */}
          {panelType === 'gates' && (
            <form onSubmit={handleGateSubmit}>
              <div className="form-group">
                <label className="form-label">Gate / Entry Point Name *</label>
                <input type="text" className="input" placeholder="e.g. Back Loading Bay" required value={gateForm.name} onChange={e => setGateForm(prev => ({ ...prev, name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Associated Unit/Branch *</label>
                <select className="input select" required value={gateForm.unit_id} onChange={e => setGateForm(prev => ({ ...prev, unit_id: e.target.value }))}>
                  <option value="">Select Branch</option>
                  {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn btn-primary">{gateForm.id ? 'Update' : 'Add Entrance'}</button>
                {gateForm.id && <button type="button" className="btn btn-secondary" onClick={() => setGateForm({ id: null, name: '', unit_id: '' })}>Cancel</button>}
              </div>
            </form>
          )}

          {/* 5. PURPOSES FORM */}
          {panelType === 'purposes' && (
            <form onSubmit={handlePurposeSubmit}>
              <div className="form-group">
                <label className="form-label">Purpose Label *</label>
                <input type="text" className="input" placeholder="e.g. Vendor Delivery" required value={purposeForm.name} onChange={e => setPurposeForm(prev => ({ ...prev, name: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn btn-primary">{purposeForm.id ? 'Update' : 'Create Purpose'}</button>
                {purposeForm.id && <button type="button" className="btn btn-secondary" onClick={() => setPurposeForm({ id: null, name: '' })}>Cancel</button>}
              </div>
            </form>
          )}

          {/* 6. SUB-USERS FORM */}
          {panelType === 'users' && (
            <form onSubmit={handleUserSubmit}>
              <div className="form-group">
                <label className="form-label">Username *</label>
                <input type="text" className="input" placeholder="e.g. receptionist1" required value={userForm.username} onChange={e => setUserForm(prev => ({ ...prev, username: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Password {userForm.id ? '(Leave blank to keep same)' : '*'}</label>
                <input type="password" className="input" placeholder="Enter secure password" value={userForm.password || ''} onChange={e => setUserForm(prev => ({ ...prev, password: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">System Role *</label>
                <select className="input select" required value={userForm.role} onChange={e => setUserForm(prev => ({ ...prev, role: e.target.value }))}>
                  <option value="admin">Administrator</option>
                  <option value="security">Security Officer</option>
                  <option value="reception">Reception Clerk</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn btn-primary">{userForm.id ? 'Update' : 'Create Account'}</button>
                {userForm.id && <button type="button" className="btn btn-secondary" onClick={() => setUserForm({ id: null, username: '', password: '', role: 'admin' })}>Cancel</button>}
              </div>
            </form>
          )}

        </div>

        {/* RIGHT COLUMN: LIST PANELS */}
        <div className="glass">
          <h3 style={{ color: 'var(--lime)', marginBottom: '20px', fontSize: '18px', fontWeight: 700 }}>
            Registered Master Logs ({
              panelType === 'units' ? units.length :
              panelType === 'departments' ? departments.length :
              panelType === 'employees' ? employees.length :
              panelType === 'gates' ? gates.length :
              panelType === 'purposes' ? purposes.length : users.length
            })
          </h3>

          {loading ? (
            <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Loading logs...</p>
          ) : (
            <div className="table-container" style={{ maxHeight: '420px', overflowY: 'auto' }}>
              <table className="table">
                <thead>
                  {panelType === 'units' && (
                    <tr>
                      <th>Name</th>
                      <th>Address</th>
                      <th style={{ width: '100px', textAlign: 'center' }}>Action</th>
                    </tr>
                  )}
                  {panelType === 'departments' && (
                    <tr>
                      <th>Name</th>
                      <th style={{ width: '100px', textAlign: 'center' }}>Action</th>
                    </tr>
                  )}
                  {panelType === 'employees' && (
                    <tr>
                      <th>Employee Details</th>
                      <th>Host Branch</th>
                      <th style={{ width: '100px', textAlign: 'center' }}>Action</th>
                    </tr>
                  )}
                  {panelType === 'gates' && (
                    <tr>
                      <th>Gate Point</th>
                      <th>Branch Unit</th>
                      <th style={{ width: '100px', textAlign: 'center' }}>Action</th>
                    </tr>
                  )}
                  {panelType === 'purposes' && (
                    <tr>
                      <th>Label</th>
                      <th style={{ width: '100px', textAlign: 'center' }}>Action</th>
                    </tr>
                  )}
                  {panelType === 'users' && (
                    <tr>
                      <th>Username</th>
                      <th>Role</th>
                      <th style={{ width: '100px', textAlign: 'center' }}>Action</th>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {/* 1. UNITS LIST */}
                  {panelType === 'units' && units.map(u => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 600 }}>{u.name}</td>
                      <td style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>{u.address || '-'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                          <button style={{ color: 'var(--lime)', background: 'transparent', border: 'none', cursor: 'pointer' }} onClick={() => setUnitForm(u)} title="Edit">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"></path>
                            </svg>
                          </button>
                          <button style={{ color: 'var(--red)', background: 'transparent', border: 'none', cursor: 'pointer' }} onClick={() => handleUnitDelete(u.id)} title="Delete">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              <line x1="10" y1="11" x2="10" y2="17"></line>
                              <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {/* 2. DEPARTMENTS LIST */}
                  {panelType === 'departments' && departments.map(d => (
                    <tr key={d.id}>
                      <td style={{ fontWeight: 600 }}>{d.name}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                          <button style={{ color: 'var(--lime)', background: 'transparent', border: 'none', cursor: 'pointer' }} onClick={() => setDeptForm(d)} title="Edit">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"></path>
                            </svg>
                          </button>
                          <button style={{ color: 'var(--red)', background: 'transparent', border: 'none', cursor: 'pointer' }} onClick={() => handleDeptDelete(d.id)} title="Delete">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              <line x1="10" y1="11" x2="10" y2="17"></line>
                              <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {/* 3. EMPLOYEES LIST */}
                  {panelType === 'employees' && employees.map(e => (
                    <tr key={e.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{e.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>💻 {e.department_name || 'No Dept'}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>📞 {e.phone || '-'} | {e.email || '-'}</div>
                      </td>
                      <td style={{ fontSize: '13.5px', fontWeight: 500 }}>{e.unit_name || '-'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                          <button style={{ color: 'var(--lime)', background: 'transparent', border: 'none', cursor: 'pointer' }} onClick={() => setEmpForm({ ...e, department_id: e.department_id || '', unit_id: e.unit_id || '' })} title="Edit">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"></path>
                            </svg>
                          </button>
                          <button style={{ color: 'var(--red)', background: 'transparent', border: 'none', cursor: 'pointer' }} onClick={() => handleEmpDelete(e.id)} title="Delete">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              <line x1="10" y1="11" x2="10" y2="17"></line>
                              <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {/* 4. GATES LIST */}
                  {panelType === 'gates' && gates.map(g => (
                    <tr key={g.id}>
                      <td style={{ fontWeight: 600 }}>{g.name}</td>
                      <td style={{ fontSize: '13.5px', fontWeight: 500 }}>{g.unit_name}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                          <button style={{ color: 'var(--lime)', background: 'transparent', border: 'none', cursor: 'pointer' }} onClick={() => setGateForm({ id: g.id, name: g.name, unit_id: g.unit_id })} title="Edit">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"></path>
                            </svg>
                          </button>
                          <button style={{ color: 'var(--red)', background: 'transparent', border: 'none', cursor: 'pointer' }} onClick={() => handleGateDelete(g.id)} title="Delete">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              <line x1="10" y1="11" x2="10" y2="17"></line>
                              <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {/* 5. PURPOSES LIST */}
                  {panelType === 'purposes' && purposes.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                          <button style={{ color: 'var(--lime)', background: 'transparent', border: 'none', cursor: 'pointer' }} onClick={() => setPurposeForm(p)} title="Edit">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"></path>
                            </svg>
                          </button>
                          <button style={{ color: 'var(--red)', background: 'transparent', border: 'none', cursor: 'pointer' }} onClick={() => handlePurposeDelete(p.id)} title="Delete">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              <line x1="10" y1="11" x2="10" y2="17"></line>
                              <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {/* 6. SUB-USERS LIST */}
                  {panelType === 'users' && users.map(usr => (
                    <tr key={usr.id}>
                      <td style={{ fontWeight: 700 }}>{usr.username}</td>
                      <td>
                        <span style={{ 
                          fontSize: '11px', textTransform: 'uppercase', fontWeight: 800,
                          color: usr.role === 'admin' ? 'var(--orange)' : usr.role === 'security' ? 'var(--lime)' : 'var(--blue)',
                          background: usr.role === 'admin' ? 'var(--orange-glow)' : usr.role === 'security' ? 'var(--lime-glow)' : 'rgba(2,132,199,0.12)',
                          padding: '4px 8px', borderRadius: '4px'
                        }}>
                          {usr.role}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                          <button style={{ color: 'var(--lime)', background: 'transparent', border: 'none', cursor: 'pointer' }} onClick={() => setUserForm({ id: usr.id, username: usr.username, role: usr.role, password: '' })} title="Edit">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"></path>
                            </svg>
                          </button>
                          <button style={{ color: 'var(--red)', background: 'transparent', border: 'none', cursor: 'pointer' }} onClick={() => handleUserDelete(usr.id)} title="Delete">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              <line x1="10" y1="11" x2="10" y2="17"></line>
                              <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
