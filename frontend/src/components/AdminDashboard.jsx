import React, { useState, useEffect, useRef } from 'react';
import VisitorDetails from './VisitorDetails';

export default function AdminDashboard({ backendUrl = '', onSelectPass }) {
  const [visits, setVisits] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [liveAlert, setLiveAlert] = useState(null);
  const [selectedVisit, setSelectedVisit] = useState(null);

  const socketRef = useRef(null);

  const playAlertSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      gain1.gain.setValueAtTime(0.08, audioCtx.currentTime);
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.15); // E5
      gain2.gain.setValueAtTime(0.08, audioCtx.currentTime + 0.15);
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);

      osc1.start();
      gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
      osc1.stop(audioCtx.currentTime + 0.6);

      osc2.start(audioCtx.currentTime + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.75);
      osc2.stop(audioCtx.currentTime + 0.75);
    } catch (e) {
      console.log('Audio Context blocked by browser policies:', e);
    }
  };

  const fetchVisits = async () => {
    try {
      const visitsRes = await fetch(`${backendUrl}/api/visitors/visits`, { credentials: 'include' });
      const visitsData = await visitsRes.json();
      if (visitsData.success) {
        setVisits(visitsData.data);
      } else {
        setError(visitsData.message || 'Failed to fetch logs.');
      }
    } catch (err) {
      console.error(err);
      setError('Could not sync visitor logs from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisits();

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socketAddress = backendUrl 
      ? backendUrl.replace(/^http/, 'ws') 
      : `${protocol}//${window.location.host}`;

    const connectWebSocket = () => {
      console.log('Connecting to WS:', socketAddress);
      const ws = new WebSocket(socketAddress);
      socketRef.current = ws;

      ws.onmessage = (message) => {
        try {
          const { event, data } = JSON.parse(message.data);
          
          if (event === 'new_visitor_request') {
            playAlertSound();
            setLiveAlert(data);
            setVisits(prev => [data, ...prev]);
            
            setTimeout(() => {
              setLiveAlert(curr => curr?.id === data.id ? null : curr);
            }, 8000);
          }

          if (event === 'visit_updated') {
            fetchVisits();
          }
        } catch (err) {
          console.error('Error parsing WS message:', err);
        }
      };

      ws.onclose = () => {
        console.log('WS Connection closed. Reconnecting in 5s...');
        setTimeout(connectWebSocket, 5000);
      };

      ws.onerror = (err) => {
        console.error('WS Error:', err);
        ws.close();
      };
    };

    connectWebSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [backendUrl]);

  const filteredVisits = visits.filter(v => {
    const term = searchTerm.toLowerCase();
    const nameMatch = v.visitor_name?.toLowerCase().includes(term);
    const mobileMatch = v.visitor_mobile?.includes(term);
    const companyMatch = v.visitor_company?.toLowerCase().includes(term);
    const hostMatch = v.employee_name?.toLowerCase().includes(term);
    const statusMatch = v.status?.toLowerCase().includes(term);

    const matchesSearch = nameMatch || mobileMatch || companyMatch || hostMatch || statusMatch;
    const matchesStatus = statusFilter ? v.status === statusFilter : true;

    return matchesSearch && matchesStatus;
  });

  const handleCheckOutDirect = async (visitId) => {
    try {
      const res = await fetch(`${backendUrl}/api/visitors/visits/${visitId}/checkout`, {
        method: 'PUT',
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        fetchVisits();
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
      alert('Error recording checkout.');
    }
  };
  const exportToCSV = () => {
    if (filteredVisits.length === 0) {
      alert("No data available to export.");
      return;
    }
    const headers = ["Visitor No.", "Unit", "Department", "Purpose", "Meeting Person", "Visitor Name", "Mobile", "Email", "In Time", "Out Time", "Status"];
    const rows = filteredVisits.map(v => [
      v.id,
      v.unit_name,
      v.department_name,
      v.purpose_name,
      v.employee_name || '-',
      v.visitor_name,
      v.visitor_mobile,
      v.visitor_email || '-',
      v.in_time ? new Date(v.in_time).toLocaleString() : '-',
      v.out_time ? new Date(v.out_time).toLocaleString() : '-',
      v.status
    ]);

    const csvContent = [headers, ...rows]
      .map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Nysa_Biomed_Visitor_Logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    if (filteredVisits.length === 0) {
      alert("No data available to export.");
      return;
    }
    const printWindow = window.open('', '_blank');
    const tableHTML = `
      <html>
        <head>
          <title>Nysa Biomed Pvt Ltd - Visitor Log Report</title>
          <style>
            body { font-family: 'Plus Jakarta Sans', sans-serif; padding: 30px; color: #0f172a; }
            h2 { margin-bottom: 5px; color: #e05000; font-weight: 800; }
            p { font-size: 13px; color: #64748b; margin-top: 0; margin-bottom: 25px; font-weight: 500; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 1px solid #cbd5e1; padding: 10px 12px; text-align: left; font-size: 12px; }
            th { background-color: #f1f5f9; font-weight: 800; color: #334155; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .badge { font-weight: 800; padding: 4px 8px; border-radius: 99px; font-size: 10px; display: inline-block; text-transform: uppercase; }
            .badge-approved { background-color: #f0f7e0; color: #6ea800; }
            .badge-pending { background-color: #fff3ee; color: #e05000; }
            .badge-completed { background-color: #e0f2fe; color: #0369a1; }
            .badge-rejected { background-color: #fee2e2; color: #dc2626; }
          </style>
        </head>
        <body>
          <h2>Nysa Biomed Pvt Ltd</h2>
          <p>Visitor Desk Logs Report — Generated on ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr>
                <th>No.</th>
                <th>Unit</th>
                <th>Department</th>
                <th>Purpose</th>
                <th>Host Employee</th>
                <th>Visitor Name</th>
                <th>Mobile</th>
                <th>In Date/Time</th>
                <th>Out Date/Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${filteredVisits.map(v => `
                <tr>
                  <td><strong>VMS-${v.id}</strong></td>
                  <td>${v.unit_name}</td>
                  <td>${v.department_name}</td>
                  <td>${v.purpose_name}</td>
                  <td>${v.employee_name || '-'}</td>
                  <td>${v.visitor_name}</td>
                  <td>${v.visitor_mobile}</td>
                  <td>${v.in_time ? new Date(v.in_time).toLocaleString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                  <td>${v.out_time ? new Date(v.out_time).toLocaleString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                  <td>
                    <span class="badge badge-${v.status.toLowerCase()}">${v.status}</span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(tableHTML);
    printWindow.document.close();
  };

  const getFormatTime = (isoString) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getFormatDate = (isoString) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleDateString([], { day: '2-digit', month: 'short' });
  };

  return (
    <div style={{ padding: '10px 0' }}>
      
      {/* 🔔 Real-time Popup Banner */}
      {liveAlert && (
        <div 
          className="glass" 
          style={{ 
            position: 'fixed', top: '20px', right: '20px', zIndex: 1100, 
            background: 'var(--orange)', border: '1.5px solid rgba(15,23,42,0.15)',
            color: 'white', maxWidth: '400px', width: '90%', padding: '16px',
            borderRadius: 'var(--radius-md)'
          }}
        >
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <div style={{ width: '50px', height: '50px', borderRadius: '50px', overflow: 'hidden', background: '#000', border: '2px solid white' }}>
              <img src={liveAlert.photo || 'https://via.placeholder.com/50'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
            </div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <h4 style={{ margin: 0, fontWeight: 800, fontSize: '15px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                New Entry Request
              </h4>
              <p style={{ margin: '4px 0 0', fontSize: '13.5px', opacity: 0.95, fontWeight: 500 }}>
                <strong>{liveAlert.visitor_name}</strong> wants to meet {liveAlert.employee_name} ({liveAlert.department_name}).
              </p>
            </div>
            <button 
              style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer', fontWeight: 'bold' }}
              onClick={() => setLiveAlert(null)}
            >
              ×
            </button>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px', justifyContent: 'flex-end' }}>
            <button className="btn btn-sm btn-primary" style={{ background: '#fff', color: '#000' }} onClick={() => { setSelectedVisit(liveAlert); setLiveAlert(null); }}>
              View Details
            </button>
            <button className="btn btn-sm btn-secondary" style={{ background: 'rgba(0,0,0,0.2)', color: 'white', border: 'none' }} onClick={() => setLiveAlert(null)}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Visitor Desk Table Section */}
      <div className="glass">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '20px' }}>
          <div style={{ textAlign: 'left' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>Visitor Desk Log</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginTop: '4px', fontWeight: 500 }}>Manage check-ins, approve registrations, and issue active building gate passes.</p>
          </div>
          
          <div style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '600px', flexWrap: 'wrap' }}>
            <input 
              type="text" className="input" style={{ flex: 1, padding: '10px 14px', fontSize: '14px', minWidth: '150px' }}
              placeholder="Search by Visitor Name, Mobile, Host..." 
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)} 
            />

            <select 
              className="input select" style={{ width: '160px', padding: '10px 14px', fontSize: '14px' }}
              value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved (Inside)</option>
              <option value="Completed">Completed (Checked-Out)</option>
              <option value="Rejected">Rejected</option>
            </select>
            
            <button className="btn btn-secondary btn-sm" onClick={fetchVisits} title="Refresh Logs">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
              </svg>
            </button>

            <button 
              className="btn btn-secondary btn-sm" 
              onClick={exportToCSV} 
              title="Export to Excel"
              style={{ background: 'rgba(110,168,0,0.1)', color: '#6ea800', border: '1px solid rgba(110,168,0,0.15)', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 700 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              Excel
            </button>

            <button 
              className="btn btn-secondary btn-sm" 
              onClick={exportToPDF} 
              title="Export to PDF"
              style={{ background: 'rgba(224,80,0,0.1)', color: '#e05000', border: '1px solid rgba(224,80,0,0.15)', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 700 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              PDF
            </button>
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(220, 38, 38, 0.08)', color: 'var(--red)', border: '1px solid rgba(220, 38, 38, 0.2)', borderRadius: 'var(--radius-sm)', padding: '10px', marginBottom: '15px', fontSize: '13.5px' }}>
            ⚠️ {error}
          </div>
        )}

        {loading ? (
          <p style={{ color: 'var(--text-secondary)', padding: '40px 0', fontWeight: 500 }}>Syncing desk logs from database...</p>
        ) : filteredVisits.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', padding: '40px 0', fontWeight: 500 }}>No visitor records found.</p>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Visitor No.</th>
                  <th>Unit</th>
                  <th>Department</th>
                  <th>Purpose</th>
                  <th>Meeting Person</th>
                  <th>Visitor Name</th>
                  <th>In DateTime</th>
                  <th>Out DateTime</th>
                  <th>Status</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredVisits.map((v) => (
                  <tr key={v.id}>
                    {/* Visitor ID */}
                    <td style={{ fontWeight: 'bold' }}>{v.id}</td>

                    {/* Unit */}
                    <td style={{ fontWeight: 500 }}>{v.unit_name}</td>

                    {/* Dept */}
                    <td style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>{v.department_name}</td>

                    {/* Purpose */}
                    <td style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>{v.purpose_name}</td>

                    {/* Host */}
                    <td style={{ fontWeight: 600 }}>{v.employee_name || '-'}</td>

                    {/* Visitor Name */}
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{v.visitor_name}</td>

                    {/* In DateTime */}
                    <td style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                      {v.in_time ? `${getFormatDate(v.in_time)} ${getFormatTime(v.in_time)}` : '-'}
                    </td>

                    {/* Out DateTime */}
                    <td style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                      {v.out_time ? (
                        `${getFormatDate(v.out_time)} ${getFormatTime(v.out_time)}`
                      ) : v.status.toLowerCase() === 'approved' ? (
                        <button
                          className="btn btn-primary btn-sm"
                          style={{
                            padding: '4px 10px',
                            fontSize: '11px',
                            fontWeight: 700,
                            borderRadius: '999px',
                            background: 'var(--orange)',
                            color: '#fff',
                            border: 'none',
                            cursor: 'pointer',
                            boxShadow: '0 2px 6px rgba(224,80,0,0.25)',
                            transition: 'all 0.15s ease'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCheckOutDirect(v.id);
                          }}
                        >
                          Check Out
                        </button>
                      ) : (
                        '-'
                      )}
                    </td>

                    {/* Status Badge */}
                    <td>
                      <span className={`badge badge-${v.status.toLowerCase()}`}>
                        {v.status}
                      </span>
                    </td>

                    {/* Action trigger to details modal */}
                    <td style={{ textAlign: 'center' }}>
                      <button className="btn btn-secondary btn-sm" style={{ padding: '6px 12px' }} onClick={() => setSelectedVisit(v)}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Render detailed view modal dialog when selected */}
      {selectedVisit && (
        <VisitorDetails 
          visit={selectedVisit} 
          onClose={() => setSelectedVisit(null)} 
          onRefresh={fetchVisits} 
          backendUrl={backendUrl}
        />
      )}
    </div>
  );
}
