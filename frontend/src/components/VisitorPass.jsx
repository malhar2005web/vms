import React from 'react';

export default function VisitorPass({ visit, onClose }) {
  if (!visit) return null;

  const handlePrint = () => {
    window.print();
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
      <div className="glass modal-content" style={{ maxWidth: '550px', background: '#ffffff', color: '#0f172a', border: '1.5px solid rgba(15,23,42,0.15)' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1.5px solid var(--glass-border)', paddingBottom: '12px' }}>
          <h3 style={{ color: 'var(--orange)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800 }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
            Visitor Gate Pass
          </h3>
          <button 
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '24px', cursor: 'pointer', fontWeight: 'bold' }}
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {/* PRINT CARD */}
        <div id="print-pass-area" className="pass-card" style={{ background: '#ffffff', color: '#0f172a', border: '3.5px solid #0f172a', borderRadius: '12px', padding: '24px', position: 'relative' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2.5px solid #0f172a', paddingBottom: '12px', marginBottom: '15px' }}>
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>VeriPass Systems</h2>
              <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Official Visitor Gate Pass</span>
            </div>
            <div style={{ background: 'var(--lime)', color: '#fff', padding: '6px 14px', borderRadius: '50px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', border: '2px solid #0f172a' }}>
              {visit.status}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px' }}>
            
            {/* Left Frame: Snap & QR */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center', width: '130px' }}>
              <div style={{ width: '130px', height: '140px', border: '2px solid #0f172a', borderRadius: '8px', overflow: 'hidden', background: '#e2e8f0' }}>
                {visit.photo ? (
                  <img src={visit.photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Visitor Snap" />
                ) : (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                )}
              </div>
              
              <div style={{ textAlign: 'center', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', background: 'white', width: '100%' }}>
                <div style={{ fontSize: '9px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>PASS ID: VMS-{visit.id}</div>
                <div style={{ width: '100%', height: '80px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: '70px', height: '70px', background: 'white', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', padding: '2px' }}>
                    {Array.from({ length: 25 }).map((_, i) => (
                      <div key={i} style={{ background: (i % 2 === 0 || i % 7 === 0 || i === 0 || i === 4 || i === 20 || i === 24) ? 'black' : 'white' }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right details */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ marginBottom: '10px' }}>
                  <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Visitor Name</span>
                  <strong style={{ fontSize: '18px', color: '#0f172a' }}>{visit.visitor_name}</strong>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                  <div>
                    <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Mobile Number</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>{visit.visitor_mobile}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Representing</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>{visit.visitor_company || '-'}</span>
                  </div>
                </div>

                <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '8px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Host Person</span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{visit.employee_name} ({visit.department_name})</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                  <div>
                    <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Branch / Unit</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>{visit.unit_name}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Entry gate</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>{visit.gate_name || '-'}</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                  <div>
                    <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Date</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>{getFormatDate(visit.created_at)}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Check-In Time</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>{getFormatTime(visit.in_time)}</span>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px dashed #cbd5e1', paddingTop: '8px' }}>
                <div>
                  <span style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Carry Items</span>
                  <span style={{ fontSize: '11px', color: '#475569', fontStyle: 'italic', fontWeight: 500 }}>{visit.notes || 'None'}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {visit.signature ? (
                    <img src={visit.signature} style={{ height: '40px', maxWidth: '100px', display: 'block', marginLeft: 'auto', filter: 'contrast(3)' }} alt="Signature" />
                  ) : (
                    <div style={{ height: '40px', width: '100px', borderBottom: '1px solid #cbd5e1' }} />
                  )}
                  <span style={{ fontSize: '9px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Visitor Signature</span>
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* Buttons Controls */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
          <button className="btn btn-secondary" style={{ border: '1px solid rgba(15,23,42,0.1)' }} onClick={onClose}>
            Close Pass
          </button>
          <button className="btn btn-primary" onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
            Print Pass
          </button>
        </div>

      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #print-pass-area, #print-pass-area * {
            visibility: visible !important;
          }
          #print-pass-area {
            position: absolute !important;
            left: 50% !important;
            top: 20% !important;
            transform: translate(-50%, -20%) !important;
            width: 14cm !important;
            box-shadow: none !important;
            border: 3.5px solid #000 !important;
            background: #fff !important;
            color: #000 !important;
          }
          .modal-overlay {
            background: transparent !important;
            backdrop-filter: none !important;
          }
        }
      `}</style>
    </div>
  );
}
