import React, { useState, useEffect, useRef } from 'react';

export default function VisitorForm({ backendUrl = '', onComplete }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '', mobile: '', company: '', address: '', city: '', email: '',
    department_id: '', employee_id: '', purpose_id: '', unit_id: '', gate_id: ''
  });
  const [masters, setMasters] = useState({ units: [], departments: [], employees: [], gates: [], purposes: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Photo
  const [photo, setPhoto] = useState('');
  const [useCamera, setUseCamera] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Signature
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    fetch(`${backendUrl}/api/visitors/form-data`)
      .then(r => r.json())
      .then(r => { if (r.success) setMasters(r.data); else setError('Failed to load form metadata.'); })
      .catch(() => setError('Error connecting to backend server.'));
  }, [backendUrl]);

  // Camera fix — assign stream AFTER video element mounts
  const startCamera = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } });
      streamRef.current = stream;
      setUseCamera(true);
    } catch {
      setError('Camera access denied. Please upload a photo instead.');
    }
  };

  useEffect(() => {
    if (useCamera && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [useCamera]);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setUseCamera(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = 640; canvas.height = 480;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0, 640, 480);
    setPhoto(canvas.toDataURL('image/jpeg'));
    stopCamera();
  };

  const handlePhotoUpload = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setPhoto(ev.target.result);
    reader.readAsDataURL(file);
  };

  // Signature canvas
  useEffect(() => {
    if (step === 3 && canvasRef.current) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
    }
  }, [step]);

  const getCoords = e => {
    const rect = canvasRef.current.getBoundingClientRect();
    if (e.touches?.[0]) return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = e => {
    e.preventDefault();
    const c = getCoords(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath(); ctx.moveTo(c.x, c.y);
    setIsDrawing(true);
  };
  const draw = e => {
    if (!isDrawing) return;
    e.preventDefault();
    const c = getCoords(e);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(c.x, c.y); ctx.stroke();
  };
  const stopDraw = () => setIsDrawing(false);
  const clearSig = () => {
    const canvas = canvasRef.current;
    if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    let signatureDataUrl = '';
    const canvas = canvasRef.current;
    if (canvas) {
      const blank = !new Uint32Array(canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data.buffer).some(c => c !== 0);
      if (blank) { setError('Please provide your signature to continue.'); return; }
      signatureDataUrl = canvas.toDataURL('image/png');
    }
    if (!photo) { setError('Visitor photo is required.'); return; }
    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/visitors/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, photo, signature: signatureDataUrl })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(data.message);
        setTimeout(() => { if (onComplete) onComplete(); }, 5000);
      } else { setError(data.message || 'Registration failed.'); }
    } catch { setError('Server error during registration.'); }
    finally { setLoading(false); }
  };

  const handleFieldChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const filteredEmployees = formData.department_id
    ? masters.employees.filter(emp => !emp.department_id || emp.department_id === parseInt(formData.department_id))
    : masters.employees;

  const filteredGates = formData.unit_id
    ? masters.gates.filter(g => g.unit_id === parseInt(formData.unit_id))
    : masters.gates;

  // ── Styles ──────────────────────────────────────
  const S = {
    page: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #eef0e8 0%, #d8ecc0 50%, #e8ecf5 100%)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: '40px 16px 60px',
    },
    card: {
      background: 'rgba(255,255,255,0.62)',
      backdropFilter: 'blur(24px) saturate(180%)',
      WebkitBackdropFilter: 'blur(24px) saturate(180%)',
      borderRadius: '28px',
      padding: '44px',
      maxWidth: '580px',
      width: '100%',
      boxShadow: '0 8px 40px rgba(15,23,42,0.10), 0 1px 0 rgba(255,255,255,0.8) inset',
      border: '1px solid rgba(255,255,255,0.7)',
    },
    label: {
      display: 'block',
      fontSize: '13px',
      fontWeight: 700,
      color: '#374151',
      marginBottom: '8px',
      letterSpacing: '0.1px',
    },
    input: {
      width: '100%',
      padding: '14px 18px',
      fontSize: '15px',
      background: 'rgba(255,255,255,0.65)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      border: '1.5px solid rgba(255,255,255,0.8)',
      borderRadius: '14px',
      color: '#0f172a',
      outline: 'none',
      transition: 'border-color 0.18s, box-shadow 0.18s, background 0.18s',
      marginBottom: '18px',
      boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
    },
    nextBtn: {
      width: '100%',
      padding: '16px',
      background: '#0f172a',
      color: '#fff',
      border: 'none',
      borderRadius: '14px',
      fontWeight: 800,
      fontSize: '15.5px',
      cursor: 'pointer',
      marginTop: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      letterSpacing: '0.2px',
    },
    backBtn: {
      padding: '14px 24px',
      background: 'rgba(255,255,255,0.5)',
      color: '#4b5563',
      border: '1.5px solid rgba(255,255,255,0.7)',
      borderRadius: '14px',
      fontWeight: 700,
      fontSize: '14px',
      cursor: 'pointer',
      backdropFilter: 'blur(8px)',
    },
  };

  // ── Success Screen ───────────────────────────────
  if (successMsg) {
    return (
      <div style={S.page}>
        <div style={{ ...S.card, textAlign: 'center', padding: '50px 36px' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#f0f7e0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#6ea800" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', marginBottom: '12px' }}>Request Submitted!</h2>
          <p style={{ color: '#4b5563', lineHeight: 1.6, fontWeight: 500, fontSize: '14.5px', marginBottom: '20px' }}>{successMsg}</p>
          <div style={{ background: '#fff3ee', borderRadius: '12px', padding: '12px 18px', display: 'inline-block' }}>
            <p style={{ fontSize: '13px', color: '#e05000', fontWeight: 700 }}>Waiting for security approval…</p>
          </div>
        </div>
      </div>
    );
  }

  const steps = ['Contact Details', 'Destination', 'Photo & Sign'];

  return (
    <div style={S.page}>
      <div style={S.card}>

        {/* ── Brand header ── */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '9px', marginBottom: '4px' }}>
            <div style={{ width: 32, height: 32, background: '#0f172a', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a3e635" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <span style={{ fontSize: '19px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.3px' }}>VeriPass</span>
          </div>
          <p style={{ fontSize: '13px', color: '#9ca3af', fontWeight: 500 }}>Visitor Registration</p>
        </div>

        {/* ── Step progress — numbered pill style like medical app ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0', marginBottom: '32px' }}>
          {steps.map((label, i) => {
            const num = i + 1;
            const done = step > num;
            const active = step === num;
            return (
              <React.Fragment key={i}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%',
                    background: done ? '#6ea800' : active ? '#0f172a' : '#f1f5f9',
                    color: done || active ? '#fff' : '#9ca3af',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '14px',
                    boxShadow: active ? '0 0 0 4px rgba(110,168,0,0.15)' : 'none',
                    transition: 'all 0.25s ease',
                  }}>
                    {done ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ) : num}
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: active ? '#0f172a' : '#9ca3af', whiteSpace: 'nowrap', letterSpacing: '0.1px' }}>
                    {label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div style={{ flex: 1, height: '2px', background: step > num ? '#6ea800' : '#e2e8f0', margin: '0 8px 18px', borderRadius: '2px', transition: 'background 0.3s ease' }} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* ── Error banner ── */}
        {error && (
          <div style={{ background: '#fee2e2', border: '1px solid rgba(220,38,38,0.15)', borderRadius: '12px', padding: '12px 14px', marginBottom: '20px', display: 'flex', gap: '9px', alignItems: 'center' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p style={{ color: '#dc2626', fontSize: '13.5px', fontWeight: 600, margin: 0 }}>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* ══ STEP 1 ══ */}
          {step === 1 && (
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '20px', letterSpacing: '-0.3px' }}>Tell us about yourself</h3>

              {[
                { label: 'Full Name *', name: 'name', type: 'text', placeholder: 'Enter your full name', required: true },
                { label: 'Mobile Number *', name: 'mobile', type: 'tel', placeholder: '10-digit mobile number', required: true },
                { label: 'Company / Organisation', name: 'company', type: 'text', placeholder: 'Your company name' },
                { label: 'Email Address', name: 'email', type: 'email', placeholder: 'you@example.com' },
              ].map(f => (
                <div key={f.name}>
                  <label style={S.label}>{f.label}</label>
                  <input
                    type={f.type}
                    name={f.name}
                    required={f.required}
                    placeholder={f.placeholder}
                    value={formData[f.name]}
                    onChange={handleFieldChange}
                    style={S.input}
                    onFocus={e => { e.target.style.borderColor = '#6ea800'; e.target.style.boxShadow = '0 0 0 3px rgba(110,168,0,0.12)'; e.target.style.background = '#fff'; }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(15,23,42,0.09)'; e.target.style.boxShadow = 'none'; e.target.style.background = '#f8fafc'; }}
                  />
                </div>
              ))}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                  { label: 'City', name: 'city', placeholder: 'e.g. Mumbai' },
                  { label: 'Address', name: 'address', placeholder: 'Street / Area' },
                ].map(f => (
                  <div key={f.name}>
                    <label style={S.label}>{f.label}</label>
                    <input
                      type="text"
                      name={f.name}
                      placeholder={f.placeholder}
                      value={formData[f.name]}
                      onChange={handleFieldChange}
                      style={S.input}
                      onFocus={e => { e.target.style.borderColor = '#6ea800'; e.target.style.boxShadow = '0 0 0 3px rgba(110,168,0,0.12)'; e.target.style.background = '#fff'; }}
                      onBlur={e => { e.target.style.borderColor = 'rgba(15,23,42,0.09)'; e.target.style.boxShadow = 'none'; e.target.style.background = '#f8fafc'; }}
                    />
                  </div>
                ))}
              </div>

              <button type="button" style={{ ...S.nextBtn, background: (!formData.name || !formData.mobile) ? '#e2e8f0' : '#0f172a', color: (!formData.name || !formData.mobile) ? '#9ca3af' : '#fff' }}
                disabled={!formData.name || !formData.mobile}
                onClick={() => setStep(2)}
              >
                Continue
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
          )}

          {/* ══ STEP 2 ══ */}
          {step === 2 && (
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '20px', letterSpacing: '-0.3px' }}>Where are you headed?</h3>

              {[
                { label: 'Visiting Branch / Unit *', name: 'unit_id', options: masters.units, required: true },
                { label: 'Department', name: 'department_id', options: masters.departments },
                { label: 'Meeting Employee *', name: 'employee_id', options: filteredEmployees, required: true },
              ].map(f => (
                <div key={f.name}>
                  <label style={S.label}>{f.label}</label>
                  <select
                    name={f.name}
                    required={f.required}
                    value={formData[f.name]}
                    onChange={handleFieldChange}
                    style={{ ...S.input, appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%234b5563'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center', backgroundSize: '15px', paddingRight: '38px' }}
                  >
                    <option value="">Select {f.label.replace(' *','')}</option>
                    {f.options.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </select>
                </div>
              ))}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={S.label}>Entry Gate *</label>
                  <select name="gate_id" required value={formData.gate_id} onChange={handleFieldChange}
                    style={{ ...S.input, appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%234b5563'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center', backgroundSize: '15px', paddingRight: '38px' }}>
                    <option value="">Select Gate</option>
                    {filteredGates.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.label}>Visit Purpose *</label>
                  <select name="purpose_id" required value={formData.purpose_id} onChange={handleFieldChange}
                    style={{ ...S.input, appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%234b5563'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center', backgroundSize: '15px', paddingRight: '38px' }}>
                    <option value="">Select Purpose</option>
                    {masters.purposes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                <button type="button" style={S.backBtn} onClick={() => setStep(1)}>← Back</button>
                <button type="button"
                  style={{ ...S.nextBtn, flex: 1, background: (!formData.unit_id || !formData.employee_id || !formData.gate_id || !formData.purpose_id) ? '#e2e8f0' : '#0f172a', color: (!formData.unit_id || !formData.employee_id || !formData.gate_id || !formData.purpose_id) ? '#9ca3af' : '#fff', marginTop: 0 }}
                  disabled={!formData.unit_id || !formData.employee_id || !formData.gate_id || !formData.purpose_id}
                  onClick={() => setStep(3)}
                >
                  Continue <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
            </div>
          )}

          {/* ══ STEP 3 ══ */}
          {step === 3 && (
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '6px', letterSpacing: '-0.3px' }}>Verify your identity</h3>
              <p style={{ color: '#9ca3af', fontSize: '13.5px', fontWeight: 500, marginBottom: '22px' }}>Please take a photo and sign below</p>

              {/* Photo section */}
              <label style={S.label}>Visitor Photo *</label>
              {photo ? (
                <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', height: '220px', marginBottom: '16px', background: '#000' }}>
                  <img src={photo} alt="Captured" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button type="button"
                    style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(15,23,42,0.7)', color: '#fff', border: 'none', borderRadius: '8px', padding: '7px 13px', fontWeight: 700, fontSize: '12.5px', cursor: 'pointer', backdropFilter: 'blur(6px)' }}
                    onClick={() => setPhoto('')}
                  >Retake</button>
                </div>
              ) : useCamera ? (
                <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden', height: '240px', marginBottom: '16px', background: '#0f172a' }}>
                  <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  <div style={{ position: 'absolute', bottom: '12px', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '10px' }}>
                    <button type="button"
                      style={{ background: '#e05000', color: '#fff', border: 'none', borderRadius: '999px', padding: '10px 20px', fontWeight: 800, fontSize: '13.5px', cursor: 'pointer' }}
                      onClick={capturePhoto}
                    >
                      Capture Photo
                    </button>
                    <button type="button"
                      style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '999px', padding: '10px 18px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
                      onClick={stopCamera}
                    >Cancel</button>
                  </div>
                </div>
              ) : (
                <div style={{ border: '2px dashed rgba(15,23,42,0.12)', borderRadius: '16px', padding: '28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', marginBottom: '16px', background: '#fafafa' }}>
                  <div style={{ width: 50, height: 50, borderRadius: '50%', background: '#f0f7e0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6ea800" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                  </div>
                  <p style={{ color: '#4b5563', fontWeight: 600, fontSize: '14px', margin: 0 }}>Add your photo</p>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="button"
                      style={{ padding: '9px 18px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
                      onClick={startCamera}
                    >
                      Open Camera
                    </button>
                    <label style={{ padding: '9px 18px', background: '#f1f5f9', color: '#0f172a', border: '1.5px solid rgba(15,23,42,0.1)', borderRadius: '10px', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
                      Upload File
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />
                    </label>
                  </div>
                </div>
              )}

              {/* Signature */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ ...S.label, marginBottom: 0 }}>Digital Signature *</label>
                <button type="button" onClick={clearSig} style={{ fontSize: '12px', color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Clear</button>
              </div>
              <div style={{ border: '1.5px dashed rgba(15,23,42,0.15)', borderRadius: '14px', background: '#fff', overflow: 'hidden', marginBottom: '16px' }}>
                <canvas
                  ref={canvasRef}
                  style={{ width: '100%', height: '160px', cursor: 'crosshair', display: 'block', touchAction: 'none' }}
                  onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
                  onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
                />
                <p style={{ fontSize: '11.5px', color: '#d1d5db', textAlign: 'center', padding: '0 0 10px', fontWeight: 500, pointerEvents: 'none' }}>
                  Draw your signature above
                </p>
              </div>

              {/* Terms */}
              <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', cursor: 'pointer', marginBottom: '20px', background: '#f8fafc', borderRadius: '12px', padding: '13px' }}>
                <input type="checkbox" required style={{ marginTop: '3px', accentColor: '#6ea800', width: '15px', height: '15px', flexShrink: 0 }} />
                <span style={{ fontSize: '13px', color: '#4b5563', lineHeight: 1.5, fontWeight: 500 }}>
                  I agree to the visitor safety guidelines and confirm all provided information is accurate.
                </span>
              </label>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" style={S.backBtn} onClick={() => setStep(2)}>← Back</button>
                <button type="submit"
                  style={{ ...S.nextBtn, flex: 1, marginTop: 0, background: loading ? '#9ca3af' : '#6ea800', opacity: loading ? 0.8 : 1 }}
                  disabled={loading || !photo}
                >
                  {loading ? 'Submitting…' : 'Submit Request'}
                  {!loading && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>}
                </button>
              </div>
            </div>
          )}

        </form>
      </div>
    </div>
  );
}
