import React, { useState, useEffect } from 'react';

// ─── Pure SVG: Premium Donut Chart with Round Caps & Center Interaction ──
function DonutChart({ data, size = 200 }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const cx = size / 2, cy = size / 2;
  const r = 68; // Increased radius for larger size
  const strokeWidth = 24; // Thicker stroke for "gol gol" bold ring
  const circumference = 2 * Math.PI * r;
  const COLORS = ['#6ea800', '#0284c7', '#e05000', '#16a34a', '#6366f1'];
  
  const total = (data || []).reduce((s, d) => s + (parseInt(d.value) || 0), 0);

  if (!total) return (
    <div style={{ width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 600, textAlign: 'center' }}>No visits yet</p>
    </div>
  );

  let currentOffset = 0;
  const activeSegments = data.filter(d => (parseInt(d.value) || 0) > 0);

  // Dynamic center text based on hover state
  const centerValue = hoveredIdx !== null ? activeSegments[hoveredIdx].value : total;
  const centerLabel = hoveredIdx !== null 
    ? (activeSegments[hoveredIdx].name.length > 9 ? activeSegments[hoveredIdx].name.substring(0, 8) + '…' : activeSegments[hoveredIdx].name)
    : 'VISITS';

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background Track circle */}
        <circle 
          cx={cx} 
          cy={cy} 
          r={r} 
          fill="none" 
          stroke="rgba(15,23,42,0.05)" 
          strokeWidth={strokeWidth} 
        />
        
        {/* Rotated group for circles */}
        <g transform={`rotate(-90 ${cx} ${cy})`}>
          {activeSegments.map((seg, i) => {
            const val = parseInt(seg.value) || 0;
            const pct = val / total;
            const gap = activeSegments.length > 1 ? 12 : 0;
            const arcLength = (pct * circumference) - gap;
            const strokeDashoffset = -currentOffset;
            
            currentOffset += pct * circumference;
            const isHovered = hoveredIdx === i;
            
            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeLinecap="round"
                strokeDasharray={`${Math.max(arcLength, 0.1)} ${circumference}`}
                strokeDashoffset={strokeDashoffset}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{ 
                  cursor: 'pointer',
                  transition: 'stroke-width 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), stroke-dasharray 0.5s ease',
                  filter: isHovered ? `drop-shadow(0 6px 14px ${COLORS[i % COLORS.length]}45)` : 'none'
                }}
              />
            );
          })}
        </g>
        
        {/* Center text remains perfectly vertical (unrotated) */}
        <text x={cx} y={cy - 6} textAnchor="middle" style={{ fontSize: '32px', fontWeight: 900, fill: '#0f172a', fontFamily: 'inherit' }}>{centerValue}</text>
        <text x={cx} y={cy + 16} textAnchor="middle" style={{ fontSize: '9.5px', fontWeight: 800, fill: '#9ca3af', letterSpacing: '1.2px', textTransform: 'uppercase', fontFamily: 'inherit' }}>{centerLabel}</text>
      </svg>
    </div>
  );
}

// ─── Pure SVG: Beautiful Thick Semi-circle Gauge (medical style) ────────
function SemiGauge({ pct = 0, color = '#6ea800', size = 150, id = 'gauge' }) {
  const cx = size / 2;
  const cy = size * 0.72;
  const r = size * 0.38;
  const sw = 18; // Thick stroke width
  const arcLen = Math.PI * r;
  const filled = Math.min(pct / 100, 1) * arcLen;
  const track = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;

  return (
    <svg width={size} height={size * 0.76} viewBox={`0 0 ${size} ${size * 0.76}`}>
      <defs>
        {/* Repeating diagonal pattern for the pending/empty track part */}
        <pattern id={`stripes-${id}`} width="8" height="8" patternUnits="userSpaceOnUse">
          <line x1="0" y1="8" x2="8" y2="0" stroke="rgba(15,23,42,0.12)" strokeWidth="2.5" strokeLinecap="round" />
        </pattern>
      </defs>

      {/* Striped Background Track with rounded ends (like reference progress gauge) */}
      <path 
        d={track} 
        fill="none" 
        stroke={`url(#stripes-${id})`}
        strokeWidth={sw} 
        strokeLinecap="round" 
      />
      
      {/* Filled Arc with rounded ends */}
      {pct > 0 && (
        <path 
          d={track} 
          fill="none" 
          stroke={color} 
          strokeWidth={sw} 
          strokeLinecap="round"
          strokeDasharray={`${filled} ${arcLen}`}
          style={{ 
            transition: 'stroke-dasharray 1s cubic-bezier(0.34, 1.56, 0.64, 1)',
            filter: `drop-shadow(0 4px 10px ${color}30)` 
          }}
        />
      )}
      
      {/* Percentage Center Text */}
      <text 
        x={cx} 
        y={cy * 0.84} 
        textAnchor="middle"
        style={{ fontSize: '26px', fontWeight: 900, fill: '#0f172a', fontFamily: 'inherit' }}
      >
        {pct}%
      </text>
    </svg>
  );
}

