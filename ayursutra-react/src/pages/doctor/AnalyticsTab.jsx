import { useState, useEffect } from 'react';
import API from '../../services/api';

const CHART_COLORS = ['#4caf50', '#2196f3', '#ff9800', '#9c27b0', '#f44336', '#00bcd4', '#8bc34a'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/* ── Tiny SVG chart helpers ─────────────────────────────────────── */
function BarChart({ data, labels, colors, height = 220 }) {
    const max = Math.max(...data, 1);
    return (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height, padding: '0 4px' }}>
            {data.map((v, i) => {
                const h = Math.max(4, Math.round((v / max) * (height - 30)));
                return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#555' }}>{typeof v === 'number' ? (v % 1 === 0 ? v : v.toFixed(1)) : v}</span>
                        <div style={{ width: '100%', height: h, background: Array.isArray(colors) ? colors[i % colors.length] : colors, borderRadius: '4px 4px 0 0', transition: 'height 0.5s ease' }} title={`${labels[i]}: ${v}`} />
                        <span style={{ fontSize: 10, color: '#888', textAlign: 'center', maxWidth: 60 }}>{labels[i]}</span>
                    </div>
                );
            })}
        </div>
    );
}

function LineChart({ data, labels, height = 220 }) {
    const max = Math.max(...data, 1);
    const w = 300, h = height - 30;
    const pts = data.map((v, i) => {
        const x = data.length < 2 ? w / 2 : (i / (data.length - 1)) * w;
        const y = h - (v / max) * h;
        return [x, y];
    });
    const path = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
    const fill = `${path} L${pts[pts.length - 1][0]},${h} L${pts[0][0]},${h} Z`;
    return (
        <div style={{ width: '100%', overflowX: 'hidden' }}>
            <svg viewBox={`0 0 ${w} ${height}`} style={{ width: '100%', height }} preserveAspectRatio="none">
                <defs>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4caf50" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#4caf50" stopOpacity="0.02" />
                    </linearGradient>
                </defs>
                <path d={fill} fill="url(#lineGrad)" />
                <path d={path} fill="none" stroke="#4caf50" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="3.5" fill="#4caf50" stroke="#fff" strokeWidth="2" />)}
                {labels.map((l, i) => <text key={i} x={pts[i][0]} y={height} fontSize="9" fill="#888" textAnchor="middle">{l}</text>)}
            </svg>
        </div>
    );
}

