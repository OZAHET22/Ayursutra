import { useState, useEffect } from 'react';
import { getTrackingTherapies } from '../../services/trackingService';

const HEALTH_PARAMS = [
    { label: 'Energy Level', key: 'energy', icon: '⚡' },
    { label: 'Sleep Quality', key: 'sleep', icon: '🌙' },
    { label: 'Stress Level', key: 'stress', icon: '🧘', inverse: true },
    { label: 'Digestion', key: 'digestion', icon: '🌿' },
];

export default function ProgressTab({ user }) {
    const [therapies, setTherapies] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await getTrackingTherapies();
                setTherapies(data || []);
            } catch { }
            finally { setLoading(false); }
        };
        load();
        const iv = setInterval(load, 30000);
        return () => clearInterval(iv);
    }, []);

    if (loading) return (
        <div className="tab-content active" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
            <div style={{ textAlign: 'center', color: '#2a7d2e' }}><div style={{ fontSize: '2rem' }}>📈</div><p>Loading progress...</p></div>
        </div>
    );

    const activeTherapies = therapies.filter(t => t.status === 'active' || t.status === 'completed');
    const allMilestones = therapies.flatMap(t => (t.milestones || []).map(m => ({ ...m, therapyName: t.name })));
    const totalSessions = therapies.reduce((sum, t) => sum + (t.sessions || 0), 0);
    const completedSessions = therapies.reduce((sum, t) => sum + (t.completed || 0), 0);
    const avgProgress = therapies.length > 0 ? Math.round(therapies.reduce((sum, t) => sum + (t.progress || 0), 0) / therapies.length) : 0;

    return (
        <div className="tab-content active">
            <div className="tab-header">
                <h2>Recovery Progress</h2>
                <span style={{ fontSize: '0.8rem', color: '#999' }}>🔄 30s auto-refresh</span>
            </div>

            {/* Overall Stats */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {[
                    { label: 'Overall Progress', value: `${avgProgress}%`, color: '#2a7d2e', bg: '#e8f5e9', icon: '📈' },
                    { label: 'Sessions Completed', value: `${completedSessions}/${totalSessions}`, color: '#1976d2', bg: '#e3f2fd', icon: '✅' },
                    { label: 'Milestones Achieved', value: allMilestones.length, color: '#ff9800', bg: '#fff3e0', icon: '🏆' },
                    { label: 'Active Therapies', value: therapies.filter(t => t.status === 'active').length, color: '#9c27b0', bg: '#f3e5f5', icon: '💆' },
                ].map(s => (
                    <div key={s.label} style={{ background: s.bg, borderRadius: '14px', padding: '1rem 1.5rem', flex: 1, minWidth: '130px' }}>
                        <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{s.icon}</div>
                        <div style={{ fontWeight: 700, fontSize: '1.4rem', color: s.color }}>{s.value}</div>
                        <div style={{ color: '#666', fontSize: '0.82rem' }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Therapy Progress — Live from API */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ color: '#2a7d2e', marginBottom: '1rem' }}>Therapy Progress Overview</h3>
                {activeTherapies.length === 0 && <p style={{ color: '#777' }}>No active therapies. Your doctor will assign them.</p>}
                {activeTherapies.map(therapy => (
                    <div key={therapy._id} style={{ marginBottom: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', alignItems: 'center' }}>
                            <div>
                                <span style={{ fontWeight: 600 }}>{therapy.name}</span>
                                <span style={{ color: '#888', fontSize: '0.8rem', marginLeft: '0.5rem' }}>({therapy.type})</span>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <span style={{ color: '#555', fontSize: '0.82rem' }}>{therapy.completed}/{therapy.sessions} sessions</span>
                                <span style={{ color: therapy.progress >= 80 ? '#2a7d2e' : therapy.progress >= 50 ? '#ff9800' : '#f44336', fontWeight: 700 }}>{therapy.progress}%</span>
                            </div>
                        </div>
                        <div style={{ height: '10px', background: '#e0e0e0', borderRadius: '5px', overflow: 'hidden' }}>
                            <div style={{
                                height: '10px', borderRadius: '5px', transition: 'width 0.8s ease',
                                background: therapy.progress >= 80 ? 'linear-gradient(90deg,#2a7d2e,#66bb6a)' : therapy.progress >= 50 ? 'linear-gradient(90deg,#ff9800,#ffb74d)' : 'linear-gradient(90deg,#f44336,#ef5350)',
                                width: `${therapy.progress}%`,
                            }} />
                        </div>
                        {therapy.practitionerNotes && (
                            <div style={{ fontSize: '0.78rem', color: '#888', marginTop: '4px', fontStyle: 'italic' }}>
                                📋 Doctor's note: {therapy.practitionerNotes.substring(0, 100)}{therapy.practitionerNotes.length > 100 ? '...' : ''}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Milestones — Live from API */}
            {allMilestones.length > 0 && (
                <div className="milestones-card">
                    <h3>🏆 Milestones Achieved</h3>
                    <div className="milestones-list">
                        {allMilestones.map((m, i) => (
                            <div key={i} className="milestone-item">
                                <div className="milestone-icon">{m.icon || '🏆'}</div>
                                <div className="milestone-content">
                                    <h4>{m.name}</h4>
                                    <p>{m.description || m.therapyName}</p>
                                </div>
                                <div className="milestone-date">{new Date(m.achievedAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {therapies.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#aaa' }}>
                    <div style={{ fontSize: '3rem' }}>🌱</div>
                    <p style={{ marginTop: '0.75rem' }}>Your therapy journey is about to begin. Your doctor will set up your treatment plan.</p>
                </div>
            )}
        </div>
    );
}
