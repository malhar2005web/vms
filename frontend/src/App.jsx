import React, { useState, useEffect } from 'react';
import VisitorForm from './components/VisitorForm';
import AdminDashboard from './components/AdminDashboard';
import MasterSettings from './components/MasterSettings';
import VisitorPass from './components/VisitorPass';

// New Sidebar & Layout Component imports
import AdminSidebar from './components/AdminSidebar';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import EmergencyDesk from './components/EmergencyDesk';
import StaffList from './components/StaffList';

const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://localhost:5000' 
  : '/_/backend';

export default function App() {
  const [view, setView] = useState('registration'); // 'registration', 'login', 'admin'
  const [adminView, setAdminView] = useState('dashboard'); // 'dashboard', 'visitor_desk', 'employees', 'units', ...
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Login form fields
  const [loginCreds, setLoginCreds] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Selected Pass for modal print
  const [selectedPass, setSelectedPass] = useState(null);

  // Check auth session on mount
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/auth/me`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUser(data.user);
          setView('admin');
        }
      })
      .catch(err => console.error('Session verify failed:', err))
      .finally(() => setCheckingAuth(false));
  }, []);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginCreds),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        setView('admin');
        setLoginCreds({ username: '', password: '' });
      } else {
        setLoginError(data.message || 'Login failed. Please check credentials.');
      }
    } catch (err) {
      console.error(err);
      setLoginError('Server connection error during login.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${BACKEND_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' });
      setUser(null);
      setView('registration');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  // ==========================================
  // RENDER VIEW A: SECURE ADMIN WORKSPACE
  // ==========================================
  if (view === 'admin' && user) {
    return (
      <div className="admin-layout">
        
        {/* Left Side Navigation Panel */}
        <AdminSidebar 
          activeView={adminView} 
          onViewChange={setAdminView} 
          user={user} 
          onLogout={handleLogout} 
        />

        {/* Right Main Content Panel */}
        <main className="admin-main">
          
          {/* Quick links header */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '18px' }}>
            <button 
              onClick={() => setView('registration')}
              style={{ padding: '9px 18px', fontSize: '13px', fontWeight: 700, background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.8)', borderRadius: '999px', color: '#0f172a', cursor: 'pointer', boxShadow: '0 2px 8px rgba(15,23,42,0.06)', display: 'flex', alignItems: 'center', gap: '7px' }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              Open Public Form Page
            </button>
          </div>

          {adminView === 'dashboard' && (
            <AnalyticsDashboard backendUrl={BACKEND_URL} />
          )}

          {adminView === 'visitor_desk' && (
            <AdminDashboard 
              backendUrl={BACKEND_URL} 
              onSelectPass={(pass) => setSelectedPass(pass)} 
            />
          )}

          {/* Dynamic master modules */}
          {adminView === 'employees' && (
            <MasterSettings backendUrl={BACKEND_URL} panelType="employees" />
          )}

          {adminView === 'units' && (
            <MasterSettings backendUrl={BACKEND_URL} panelType="units" />
          )}

          {adminView === 'departments' && (
            <MasterSettings backendUrl={BACKEND_URL} panelType="departments" />
          )}

          {adminView === 'purposes' && (
            <MasterSettings backendUrl={BACKEND_URL} panelType="purposes" />
          )}

          {adminView === 'gates' && (
            <MasterSettings backendUrl={BACKEND_URL} panelType="gates" />
          )}

          {adminView === 'users' && (
            <MasterSettings backendUrl={BACKEND_URL} panelType="users" />
          )}

          {/* Directory listings */}
          {adminView === 'staff_list' && (
            <StaffList backendUrl={BACKEND_URL} />
          )}

          {adminView === 'emergency' && (
            <EmergencyDesk backendUrl={BACKEND_URL} />
          )}

        </main>

        {/* Selected Pass for modal print */}
        {selectedPass && (
          <VisitorPass visit={selectedPass} onClose={() => setSelectedPass(null)} />
        )}

      </div>
    );
  }

  // ==========================================
  // RENDER VIEW B: PUBLIC FORM / ACCESS DESK
  // ==========================================
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      
      {/* HEADER Nav */}
      <header 
        className="glass" 
        style={{ 
          margin: '20px', padding: '16px 30px', display: 'flex', justifyContent: 'space-between', 
          alignItems: 'center', borderRadius: 'var(--radius-md)' 
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => setView(user ? 'admin' : 'registration')}>
          <div style={{ color: 'var(--orange)', display: 'flex', alignItems: 'center' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <div style={{ textAlign: 'left' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 800, margin: 0, letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>VeriPass</h1>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>Gate Security</span>
          </div>
        </div>

        {/* Dynamic Nav Items */}
        <nav style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {user ? (
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => setView('admin')}>
                Return to Admin Desk
              </button>
              <button className="btn btn-danger btn-sm" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <button 
                className={`btn btn-secondary btn-sm ${view === 'registration' ? 'active' : ''}`}
                onClick={() => setView('registration')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="8.5" cy="7" r="4"></circle>
                  <line x1="20" y1="8" x2="20" y2="14"></line>
                  <line x1="23" y1="11" x2="17" y2="11"></line>
                </svg>
                Visitor Check-In
              </button>
              <button 
                className={`btn btn-primary btn-sm ${view === 'login' ? 'active' : ''}`}
                onClick={() => setView('login')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
                  <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
                </svg>
                Security Desk Login
              </button>
            </>
          )}
        </nav>
      </header>

      {/* MAIN CONTAINER */}
      <main style={{ flex: 1, padding: '0 20px 40px', maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
        
        {checkingAuth ? (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '100px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1.5s linear infinite' }}>
              <line x1="12" y1="2" x2="12" y2="6"></line>
              <line x1="12" y1="18" x2="12" y2="22"></line>
              <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
              <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
              <line x1="2" y1="12" x2="6" y2="12"></line>
              <line x1="18" y1="12" x2="22" y2="12"></line>
              <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
              <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
            </svg>
            <p>Verifying gateway security certificates...</p>
          </div>
        ) : (
          <>
            {/* VIEW 1: PUBLIC REGISTRATION FORM */}
            {view === 'registration' && (
              <VisitorForm backendUrl={BACKEND_URL} onComplete={() => setView('registration')} />
            )}

            {/* VIEW 2: SECURITY OFFICE LOGIN */}
            {view === 'login' && (
              <div className="glass" style={{ maxWidth: '400px', margin: '60px auto', padding: '30px' }}>
                <div style={{ textAlign: 'center', marginBottom: '25px' }}>
                  <div style={{ color: 'var(--orange)', display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                  </div>
                  <h2 style={{ fontSize: '22px', color: 'var(--text-primary)' }}>Security Desk Login</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginTop: '6px' }}>Access administration dashboard and visitor desk logs.</p>
                </div>

                {loginError && (
                  <div style={{ background: 'rgba(220, 38, 38, 0.08)', color: 'var(--red)', border: '1px solid rgba(220, 38, 38, 0.2)', borderRadius: 'var(--radius-sm)', padding: '10px', marginBottom: '15px', fontSize: '13.5px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                      <line x1="12" y1="9" x2="12" y2="13"></line>
                      <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                    {loginError}
                  </div>
                )}

                <form onSubmit={handleLoginSubmit}>
                  <div className="form-group">
                    <label className="form-label">Username</label>
                    <input 
                      type="text" className="input" placeholder="e.g. admin" required
                      value={loginCreds.username} onChange={e => setLoginCreds(prev => ({ ...prev, username: e.target.value }))} 
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Security Password</label>
                    <input 
                      type="password" className="input" placeholder="••••••••" required
                      value={loginCreds.password} onChange={e => setLoginCreds(prev => ({ ...prev, password: e.target.value }))} 
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }} disabled={loginLoading}>
                    {loginLoading ? 'Authenticating Desk...' : 'Secure Login'}
                  </button>
                </form>
              </div>
            )}
          </>
        )}

      </main>

      {/* Selected Pass for modal print */}
      {selectedPass && (
        <VisitorPass visit={selectedPass} onClose={() => setSelectedPass(null)} />
      )}

      {/* PREMIUM FOOTER */}
      <footer style={{ borderTop: '1px solid var(--glass-border)', padding: '24px 20px', textAlign: 'center', background: 'rgba(255, 255, 255, 0.4)' }}>
        <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', fontWeight: 500 }}>
          © 2026 VeriPass Gate Security Systems. All local database structures verified.
        </p>
      </footer>

      {/* CSS Spin Animation Helper */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

    </div>
  );
}
