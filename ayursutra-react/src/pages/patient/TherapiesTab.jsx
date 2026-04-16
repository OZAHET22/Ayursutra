import { useState, useEffect } from 'react';
import { getTherapies } from '../../services/therapyService';

export default function TherapiesTab({ user }) {
    const [therapies, setTherapies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState('name-asc');
    const [expanded, setExpanded] = useState(null);

    const loadTherapies = async () => {
        try {
            const data = await getTherapies();
            setTherapies(data || []);
        } catch (err) {
            console.error('Failed to load therapies:', err);
        } finally { setLoading(false); }
    };

    useEffect(() => {
        loadTherapies();
        const interval = setInterval(loadTherapies, 15000);
        return () => clearInterval(interval);
    }, []);

    const sorted = [...therapies].sort((a, b) => {
        if (sortBy === 'name-asc') return (a.name || '').localeCompare(b.name || '');
        if (sortBy === 'name-desc') return (b.name || '').localeCompare(a.name || '');
        if (sortBy === 'progress-asc') return (a.progress || 0) - (b.progress || 0);
        if (sortBy === 'progress-desc') return (b.progress || 0) - (a.progress || 0);
        if (sortBy === 'status') return (a.status || '').localeCompare(b.status || '');
        return 0;
    });

    const statusColor = { active: '#4caf50', upcoming: '#ff9800', completed: '#9e9e9e', paused: '#f44336' };

    const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : '—';

    if (loading) return (
        <div className="tab-content active" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
            <div style={{ textAlign: 'center', color: '#2a7d2e' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🌿</div>
                <p>Loading therapies...</p>
            </div>
        </div>
    );

    return (
        <div className="tab-content active">
            <div className="tab-header">
                <h2>My Therapies
                    <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: '#999', fontWeight: 400 }}>
                        🔄 Auto-refreshes every 15s
                    </span>
                </h2>
                <div className="sort-controls">
                    <select className="sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                        <option value="name-asc">Name (A-Z)</option>
                        <option value="name-desc">Name (Z-A)</option>
                        <option value="progress-asc">Progress (Low to High)</option>
                        <option value="progress-desc">Progress (High to Low)</option>
                        <option value="status">Status</option>
                    </select>
                </div>
            </div>

            {sorted.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#777' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💆</div>
                    <p>No therapies assigned yet. Talk to your doctor to start a therapy plan.</p>
                </div>
            )}

            <div className="therapies-grid">
                {sorted.map(t => (
                    <div key={t._id} className="therapy-card">
                        <div className="therapy-header">
                            <div className="therapy-name">{t.name}</div>
                            <span className="status-badge" style={{ background: (statusColor[t.status] || '#999') + '22', color: statusColor[t.status] || '#999' }}>
                                {t.status}
                            </span>
                        </div>
                        <div className="therapy-details">
                            <p>📋 {t.description || 'No description'}</p>
                            <p>📅 {fmt(t.startDate)} → {fmt(t.endDate)}</p>
                            <p>✅ {t.completed}/{t.sessions} sessions</p>
                            {t.doctorName && <p>👨‍⚕️ Dr. {t.doctorName}</p>}
                        </div>
                        <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${t.progress || 0}%` }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#777', marginBottom: '0.75rem' }}>
                            <span>Progress</span>
                            <span>{t.progress || 0}%</span>
                        </div>
                        {t.sessionsList && t.sessionsList.length > 0 && (
                            <button
                                className="dash-btn dash-btn-secondary dash-btn-sm"
                                style={{ width: '100%' }}
                                onClick={() => setExpanded(expanded === t._id ? null : t._id)}
                            >
                                {expanded === t._id ? 'Hide Sessions ↑' : `View Sessions ↓ (${t.sessionsList.length})`}
                            </button>
                        )}
                        {expanded === t._id && t.sessionsList && (
                            <div style={{ marginTop: '0.75rem' }}>
                                {t.sessionsList.map((s, idx) => (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{new Date(s.date).toLocaleDateString('en-IN')}</span>
                                        <span style={{ fontSize: '0.85rem', color: '#777' }}>{s.type || 'Session'}</span>
                                        <span className={`status-badge status-${s.status}`}>{s.status}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
