import { useState, useEffect, useMemo, useCallback } from 'react';
import { getMyPatients } from '../../services/userService';

export default function PatientsTab({ user, showNotification }) {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [showHealth, setShowHealth] = useState(null);

    const loadPatients = useCallback(async () => {
        try {
            const data = await getMyPatients();
            setPatients(data || []);
        } catch (err) { console.error('Failed to load patients:', err); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => {
        loadPatients();
        const interval = setInterval(loadPatients, 20000);
        return () => clearInterval(interval);
    }, [loadPatients]);

    const filtered = useMemo(() => {
        let list = patients.filter(p =>
            (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
            (p.condition || '').toLowerCase().includes(search.toLowerCase())
        );
        if (filter === 'active') {
            const cutoff = new Date(); cutoff.setMonth(cutoff.getMonth() - 3);
            list = list.filter(p => new Date(p.createdAt) >= cutoff);
        } else if (filter === 'new') {
            const cutoff = new Date(); cutoff.setMonth(cutoff.getMonth() - 1);
            list = list.filter(p => new Date(p.createdAt) >= cutoff);
        }
        return list;
    }, [patients, filter, search]);

    const statusColor = { active: '#4caf50', completed: '#9e9e9e', new: '#1976d2' };

    if (loading) return (
        <div className="tab-content active" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
            <div style={{ textAlign: 'center', color: '#2a7d2e' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👥</div>
                <p>Loading patients...</p>
            </div>
        </div>
    );

    const newThisMonth = patients.filter(p => {
        const cutoff = new Date(); cutoff.setMonth(cutoff.getMonth() - 1);
        return new Date(p.createdAt) >= cutoff;
    }).length;

    return (
        <div className="tab-content active">
            <div className="tab-header">
                <h2>My Patients
                    <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: '#999', fontWeight: 400 }}>🔄 20s</span>
                </h2>
            </div>

            <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="stat-card"><div className="stat-content"><h3>My Patients</h3><p className="stat-value">{patients.length}</p></div><div className="stat-icon">👥</div></div>
                <div className="stat-card"><div className="stat-content"><h3>New This Month</h3><p className="stat-value" style={{ color: '#2a7d2e' }}>{newThisMonth}</p></div><div className="stat-icon">🆕</div></div>
            </div>

            {showHealth && (
                <div className="card" style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ color: '#2a7d2e' }}>Health Profile — {showHealth.name}</h3>
                        <button className="dash-btn dash-btn-secondary dash-btn-sm" onClick={() => setShowHealth(null)}>Close ×</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: '1rem', marginBottom: '1rem' }}>
                        {[
                            { l: 'Age', v: showHealth.age || '—' },
                            { l: 'Gender', v: showHealth.gender || '—' },
                            { l: 'Condition', v: showHealth.condition || '—' },
                            { l: 'Phone', v: showHealth.phone || '—' },
                            { l: 'Joined', v: new Date(showHealth.createdAt).toLocaleDateString('en-IN') },
                        ].map(m => (
                            <div key={m.l} style={{ textAlign: 'center', padding: '1rem', background: '#f0f0f0', borderRadius: '8px' }}>
                                <div style={{ fontSize: '1rem', fontWeight: 700, color: '#2a7d2e' }}>{m.v}</div>
                                <div style={{ fontSize: '0.8rem', color: '#777' }}>{m.l}</div>
                            </div>
                        ))}
                    </div>
                    {showHealth.dosha && (
                        <>
                            <h4 style={{ marginBottom: '0.75rem' }}>Dosha Analysis</h4>
                            <div className="dosha-analysis" style={{ boxShadow: 'none', padding: '0.5rem 0' }}>
                                <div className="dosha-bars">
                                    {[['Vata', showHealth.dosha.vata || 33, 'dosha-vata'], ['Pitta', showHealth.dosha.pitta || 33, 'dosha-pitta'], ['Kapha', showHealth.dosha.kapha || 34, 'dosha-kapha']].map(([name, val, cls]) => (
                                        <div key={name} className="dosha-bar">
                                            <span className="dosha-name">{name}</span>
                                            <div className="dosha-progress"><div className={`dosha-fill ${cls}`} style={{ width: `${val}%` }} /></div>
                                            <span style={{ fontSize: '0.9rem', fontWeight: 600, minWidth: '40px' }}>{val}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            <div className="filters-section">
                <div className="filters-row">
                    <div className="search-box">
                        <input type="text" placeholder="Search patients..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <div className="filter-options">
                        {['all', 'active', 'new'].map(f => (
                            <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                                {f === 'new' ? 'New This Month' : f === 'active' ? 'Active (3 months)' : 'All'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="patients-grid">
                {filtered.length === 0 && (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: '#777' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
                        <p>No patients found.</p>
                    </div>
                )}
                {filtered.map(p => (
                    <div key={p._id} className="patient-card">
                        <div className="patient-header">
                            <div className="patient-name">{p.name}</div>
                            <span className="status-badge" style={{ background: '#4caf5022', color: '#4caf50' }}>Active</span>
                        </div>
                        <div className="patient-details">
                            <p>👤 Age: {p.age || '—'} · {p.gender || '—'}</p>
                            <p>📋 {p.condition || 'No condition specified'}</p>
                            <p>📞 {p.phone || 'No phone'}</p>
                            <p>📅 Joined: {new Date(p.createdAt).toLocaleDateString('en-IN')}</p>
                        </div>
                        <button className="dash-btn dash-btn-secondary dash-btn-sm" style={{ width: '100%', marginTop: '0.75rem' }} onClick={() => setShowHealth(p)}>
                            View Health Profile
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