// ─── CSS: Premium Capsule-shaped Vertical Bar Chart with Hover Tooltip ───
function BarChart({ data, height = 180 }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);
  
  // Typical departments to ensure a complete, populated 7-column layout (like the calendar view reference)
  const defaultDepts = ["IT", "Production", "Accounts", "HR", "Purchase", "Sales", "Security"];
  
  // Merge active distribution data with typical placeholder departments
  const displayData = [...(data || [])];
  defaultDepts.forEach(name => {
    if (displayData.length < 7 && !displayData.some(d => d.name.toLowerCase() === name.toLowerCase())) {
      displayData.push({ name, value: 0 });
    }
  });
  
  const finalDepts = displayData.slice(0, 7);
  const max = Math.max(...finalDepts.map(d => parseInt(d.value) || 0), 1);

  // Return a fresh orange color matching the density of the values (darker as values increase)
  const getColorForVal = (val) => {
    if (val === 0) return 'transparent';
    const ratio = val / max;
    if (ratio >= 0.8) return '#9a3412'; // Deepest burnt orange (highest density)
    if (ratio >= 0.5) return '#c2410c'; // Burnt orange
    if (ratio >= 0.25) return '#ea580c'; // Vibrant orange
    return '#fdba74'; // Soft light orange (lowest density)
  };

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height, padding: '24px 10px 0', position: 'relative' }}>
      {finalDepts.map((d, i) => {
        const val = parseInt(d.value) || 0;
        const pct = (val / max) * 100;
        const isHovered = hoveredIdx === i;
        const color = getColorForVal(val);

        return (
          <div 
            key={i} 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              height: '100%', 
              justifyContent: 'flex-end', 
              width: '42px', // Wide column container
              position: 'relative',
              cursor: val > 0 ? 'pointer' : 'default',
              transform: isHovered ? 'translateY(-10px)' : 'none',
              transition: 'transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
            onMouseEnter={() => val > 0 && setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            {/* Hover Tooltip */}
            {val > 0 && (
              <div style={{
                position: 'absolute',
                top: '-24px',
                background: '#ffffff',
                border: '1px solid rgba(15,23,42,0.08)',
                borderRadius: '8px',
                padding: '3px 8px',
                fontSize: '11px',
                fontWeight: 800,
                color: '#0f172a',
                boxShadow: '0 4px 12px rgba(15,23,42,0.08)',
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
                opacity: isHovered ? 1 : 0,
                transform: isHovered ? 'scale(1)' : 'scale(0.8)',
                transition: 'all 0.2s ease',
                zIndex: 10
              }}>
                {val} visit{val !== 1 ? 's' : ''}
                {/* Tooltip Arrow */}
                <div style={{
                  position: 'absolute',
                  bottom: '-4px',
                  left: '50%',
                  transform: 'translateX(-50%) rotate(45deg)',
                  width: '6px',
                  height: '6px',
                  background: '#ffffff',
                  borderRight: '1px solid rgba(15,23,42,0.08)',
                  borderBottom: '1px solid rgba(15,23,42,0.08)'
                }} />
              </div>
            )}

            {/* Background pill column */}
            <div style={{
              width: '38px',
              height: '100px',
              borderRadius: '999px',
              background: val === 0 
                ? 'repeating-linear-gradient(45deg, rgba(15,23,42,0.03), rgba(15,23,42,0.03) 6px, rgba(15,23,42,0.07) 6px, rgba(15,23,42,0.07) 12px)'
                : 'rgba(15,23,42,0.03)',
              border: val === 0 ? '1.5px dashed rgba(15,23,42,0.08)' : '1px solid rgba(15,23,42,0.02)',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              boxShadow: isHovered ? '0 8px 16px rgba(15,23,42,0.06)' : 'none',
              transition: 'box-shadow 0.28s ease'
            }}>
              {/* Colored active fill pill */}
              {val > 0 && (
                <div style={{
                  width: '100%',
                  height: `${Math.max(pct, 12)}%`,
                  background: color,
                  borderRadius: '999px',
                  boxShadow: `0 4px 10px ${color}35`,
                  transition: 'height 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }} />
              )}
            </div>
            
            {/* Label */}
            <span style={{
              fontSize: '10px', 
              color: val > 0 ? '#0f172a' : '#9ca3af', 
              fontWeight: 800, 
              textAlign: 'center',
              width: '100%', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              whiteSpace: 'nowrap',
              letterSpacing: '0.2px', 
              textTransform: 'uppercase',
              marginTop: '8px'
            }} title={d.name}>
              {d.name.length > 5 ? d.name.substring(0, 4) + '.' : d.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Card Wrapper ────────────────────────────────────────────────────────
const Card = ({ children, style = {} }) => (
  <div style={{
    background: 'rgba(255,255,255,0.46)',
    backdropFilter: 'blur(28px) saturate(200%)',
    WebkitBackdropFilter: 'blur(28px) saturate(200%)',
    border: '1px solid rgba(255,255,255,0.72)',
    borderRadius: '24px',
    padding: '28px',
    boxShadow: '0 4px 24px rgba(15,23,42,0.04), 0 1px 0 rgba(255,255,255,0.95) inset',
    ...style
  }}>
    {children}
  </div>
);

const CardHeader = ({ icon, title, sub, iconBg, iconColor }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '22px' }}>
    <div style={{ width: 38, height: 38, borderRadius: '12px', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <span style={{ color: iconColor }}>{icon}</span>
    </div>
    <div>
      <h3 style={{ fontSize: '15.5px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.2px' }}>{title}</h3>
      {sub && <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0, fontWeight: 600 }}>{sub}</p>}
    </div>
  </div>
);

// ─── Main Component ──────────────────────────────────────────────────────
export default function AnalyticsDashboard({ backendUrl = '' }) {
  const [stats, setStats] = useState({
    counters: { pending: 0, inside: 0, completed_today: 0, rejected_today: 0 },
    deptDistribution: [],
    purposeDistribution: [],
    unitDistribution: []
  });
  const [loading, setLoading] = useState(true);
  const [hoveredUnitIdx, setHoveredUnitIdx] = useState(null);
  const [hoveredCardIdx, setHoveredCardIdx] = useState(null);

  const fetchStats = () => {
    fetch(`${backendUrl}/api/dashboard/stats`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => { if (d.success) setStats(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchStats(); }, [backendUrl]);

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const DONUT_COLORS = ['#6ea800', '#0284c7', '#e05000', '#16a34a', '#6366f1'];

  const statCards = [
    {
      label: 'Currently Inside',
      value: stats.counters.inside,
      sub: 'Active gate passes',
      hero: true,
      numColor: '#a3e635',
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
    },
    {
      label: 'Pending Approvals',
      value: stats.counters.pending,
      sub: 'Awaiting review',
      bg: 'rgba(255,243,238,0.55)',
      numColor: '#e05000',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e05000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
    },
    {
      label: 'Completed Today',
      value: stats.counters.completed_today,
      sub: 'Checked out',
      bg: 'rgba(240,247,224,0.55)',
      numColor: '#6ea800',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6ea800" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
    },
    {
      label: 'Rejected Today',
      value: stats.counters.rejected_today,
      sub: 'Denied entry',
      bg: 'rgba(254,226,226,0.55)',
      numColor: '#dc2626',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
    }
  ];

  return (
    <div style={{ paddingBottom: '30px' }}>

      {/* ── Page Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 900, color: '#0f172a', letterSpacing: '-1px', lineHeight: 1.1, margin: 0 }}>Dashboard</h1>
          <p style={{ color: '#9ca3af', fontSize: '13.5px', marginTop: '6px', fontWeight: 600, letterSpacing: '0.1px' }}>{today}</p>
        </div>
        <button
          onClick={fetchStats}
          style={{ padding: '11px 22px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '999px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px', letterSpacing: '0.1px', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38"/></svg>
          Refresh
        </button>
      </div>

      {/* ── Stat Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '20px' }}>
        {statCards.map((c, i) => {
          const isHovered = hoveredCardIdx === i;
          return (
            <div 
              key={i} 
              onMouseEnter={() => setHoveredCardIdx(i)}
              onMouseLeave={() => setHoveredCardIdx(null)}
              style={{
                background: c.hero ? 'rgba(15,23,42,0.82)' : c.bg,
                backdropFilter: 'blur(28px) saturate(200%)',
                WebkitBackdropFilter: 'blur(28px) saturate(200%)',
                border: c.hero ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(255,255,255,0.75)',
                borderRadius: '24px',
                padding: '26px',
                minHeight: '160px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: isHovered 
                  ? (c.hero ? '0 12px 38px rgba(15,23,42,0.28)' : '0 10px 28px rgba(15,23,42,0.08), 0 1px 0 rgba(255,255,255,0.95) inset')
                  : (c.hero ? '0 8px 32px rgba(15,23,42,0.18)' : '0 4px 20px rgba(15,23,42,0.04), 0 1px 0 rgba(255,255,255,0.9) inset'),
                position: 'relative',
                overflow: 'hidden',
                cursor: 'pointer',
                transform: isHovered ? 'translateY(-8px)' : 'none',
                transition: 'all 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}
            >
              {c.hero && <div style={{ position: 'absolute', top: -28, right: -28, width: 110, height: 110, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <p style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.9px', color: c.hero ? 'rgba(255,255,255,0.5)' : '#9ca3af', margin: 0 }}>{c.label}</p>
                <div style={{ width: 36, height: 36, borderRadius: '11px', background: c.hero ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{c.icon}</div>
              </div>
              <div>
                <div style={{ fontSize: '52px', fontWeight: 900, lineHeight: 1, letterSpacing: '-3px', color: c.numColor }}>{loading ? '–' : c.value}</div>
                <div style={{ fontSize: '12px', color: c.hero ? 'rgba(255,255,255,0.38)' : '#9ca3af', fontWeight: 600, marginTop: '7px' }}>{c.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Charts Row ── */}
      {!loading && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1.10fr 0.90fr', gap: '16px', marginBottom: '16px' }}>

            {/* Pill Column Chart — Departments */}
            <Card>
              <CardHeader
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>}
                title="Project Analytics"
                sub={`${stats.deptDistribution.length} department${stats.deptDistribution.length !== 1 ? 's' : ''} active`}
                iconBg="rgba(224,80,0,0.12)"
                iconColor="#e05000"
              />
              {stats.deptDistribution.length === 0
                ? <p style={{ color: '#9ca3af', fontSize: '13px', textAlign: 'center', padding: '28px 0', fontWeight: 600 }}>No department visits recorded</p>
                : <BarChart data={stats.deptDistribution} height={160} />
              }
            </Card>

            {/* Circular Donut Chart — Purpose */}
            <Card>
              <CardHeader
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>}
                title="Visits by Purpose"
                sub={`${stats.purposeDistribution.length} purposes`}
                iconBg="rgba(3,105,161,0.10)"
                iconColor="#0369a1"
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
                <DonutChart data={stats.purposeDistribution} size={200} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {stats.purposeDistribution.length === 0
                    ? <p style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 600 }}>No data yet</p>
                    : stats.purposeDistribution.map((d, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: DONUT_COLORS[i % DONUT_COLORS.length], flexShrink: 0 }} />
                          <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#4b5563', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</span>
                          <span style={{ fontSize: '13.5px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.3px' }}>{d.value}</span>
                        </div>
                      ))
                  }
                </div>
              </div>
            </Card>
          </div>

          {/* Unit Occupancy — Semi-circle Gauges with rounded caps and stripes */}
          {stats.unitDistribution.length > 0 && (
            <Card>
              <CardHeader
                icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M9 21V9a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v12"/></svg>}
                title="Branch / Unit Occupancy"
                sub="Live circular indicator"
                iconBg="rgba(110,168,0,0.10)"
                iconColor="#6ea800"
              />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '16px' }}>
                {stats.unitDistribution.map((item, i) => {
                  const total = parseInt(item.total_visits || 0);
                  const inside = parseInt(item.inside_now || 0);
                  const pct = total > 0 ? Math.round((inside / total) * 100) : 0;
                  const isActive = inside > 0;
                  const isHovered = hoveredUnitIdx === i;
                  
                  return (
                    <div 
                      key={i} 
                      style={{
                        background: 'rgba(255,255,255,0.42)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255,255,255,0.8)',
                        borderRadius: '20px',
                        padding: '20px 18px 14px',
                        textAlign: 'center',
                        boxShadow: isHovered ? '0 8px 24px rgba(15,23,42,0.06)' : '0 2px 8px rgba(15,23,42,0.03)',
                        transform: isHovered ? 'translateY(-6px)' : 'none',
                        transition: 'all 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        cursor: 'pointer',
                        position: 'relative'
                      }}
                      onMouseEnter={() => setHoveredUnitIdx(i)}
                      onMouseLeave={() => setHoveredUnitIdx(null)}
                    >
                      {/* Floating tooltip on hover to match premium charts feel */}
                      {isHovered && (
                        <div style={{
                          position: 'absolute',
                          top: '-20px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          background: '#ffffff',
                          border: '1px solid rgba(15,23,42,0.08)',
                          borderRadius: '8px',
                          padding: '3px 8px',
                          fontSize: '11px',
                          fontWeight: 800,
                          color: '#0f172a',
                          boxShadow: '0 4px 12px rgba(15,23,42,0.08)',
                          pointerEvents: 'none',
                          whiteSpace: 'nowrap',
                          zIndex: 10
                        }}>
                          {pct}% Filled
                          {/* Tooltip Arrow */}
                          <div style={{
                            position: 'absolute',
                            bottom: '-4px',
                            left: '50%',
                            transform: 'translateX(-50%) rotate(45deg)',
                            width: '6px',
                            height: '6px',
                            background: '#ffffff',
                            borderRight: '1px solid rgba(15,23,42,0.08)',
                            borderBottom: '1px solid rgba(15,23,42,0.08)'
                          }} />
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', textAlign: 'left' }}>
                        <p style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: 1.3 }}>{item.name}</p>
                        <span style={{
                          background: isActive ? 'rgba(110,168,0,0.12)' : 'rgba(15,23,42,0.05)',
                          color: isActive ? '#6ea800' : '#9ca3af',
                          fontSize: '9px', fontWeight: 800, padding: '3px 8px', borderRadius: '999px',
                          textTransform: 'uppercase', letterSpacing: '0.5px', flexShrink: 0
                        }}>{isActive ? 'Active' : 'Clear'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
                        <SemiGauge pct={pct} color={isActive ? '#6ea800' : '#cbd5e1'} size={145} id={`unit-${i}`} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '10px', borderTop: '1px solid rgba(15,23,42,0.05)', paddingTop: '12px' }}>
                        <div style={{ textAlign: 'center' }}>
                          <p style={{ fontSize: '19px', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>{total}</p>
                          <p style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Logged</p>
                        </div>
                        <div style={{ width: 1, background: 'rgba(15,23,42,0.06)' }} />
                        <div style={{ textAlign: 'center' }}>
                          <p style={{ fontSize: '19px', fontWeight: 900, color: '#6ea800', margin: 0, letterSpacing: '-0.5px' }}>{inside}</p>
                          <p style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Inside</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </>
      )}

      {loading && (
        <div style={{ padding: '60px 0', textAlign: 'center' }}>
          <p style={{ color: '#9ca3af', fontWeight: 700, fontSize: '14px', letterSpacing: '0.3px' }}>Loading analytics…</p>
        </div>
      )}
    </div>
  );
}
