import React, { useState } from 'react';
import NdaTerms from './NdaTerms';

export default function VisitorDetails({ visit, onClose, onRefresh, backendUrl = '' }) {
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState(visit.notes || '');
  const [loading, setLoading] = useState(false);

  if (!visit) return null;

  const handleApprove = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/visitors/visits/${visit.id}/approve`, {
        method: 'PUT',
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        onRefresh();
        onClose();
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
      alert('Error approving check-in.');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!window.confirm('Are you sure you want to reject this request?')) return;
    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/visitors/visits/${visit.id}/reject`, {
        method: 'PUT',
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        onRefresh();
        onClose();
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
      alert('Error rejecting visitor pass.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/visitors/visits/${visit.id}/checkout`, {
        method: 'PUT',
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        onRefresh();
        onClose();
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
      alert('Error recording checkout.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/visitors/visits/${visit.id}/notes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: notesText }),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        visit.notes = notesText;
        setEditingNotes(false);
        onRefresh();
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
      alert('Error saving notes.');
    }
  };

  const handlePrintPass = () => {
    // Add print style block for Pass Card
    const style = document.createElement('style');
    style.id = 'vms-pass-print-style';
    style.innerHTML = `
      @media print {
        body * {
          visibility: hidden !important;
        }
        #pass-card-print, #pass-card-print * {
          visibility: visible !important;
        }
        #pass-card-print {
          position: absolute !important;
          left: 50% !important;
          top: 15% !important;
          transform: translateX(-50%) !important;
          width: 14cm !important;
          box-shadow: none !important;
          border: 3px solid #000 !important;
          background: #fff !important;
          color: #000 !important;
        }
      }
    `;
    document.head.appendChild(style);
    window.print();
    
    // Clean up
    setTimeout(() => {
      const el = document.getElementById('vms-pass-print-style');
      if (el) el.remove();
    }, 1000);
  };

  const handlePrintNDA = () => {
    // Add print style block for NDA Sheet
    const style = document.createElement('style');
    style.id = 'vms-nda-print-style';
    style.innerHTML = `
      @media print {
        body * {
          visibility: hidden !important;
        }
        #nda-sheet-print, #nda-sheet-print * {
          visibility: visible !important;
        }
        #nda-sheet-print {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          border: none !important;
          background: #fff !important;
          color: #000 !important;
          display: block !important;
        }
      }
    `;
    document.head.appendChild(style);
    window.print();
    
    // Clean up
    setTimeout(() => {
      const el = document.getElementById('vms-nda-print-style');
      if (el) el.remove();
    }, 1000);
  };

  // WhatsApp Integration APIs
  const handleShareToStaff = () => {
    const message = `*Visitor Arrival Alert*%0AHello, visitor *${visit.visitor_name}* from *${visit.visitor_company || 'N/A'}* has arrived at the gate to meet you for *${visit.purpose_name}*.%0AUnit: ${visit.unit_name}%0APass ID: VMS-${visit.id}%0AStatus: ${visit.status}`;
    const phone = visit.employee_phone || '';
    window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${message}`, '_blank');
  };

  const handleShareToVisitor = () => {
    const message = `*VeriPass Gate Pass*%0AHello *${visit.visitor_name}*, your entry pass for *${visit.unit_name}* has been processed.%0APass ID: VMS-${visit.id}%0AStatus: ${visit.status}%0AType: QR-Verified Entry`;
    const phone = visit.visitor_mobile || '';
    window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${message}`, '_blank');
  };

  // Email share handlers
  const handleEmailToStaff = () => {
    const subject = encodeURIComponent(`Visitor Arrival: ${visit.visitor_name} — VMS-${visit.id}`);
    const body = encodeURIComponent(
      `Hello,\n\nVisitor ${visit.visitor_name} from ${visit.visitor_company || 'N/A'} has arrived at the gate to meet you.\n\nPurpose: ${visit.purpose_name}\nUnit: ${visit.unit_name}\nPass ID: VMS-${visit.id}\nStatus: ${visit.status}\n\n— VeriPass Visitor Management System`
    );
    const email = visit.employee_email || '';
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
  };

  const handleEmailToVisitor = () => {
    const subject = encodeURIComponent(`Your VeriPass Gate Pass — VMS-${visit.id}`);
    const body = encodeURIComponent(
      `Hello ${visit.visitor_name},\n\nYour visitor gate pass has been processed.\n\nPass ID: VMS-${visit.id}\nHost: ${visit.employee_name} (${visit.department_name})\nUnit: ${visit.unit_name}\nStatus: ${visit.status}\nCheck-In: ${getFormatTime(visit.in_time)}\n\nPlease carry this reference for re-entry.\n\n— VeriPass Visitor Management System`
    );
    const email = visit.visitor_email || '';
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
  };

  const getFormatDate = (isoString) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getFormatTime = (isoString) => {
    if (!isoString) return '-';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="modal-overlay">
      <div className="glass modal-content" style={{ maxWidth: '650px', background: '#ffffff', color: '#0f172a', border: '1.5px solid rgba(15,23,42,0.15)', padding: '28px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1.5px solid var(--glass-border)', paddingBottom: '12px' }}>
          <h3 style={{ color: 'var(--orange)', margin: 0, fontWeight: 800, fontSize: '18px' }}>
            Visitor Details Profile
          </h3>
          <button 
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '24px', cursor: 'pointer', fontWeight: 'bold' }}
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {/* 1. VISITOR PASS PRINT BLOCK */}
        <div id="pass-card-print" className="pass-card" style={{ background: '#ffffff', color: '#0f172a', border: '3px solid #0f172a', borderRadius: '10px', padding: '20px', textAlign: 'left', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '10px', marginBottom: '15px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0 }}>{visit.unit_name || 'Nysa Biomed Pvt Ltd'}</h2>
              <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Visitor Gate Pass</span>
            </div>
            <span style={{ 
              background: visit.status === 'Approved' ? 'var(--lime)' : visit.status === 'Pending' ? 'var(--orange)' : visit.status === 'Completed' ? 'var(--blue)' : 'var(--red)',
              color: '#fff', padding: '4px 10px', borderRadius: '50px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase'
            }}>
              {visit.status}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '20px' }}>
            {/* Snap & QR */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '120px' }}>
              <div style={{ width: '120px', height: '130px', border: '2px solid #0f172a', borderRadius: '6px', overflow: 'hidden', background: '#e2e8f0' }}>
                <img src={visit.photo || 'https://via.placeholder.com/120'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
              </div>
              <div style={{ textAlign: 'center', fontSize: '10px', fontWeight: 'bold', color: '#475569', border: '1px solid #cbd5e1', padding: '4px', background: 'white' }}>
                PASS ID: VMS-{visit.id}
              </div>
            </div>

            {/* Details mapping */}
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 15px', fontSize: '13px' }}>
              <div>
                <span style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Visitor Name</span>
                <strong style={{ fontSize: '15px', color: '#0f172a' }}>{visit.visitor_name}</strong>
              </div>
              <div>
                <span style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Company</span>
                <span style={{ fontWeight: 700 }}>{visit.visitor_company || '-'}</span>
              </div>
              <div>
                <span style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Mobile</span>
                <span style={{ fontWeight: 700 }}>{visit.visitor_mobile}</span>
              </div>
              <div>
                <span style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Email</span>
                <span style={{ fontWeight: 600 }}>{visit.visitor_email || '-'}</span>
              </div>
              <div>
                <span style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Host Person</span>
                <span style={{ fontWeight: 700 }}>{visit.employee_name} ({visit.department_name})</span>
              </div>
              <div>
                <span style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Purpose</span>
                <span style={{ fontWeight: 700 }}>{visit.purpose_name}</span>
              </div>
              <div>
                <span style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Check-In Time</span>
                <span style={{ fontWeight: 700, color: 'var(--lime)' }}>
                  {visit.in_time ? (
                    `${new Date(visit.in_time).toLocaleDateString([], { weekday: 'short', day: '2-digit', month: 'short' })} ${getFormatTime(visit.in_time)}`
                  ) : '-'}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Check-Out Time</span>
                <span style={{ fontWeight: 700, color: 'var(--blue)' }}>
                  {visit.out_time ? (
                    `${new Date(visit.out_time).toLocaleDateString([], { weekday: 'short', day: '2-digit', month: 'short' })} ${getFormatTime(visit.out_time)}`
                  ) : '-'}
                </span>
              </div>
              <div style={{ gridColumn: 'span 2', borderTop: '1px dashed #cbd5e1', paddingTop: '8px' }}>
                <span style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Carry Items / Security Notes</span>
                <span style={{ fontStyle: 'italic', fontWeight: 500 }}>{visit.notes || 'None logged.'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. NDA SHEET COMPONENT (Hidden by default, prints on handlePrintNDA) */}
        <div id="nda-sheet-print" style={{ display: 'none', padding: '40px', fontFamily: 'Outfit, sans-serif', color: '#0f172a', textAlign: 'left' }}>
          <div style={{ borderBottom: '3px double #0f172a', paddingBottom: '15px', marginBottom: '20px', textAlign: 'center' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 800, margin: 0 }}>NYSA BIOMED PVT LTD</h1>
            <h2 style={{ fontSize: '15px', letterSpacing: '1px', marginTop: '5px', textTransform: 'uppercase', fontWeight: 700 }}>Non-Disclosure Agreement (NDA) & Declarations</h2>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', fontSize: '13px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <div><strong>Visitor Name:</strong> {visit.visitor_name}</div>
              <div><strong>Representing:</strong> {visit.visitor_company || 'Personal'}</div>
              <div><strong>Mobile:</strong> {visit.visitor_mobile}</div>
              <div><strong>Host Employee:</strong> {visit.employee_name} ({visit.department_name})</div>
              <div><strong>Purpose:</strong> {visit.purpose_name}</div>
              <div><strong>Entry Date/Time:</strong> {getFormatDate(visit.created_at)} @ {getFormatTime(visit.in_time || visit.created_at)}</div>
            </div>
            <div style={{ width: '100px', height: '110px', border: '1.5px solid #000', overflow: 'hidden' }}>
              <img src={visit.photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
            </div>
          </div>

          <NdaTerms />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '40px' }}>
            <div>
              <div style={{ borderBottom: '1.5px solid #000', width: '150px', height: '35px' }} />
              <div style={{ fontSize: '11px', fontWeight: 'bold', marginTop: '5px' }}>Host Signatory Authority</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              {visit.signature ? (
                <img src={visit.signature} style={{ height: '40px', maxWidth: '120px', display: 'block', marginLeft: 'auto', filter: 'contrast(3)' }} alt="" />
              ) : (
                <div style={{ borderBottom: '1.5px solid #000', width: '150px', height: '35px' }} />
              )}
              <div style={{ fontSize: '11px', fontWeight: 'bold', marginTop: '5px' }}>Visitor Signature / Accepted</div>
            </div>
          </div>
        </div>

        {/* Action Controls — grouped by category */}
        <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '20px', marginTop: '4px' }}>

          {/* Row 1: Primary approval actions */}
          {(visit.status === 'Pending' || visit.status === 'Approved') && (
            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
              {visit.status === 'Pending' && (
                <>
                  <button
                    className="btn btn-success btn-sm"
                    style={{ flex: 1, borderRadius: '50px', fontWeight: 700 }}
                    onClick={handleApprove} disabled={loading}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    Approve & Check In
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    style={{ flex: 1, borderRadius: '50px', fontWeight: 700 }}
                    onClick={handleReject} disabled={loading}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    Reject
                  </button>
                </>
              )}
              {visit.status === 'Approved' && (
                <button
                  className="btn btn-orange btn-sm"
                  style={{ flex: 1, borderRadius: '50px', fontWeight: 700 }}
                  onClick={handleCheckOut} disabled={loading}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                  Check Out
                </button>
              )}
            </div>
          )}

          {/* Row 2: Document actions */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            <button className="btn btn-secondary btn-sm" style={{ flex: 1, borderRadius: '50px' }} onClick={handlePrintPass}>
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
              Print Pass
            </button>
            <button className="btn btn-secondary btn-sm" style={{ flex: 1, borderRadius: '50px' }} onClick={handlePrintNDA}>
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
              NDA Copy
            </button>
            <button className="btn btn-secondary btn-sm" style={{ flex: 1, borderRadius: '50px' }} onClick={() => setEditingNotes(!editingNotes)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              {editingNotes ? 'Close Notes' : 'Notes'}
            </button>
          </div>

          {/* Row 3: Share to Staff */}
          <div style={{ marginBottom: '10px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>Notify Host Staff</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-sm"
                style={{ flex: 1, borderRadius: '50px', background: '#25D366', color: '#fff', border: 'none', fontWeight: 700 }}
                onClick={handleShareToStaff}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                WhatsApp
              </button>
              <button
                className="btn btn-sm"
                style={{ flex: 1, borderRadius: '50px', background: 'var(--blue)', color: '#fff', border: 'none', fontWeight: 700 }}
                onClick={handleEmailToStaff}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                Email
              </button>
            </div>
          </div>

          {/* Row 4: Share to Visitor */}
          <div>
            <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>Send Pass to Visitor</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-sm"
                style={{ flex: 1, borderRadius: '50px', background: '#25D366', color: '#fff', border: 'none', fontWeight: 700 }}
                onClick={handleShareToVisitor}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                WhatsApp
              </button>
              <button
                className="btn btn-sm"
                style={{ flex: 1, borderRadius: '50px', background: 'var(--blue)', color: '#fff', border: 'none', fontWeight: 700 }}
                onClick={handleEmailToVisitor}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                Email
              </button>
            </div>
          </div>

        </div>

        {/* Inline Notes Edit Form */}
        {editingNotes && (
          <div style={{ marginTop: '20px', borderTop: '1px dashed #cbd5e1', paddingTop: '15px', textAlign: 'left' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px' }}>Add Security Notes / Material Carriage</h4>
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <textarea 
                className="input" 
                rows="3" 
                placeholder="Laptop serial, tools check-in, car registration number..."
                value={notesText}
                onChange={e => setNotesText(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setEditingNotes(false)}>
                Cancel
              </button>
              <button className="btn btn-primary btn-sm" onClick={handleSaveNotes}>
                Save Notes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