function DonutChart({ data, labels, colors, size = 200, cutout = 60 }) {
    const total = data.reduce((a, b) => a + b, 0) || 1;
    const r = size / 2 - 10;
    const cx = size / 2, cy = size / 2;
    let angle = -Math.PI / 2;
    const slices = data.map((v, i) => {
        const start = angle;
        angle += (v / total) * 2 * Math.PI;
        return { start, end: angle, color: colors[i % colors.length], label: labels[i], pct: Math.round((v / total) * 100) };
    });
    return (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
                {slices.map((s, i) => {
                    const x1 = cx + r * Math.cos(s.start), y1 = cy + r * Math.sin(s.start);
                    const x2 = cx + r * Math.cos(s.end), y2 = cy + r * Math.sin(s.end);
                    const large = (s.end - s.start) > Math.PI ? 1 : 0;
                    const ri = r * (cutout / 100);
                    const xi1 = cx + ri * Math.cos(s.start), yi1 = cy + ri * Math.sin(s.start);
                    const xi2 = cx + ri * Math.cos(s.end), yi2 = cy + ri * Math.sin(s.end);
                    return (
                        <path key={i}
                            d={`M${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} L${xi2},${yi2} A${ri},${ri} 0 ${large} 0 ${xi1},${yi1} Z`}
                            fill={s.color} stroke="#fff" strokeWidth="2">
                            <title>{s.label}: {s.pct}%</title>
                        </path>
                    );
                })}
            </svg>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {slices.map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                        <span style={{ color: '#555' }}>{s.label}</span>
                        <span style={{ fontWeight: 700, color: '#333', marginLeft: 'auto', paddingLeft: 6 }}>{s.pct}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function EmptyState({ icon, text }) {
    return <div style={{ textAlign: 'center', padding: '2rem', color: '#aaa' }}><div style={{ fontSize: '2rem' }}>{icon}</div><p style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>{text}</p></div>;
}

export default function AnalyticsTab() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeFilter, setActiveFilter] = useState('all');

    const load = async () => {
        try {
            setError(null);
            const res = await API.get('/analytics');
            setData(res.data.data);
        } catch (err) {
            setError('Failed to load analytics. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        const interval = setInterval(load, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading) return (
        <div className="tab-content active" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
            <div style={{ textAlign: 'center', color: '#2a7d2e' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📈</div>
                <p style={{ fontWeight: 600 }}>Loading real analytics...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="tab-content active" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem' }}>⚠️</div>
                <p style={{ color: '#f44336' }}>{error}</p>
                <button className="dash-btn dash-btn-primary" onClick={load}>Retry</button>
            </div>
        </div>
    );

    // ── Map API data to chart format ────────────────────────────────────────
    const therapyLabels = (data.therapySuccess || []).map(t => t.therapyType || t._id || '?');
    const therapyValues = (data.therapySuccess || []).map(t => t.successRate || 0);

    const patientDistLabels = (data.patientDist || []).map(t => t.label || t._id || '?');
    const patientDistValues = (data.patientDist || []).map(t => t.count || 0);

    const growthLabels = (data.monthlyGrowth || []).map(m => m.label || '');
    const growthValues = (data.monthlyGrowth || []).map(m => m.count || 0);

    const retentionRate = data.retentionRate || 0;
    const dropRate = data.dropRate || 0;

    const statusMap = {};
    (data.statusBreakdown || []).forEach(s => { statusMap[s._id] = s.count; });

    const CHART_H = 220;

    return (
        <div className="tab-content active">
            {/* Header */}
            <div className="tab-header">
                <h2 style={{ color: '#2a7d2e' }}>Practice Analytics <span style={{ fontSize: '0.75rem', color: '#999', fontWeight: 400 }}>🔄 30s auto-refresh · Live data</span></h2>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <button className="dash-btn dash-btn-secondary" onClick={load}>↻ Refresh</button>
                </div>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {[
                    { label: 'Total Appointments', value: data.totalAppointments || 0, color: '#2a7d2e', bg: '#e8f5e9', icon: '📅' },
                    { label: 'Unique Patients', value: data.totalPatients || 0, color: '#1976d2', bg: '#e3f2fd', icon: '👥' },
                    { label: 'Completed Sessions', value: statusMap['completed'] || 0, color: '#388e3c', bg: '#f1f8e9', icon: '✅' },
                    { label: 'Retention Rate', value: `${retentionRate}%`, color: '#ff9800', bg: '#fff3e0', icon: '🔄' },
                ].map(s => (
                    <div key={s.label} style={{ background: s.bg, borderRadius: '14px', padding: '1rem 1.5rem', flex: 1, minWidth: '130px' }}>
                        <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{s.icon}</div>
                        <div style={{ fontWeight: 700, fontSize: '1.4rem', color: s.color }}>{s.value}</div>
                        <div style={{ color: '#666', fontSize: '0.82rem' }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Row 1: Therapy Success Rate + Patient Distribution */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="card" style={{ height: 350, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ marginBottom: '1rem', color: '#2a7d2e' }}>🏆 Therapy Success Rate (%)</h3>
                    <div style={{ flex: 1 }}>
                        {therapyValues.length === 0
                            ? <EmptyState icon="📊" text="No appointment data yet. Success rates will appear once appointments are completed." />
                            : <BarChart data={therapyValues} labels={therapyLabels} colors={CHART_COLORS} height={CHART_H} />
                        }
                    </div>
                </div>
                <div className="card" style={{ height: 350, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ marginBottom: '1rem', color: '#2a7d2e' }}>👥 Appointments by Type</h3>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                        {patientDistValues.length === 0
                            ? <EmptyState icon="👤" text="No patient data yet. Distribution will appear once appointments are created." />
                            : <DonutChart data={patientDistValues} labels={patientDistLabels} colors={CHART_COLORS} size={180} cutout={60} />
                        }
                    </div>
                </div>
            </div>

            {/* Row 2: Monthly Growth + Retention */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="card" style={{ height: 350, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ marginBottom: '1rem', color: '#2a7d2e' }}>📊 Monthly Appointment Growth</h3>
                    <div style={{ flex: 1 }}>
                        {growthValues.length === 0
                            ? <EmptyState icon="📈" text="No data for the last 12 months." />
                            : <LineChart data={growthValues} labels={growthLabels} height={CHART_H} />
                        }
                    </div>
                </div>
                <div className="card" style={{ height: 350, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ marginBottom: '1rem', color: '#2a7d2e' }}>🔄 Retention vs Drop-off</h3>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                        {data.totalPatients === 0
                            ? <EmptyState icon="🔄" text="No patient history yet." />
                            : <>
                                <DonutChart
                                    data={[retentionRate, dropRate]}
                                    labels={['Retained (>1 visit)', 'Single-visit']}
                                    colors={['#4caf50', '#f44336']}
                                    size={170} cutout={65}
                                />
                                <div style={{ textAlign: 'center' }}>
                                    <span style={{ fontSize: '2rem', fontWeight: 800, color: '#2a7d2e' }}>{retentionRate}%</span>
                                    <div style={{ fontSize: '0.82rem', color: '#777' }}>Retention Rate (patients with 2+ visits)</div>
                                </div>
                            </>
                        }
                    </div>
                </div>
            </div>

            {/* Appointment Status Breakdown */}
            {Object.keys(statusMap).length > 0 && (
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ color: '#2a7d2e', marginBottom: '1rem' }}>📋 Appointment Status Breakdown</h3>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        {Object.entries(statusMap).map(([status, count]) => {
                            const colors = { completed: '#4caf50', pending: '#ff9800', confirmed: '#2196f3', cancelled: '#f44336', missed: '#9c27b0' };
                            return (
                                <div key={status} style={{ background: '#f9f9f9', border: `2px solid ${colors[status] || '#ddd'}`, borderRadius: '12px', padding: '0.75rem 1.25rem', textAlign: 'center', minWidth: 100 }}>
                                    <div style={{ fontWeight: 700, fontSize: '1.4rem', color: colors[status] || '#555' }}>{count}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#666', textTransform: 'capitalize' }}>{status}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
