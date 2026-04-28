import { useState, useEffect, useRef } from 'react';
import Notification from '../components/Notification';
import { getPatients, getDoctors, getPendingDoctors, approveDoctor, revokeDoctor, deleteUser } from '../services/userService';
import * as appointmentService from '../services/appointmentService';
import { deleteAppointment, bulkDeleteAppointments } from '../services/appointmentService';
import { getCentres, addCentre as apiAddCentre, removeCentre as apiRemoveCentre } from '../services/centreService';




const TABS = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'approvals', label: 'Approvals', icon: '🔔', badge: true },
    { id: 'centres', label: 'Centres', icon: '🏛️' },
    { id: 'doctors', label: 'Doctors', icon: '👨‍⚕️' },
    { id: 'patients', label: 'Patients', icon: '🏥' },
    { id: 'appointments', label: 'Appointments', icon: '📅' },
];

export default function AdminPanel({ user, onLogout, showNotification, notification }) {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [doctors, setDoctors] = useState([]);
    const [pendingDoctors, setPendingDoctors] = useState([]);
    const [patients, setPatients] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [centres, setCentres] = useState([]);
    const [centreLoading, setCentreLoading] = useState(false);
    const [centreSubmitting, setCentreSubmitting] = useState(false);
    const [search, setSearch] = useState('');
    const [apptFilter, setApptFilter] = useState('all'); // all | upcoming | today | completed | cancelled
    const [loading, setLoading] = useState(true);
    const [showCentreModal, setShowCentreModal] = useState(false);
    const [centreForm, setCentreForm] = useState({ id: '', name: '' });
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    // Close user menu on outside click
    useEffect(() => {
        const handler = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const loadData = async () => {
        try {
            const [docs, pats, appts, pending, centreList] = await Promise.all([
                getDoctors(),
                getPatients(),
                appointmentService.getAppointments(),
                getPendingDoctors(),
                getCentres(),
            ]);
            setDoctors(docs || []);
            setPatients(pats || []);
            setAppointments(appts?.data || appts || []);
            setPendingDoctors(pending || []);
            setCentres(centreList || []);
        } catch (err) { console.error('Admin load error:', err); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 20000);
        return () => clearInterval(interval);
    }, []);

    const stats = {
        centres: centres.length,
        doctors: doctors.length,
        patients: patients.length,
        appointments: appointments.length,
        pending: pendingDoctors.length,
        active: appointments.filter(a => a.status === 'confirmed' || a.status === 'pending').length,
        completed: appointments.filter(a => a.status === 'completed').length,
    };

    const handleApprove = async (id) => {
        try {
            await approveDoctor(id);
            showNotification('Doctor approved! They are now visible to patients.', 'success');
            loadData();
        } catch { showNotification('Failed to approve doctor.', 'error'); }
    };

    const handleRevoke = async (id, name) => {
        if (!window.confirm(`Hide Dr. ${name} from patients? They can be re-approved anytime.`)) return;
        try {
            await revokeDoctor(id);
            showNotification(`Dr. ${name} hidden from patients. Re-approve anytime.`, 'info');
            loadData();
        } catch { showNotification('Failed to revoke doctor.', 'error'); }
    };

    const handleDeleteUser = async (id) => {
        try {
            await deleteUser(id);
            showNotification('User removed.', 'info');
            loadData();
        } catch { showNotification('Failed to remove user.', 'error'); }
    };

    const handleDeleteAppt = async (id, label) => {
        if (!window.confirm(`Permanently delete "${label}"?`)) return;
        try {
            await deleteAppointment(id);
            showNotification('Appointment deleted.', 'info');
            loadData();
        } catch (err) { showNotification(err.response?.data?.message || 'Failed to delete.', 'error'); }
    };

    const handleBulkDelete = async (status) => {
        const label = status === 'cancelled' ? 'all cancelled' : 'all completed';
        if (!window.confirm(`Permanently delete ${label} appointments? This cannot be undone.`)) return;
        try {
            const res = await bulkDeleteAppointments({ status });
            showNotification(res.message, 'info');
            loadData();
        } catch (err) { showNotification(err.response?.data?.message || 'Bulk delete failed.', 'error'); }
    };

    const addCentre = async (e) => {
        e.preventDefault();
        const trimmedName = (centreForm.name || '').trim();
        if (!trimmedName) return showNotification('Centre name cannot be empty.', 'error');

        // Client-side duplicate check (also enforced on backend)
        const duplicate = centres.find(c => c.name.toLowerCase() === trimmedName.toLowerCase());
        if (duplicate) return showNotification(`"${duplicate.name}" already exists.`, 'error');

        setCentreSubmitting(true);
        try {
            const res = await apiAddCentre(trimmedName);
            if (!res.success) throw new Error(res.message);
            setShowCentreModal(false);
            setCentreForm({ name: '' });
            showNotification(`"${trimmedName}" added successfully!`, 'success');
            loadData(); // refresh from DB
        } catch (err) {
            showNotification(err.response?.data?.message || err.message || 'Failed to add centre.', 'error');
        } finally { setCentreSubmitting(false); }
    };

    const removeCentre = async (id, name) => {
        if (!window.confirm(`Remove "${name}"? This centre will no longer appear in the system.`)) return;
        try {
            await apiRemoveCentre(id);
            showNotification(`"${name}" removed.`, 'info');
            loadData(); // refresh from DB
        } catch (err) {
            showNotification(err.response?.data?.message || 'Failed to remove centre.', 'error');
        }
    };

    const filteredDoctors = doctors.filter(d =>
        (d.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.speciality || '').toLowerCase().includes(search.toLowerCase())
    );
    const filteredPatients = patients.filter(p =>
        (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.condition || '').toLowerCase().includes(search.toLowerCase())
    );
    const filteredAppt = appointments.filter(a =>
        (a.patientName || '').toLowerCase().includes(search.toLowerCase()) ||
        (a.doctorName || '').toLowerCase().includes(search.toLowerCase())
    );
    // Use slug as the matching key (matches User.centreId / User.centre stored during signup)
    const centreMatchKey = (c) => c.slug || c.id || '';

    return (
        <div className="dashboard-page">
            {notification && (
                <Notification message={notification.message} type={notification.type} onClose={() => { }} />
            )}
            <div className="dashboard-container">
                {/* Header */}
                <header className="dashboard-header" style={{ background: '#1b3a4b', borderBottom: '1px solid #243f52' }}>
                    <div className="header-left">
                        <div className="logo">
                            <span className="dash-logo-icon">🌿</span>
                            <span className="dash-logo-text" style={{ color: '#4ade80' }}>Ayursutra Admin</span>
                        </div>
                    </div>
                    <div className="header-right">
                        {/* Avatar dropdown menu */}
                        <div className="user-menu-wrapper" ref={menuRef}>
                            <button
                                className="user-menu-trigger"
                                style={{ borderColor: '#2e526b', background: 'transparent' }}
                                onClick={() => setMenuOpen(prev => !prev)}
                                aria-label="Admin menu"
                            >
                                <div className="user-avatar" style={{ background: 'linear-gradient(135deg, #1e4d6b, #2e6e96)', border: '1.5px solid #3a7ca8' }}>🔑</div>
                                <div className="user-details">
                                    <span className="user-name" style={{ color: '#e2e8f0' }}>{user.name}</span>
                                    <span className="user-role" style={{ color: '#94a3b8' }}>Super Admin</span>
                                </div>
                                <span className={`user-menu-caret${menuOpen ? ' open' : ''}`} style={{ color: '#64748b' }}>▼</span>
                            </button>

                            {menuOpen && (
                                <div className="user-menu-dropdown">
                                    <div className="user-menu-header">
                                        <div className="user-menu-header-name">{user.name}</div>
                                        <div className="user-menu-header-role">Super Admin</div>
                                    </div>
                                    <div className="user-menu-divider" />
                                    <button className="user-menu-item danger" onClick={() => { setMenuOpen(false); onLogout(); }}>
                                        <span>🚪</span> Sign out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <div className="dashboard-layout">
                    {/* Sidebar */}
                    <nav className="sidebar" style={{ background: '#1b3a4b', top: '58px', height: 'calc(100vh - 58px)' }}>
                        <div className="sidebar-menu">
                            {TABS.map(tab => (
                                <button
                                    key={tab.id}
                                    className={`menu-item ${activeTab === tab.id ? 'active' : ''}`}
                                    style={{ color: '#cfe2f3' }}
                                    onClick={() => { setActiveTab(tab.id); setSearch(''); }}
                                >
                                    <span className="menu-icon">{tab.icon}</span>
                                    <span>{tab.label}</span>
                                    {tab.badge && pendingDoctors.length > 0 && (
                                        <span style={{ background: '#f44336', color: '#fff', borderRadius: '50%', fontSize: '0.7rem', fontWeight: 700, padding: '0 6px', marginLeft: '0.25rem', lineHeight: '18px', display: 'inline-block' }}>
                                            {pendingDoctors.length}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </nav>

                    {/* Main Content */}
                    <main className="dashboard-main">
                        {/* ===================== DASHBOARD ===================== */}
                        {activeTab === 'dashboard' && (
                            <div className="tab-content active">
                                <div className="tab-header"><h2>Admin Overview <span style={{ fontSize: '0.8rem', color: '#999', fontWeight: 400 }}>🔄 20s</span></h2></div>
                                {pendingDoctors.length > 0 && (
                                    <div style={{ background: '#fff3e0', border: '1px solid #ff9800', borderRadius: '12px', padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                    <div style={{ fontWeight: 700, color: '#e65100' }}>🔔 {pendingDoctors.length} Doctor{pendingDoctors.length > 1 ? 's' : ''} Hidden / Pending Re-Approval</div>
                                            <div style={{ fontSize: '0.85rem', color: '#777' }}>These doctors were revoked or signed up before auto-approval was enabled.</div>
                                        </div>
                                        <button className="dash-btn dash-btn-primary dash-btn-sm" onClick={() => setActiveTab('approvals')}>Review Now →</button>
                                    </div>
                                )}
                                <div className="admin-stats-grid">
                                    {[
                                        { l: 'Total Centres', v: stats.centres, icon: '🏛️', color: '#1565c0' },
                                        { l: 'Total Doctors', v: stats.doctors, icon: '👨‍⚕️', color: '#2e7d32' },
                                        { l: 'Pending Approval', v: stats.pending, icon: '🔔', color: stats.pending > 0 ? '#f44336' : '#999' },
                                        { l: 'Total Patients', v: stats.patients, icon: '🏥', color: '#e65100' },
                                        { l: 'Total Appointments', v: stats.appointments, icon: '📅', color: '#6a1b9a' },
                                        { l: 'Completed Appts', v: stats.completed, icon: '✅', color: '#4caf50' },
                                    ].map(s => (
                                        <div key={s.l} className="admin-stat-card">
                                            <div style={{ fontSize: '2rem' }}>{s.icon}</div>
                                            <div className="admin-stat-value" style={{ color: s.color }}>{s.v}</div>
                                            <div className="admin-stat-label">{s.l}</div>
                                        </div>
                                    ))}
                                </div>

                                {/* Centres by patient count */}
                                <div className="card">
                                    <h3 style={{ marginBottom: '1.25rem', color: '#1b3a4b' }}>Centres at a Glance</h3>
                                    {centres.map(c => {
                                        const key = centreMatchKey(c);
                                        const cDocs = doctors.filter(d => d.centreId === key || d.centre === key).length;
                                        const cPats = patients.filter(p => p.centreId === key || p.centre === key).length;
                                        const cAppts = appointments.filter(a => a.centre === key).length;
                                        return (
                                            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderBottom: '1px solid #eee', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                <span style={{ fontWeight: 600 }}>{c.name}</span>
                                                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                                    <span className="status-badge status-confirmed">👨‍⚕️ {cDocs} Doctors</span>
                                                    <span className="status-badge status-pending">🏥 {cPats} Patients</span>
                                                    <span className="status-badge status-available">📅 {cAppts} Appointments</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* ===================== APPROVALS ===================== */}
                        {activeTab === 'approvals' && (
                            <div className="tab-content active">
                                <div className="tab-header"><h2>Doctor Visibility Management</h2></div>
                                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.85rem', color: '#1d4ed8' }}>
                                    💡 <strong>Auto-Approve is ON:</strong> All new doctors are immediately visible to patients after signup. This tab shows doctors who have been <strong>revoked</strong> (hidden) and can be re-approved.
                                </div>
                                {pendingDoctors.length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '3rem', color: '#777' }}>
                                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                                        <p>No hidden or pending doctors.</p>
                                        <p style={{ fontSize: '0.85rem' }}>All doctors are currently visible to patients.</p>
                                    </div>
                                )}
                                <div className="patients-grid">
                                    {pendingDoctors.map(d => (
                                        <div key={d._id} className="patient-card" style={{ border: '2px solid #ff9800' }}>
                                            <div className="patient-header">
                                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '2rem' }}>👨‍⚕️</span>
                                                    <div>
                                                        <div className="patient-name">{d.name}</div>
                                                        <div style={{ color: '#777', fontSize: '0.85rem' }}>{d.speciality || 'General Ayurveda'}</div>
                                                    </div>
                                                </div>
                                                <span className="status-badge status-pending">⏳ Pending</span>
                                            </div>
                                            <div style={{ fontSize: '0.9rem', color: '#777', marginBottom: '0.75rem' }}>
                                                <p>📧 {d.email}</p>
                                                <p>📞 {d.phone || 'Not provided'}</p>
                                                <p>🏛️ Centre: {d.centre || 'Not specified'}</p>
                                                <p>🪪 BAMS License: {d.licenseNumber || '—'}</p>
                                                <p>📅 Registered: {new Date(d.createdAt).toLocaleDateString('en-IN')}</p>
                                            </div>
                                            <div style={{ padding: '0.75rem', background: '#fff3e0', borderRadius: '8px', marginBottom: '0.75rem', fontSize: '0.85rem', color: '#e65100' }}>
                                                    ⚠️ This doctor is currently hidden from patients. Approve to make them visible.
                                                </div>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button className="dash-btn dash-btn-success dash-btn-sm" style={{ flex: 1 }} onClick={() => handleApprove(d._id)}>✓ Approve Doctor</button>
                                                <button className="dash-btn dash-btn-danger dash-btn-sm" onClick={() => handleDeleteUser(d._id)}>✗ Reject</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ===================== CENTRES ===================== */}
                        {activeTab === 'centres' && (
                            <div className="tab-content active">
                                <div className="tab-header">
                                    <h2>Manage Centres</h2>
                                    <button className="dash-btn dash-btn-primary" onClick={() => setShowCentreModal(true)}>+ Add Centre</button>
                                </div>
                                <div className="patients-grid">
                                    {centres.map(c => {
                                        const key = centreMatchKey(c);
                                        const cDocs = doctors.filter(d => d.centreId === key || d.centre === key).length;
                                        const cPats = patients.filter(p => p.centreId === key || p.centre === key).length;
                                        return (
                                            <div key={c._id || c.slug} className="patient-card">
                                                <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🏛️</div>
                                                <div className="patient-name">{c.name}</div>
                                                <div style={{ color: '#777', marginBottom: '0.75rem', fontSize: '0.9rem' }}>ID: {c.slug}</div>
                                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                                                    <span className="status-badge status-confirmed">👨‍⚕️ {cDocs} Doctors</span>
                                                    <span className="status-badge status-pending">🏥 {cPats} Patients</span>
                                                </div>
                                                <button className="dash-btn dash-btn-danger dash-btn-sm"
                                                    onClick={() => removeCentre(c._id, c.name)}>
                                                    Remove Centre
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                                {/* Add Centre Modal */}
                                {showCentreModal && (
                                    <div className="dash-modal open">
                                        <div className="dash-modal-content">
                                            <div className="modal-header">
                                                <h3>Add New Centre</h3>
                                                <button className="modal-close" onClick={() => setShowCentreModal(false)}>×</button>
                                            </div>
                                            <form onSubmit={addCentre}>
                                                <div className="dash-form-group">
                                                    <label>Centre Name</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        placeholder="e.g., Surat Healing Centre"
                                                        value={centreForm.name}
                                                        onChange={e => setCentreForm({ name: e.target.value })}
                                                    />
                                                </div>
                                                <button type="submit" className="dash-btn dash-btn-primary" style={{ width: '100%' }} disabled={centreSubmitting}>
                                                    {centreSubmitting ? 'Adding...' : 'Add Centre'}
                                                </button>
                                            </form>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ===================== DOCTORS ===================== */}
                        {activeTab === 'doctors' && (
                            <div className="tab-content active">
                                <div className="tab-header"><h2>Manage Doctors</h2></div>
                                <div className="filters-section" style={{ marginBottom: '1.5rem' }}>
                                    <input type="text" placeholder="Search doctors..." value={search} onChange={e => setSearch(e.target.value)}
                                        style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '8px', fontSize: '0.95rem' }} />
                                </div>
                                {filteredDoctors.length === 0 && <p style={{ color: '#777', padding: '1rem' }}>No approved doctors found.</p>}
                                <div className="patients-grid">
                                    {filteredDoctors.map(d => {
                                        const centreName = centres.find(c => c.id === d.centreId)?.name || d.centre || 'No Centre';
                                        return (
                                            <div key={d._id} className="patient-card">
                                                <div className="patient-header">
                                                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                                        <span style={{ fontSize: '2rem' }}>{d.avatar || '👨‍⚕️'}</span>
                                                        <div>
                                                            <div className="patient-name">{d.name}</div>
                                                            <div style={{ color: '#777', fontSize: '0.85rem' }}>{d.speciality || 'General'}</div>
                                                        </div>
                                                    </div>
                                                    <span className="status-badge status-confirmed">✅ Approved</span>
                                                </div>
                                                <div style={{ fontSize: '0.9rem', color: '#777', marginBottom: '0.75rem' }}>
                                                    <p>📧 {d.email}</p>
                                                    <p>📞 {d.phone || '—'}</p>
                                                    <p>🏛️ {centreName}</p>
                                                    <p>🪪 BAMS License: {d.licenseNumber || '—'}</p>
                                                    <p>📅 Joined: {new Date(d.createdAt).toLocaleDateString('en-IN')}</p>
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                    <button className="dash-btn dash-btn-danger dash-btn-sm" onClick={() => handleDeleteUser(d._id)}>🗑 Remove</button>
                                                    <button className="dash-btn dash-btn-secondary dash-btn-sm" onClick={() => handleRevoke(d._id, d.name)} title="Hide from patients without deleting">🔒 Revoke</button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* ===================== PATIENTS ===================== */}
                        {activeTab === 'patients' && (
                            <div className="tab-content active">
                                <div className="tab-header"><h2>All Patients</h2></div>
                                <div className="filters-section" style={{ marginBottom: '1.5rem' }}>
                                    <input type="text" placeholder="Search patients..." value={search} onChange={e => setSearch(e.target.value)}
                                        style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '8px', fontSize: '0.95rem' }} />
                                </div>
                                {filteredPatients.length === 0 && <p style={{ color: '#777', padding: '1rem' }}>No patients found.</p>}
                                <div className="patients-grid">
                                    {filteredPatients.map(p => {
                                        const centreName = centres.find(c => c.id === p.centreId)?.name || p.centre || '—';
                                        return (
                                            <div key={p._id} className="patient-card">
                                                <div className="patient-header">
                                                    <div className="patient-name">{p.name}</div>
                                                    <span className="status-badge status-confirmed">Active</span>
                                                </div>
                                                <div style={{ fontSize: '0.9rem', color: '#777', marginBottom: '0.75rem' }}>
                                                    <p>👤 Age {p.age || '—'} · {p.gender || '—'}</p>
                                                    <p>📞 {p.phone || '—'}</p>
                                                    <p>📋 {p.condition || 'No condition'}</p>
                                                    <p>🏛️ {centreName}</p>
                                                    <p>📅 Joined {new Date(p.createdAt).toLocaleDateString('en-IN')}</p>
                                                </div>
                                                <button className="dash-btn dash-btn-danger dash-btn-sm" onClick={() => handleDeleteUser(p._id)}>Remove</button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* ===================== APPOINTMENTS ===================== */}
                        {activeTab === 'appointments' && (
                            <div className="tab-content active">
                                <div className="tab-header">
                                    <h2>All Appointments</h2>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button className="dash-btn dash-btn-secondary dash-btn-sm"
                                            onClick={() => handleBulkDelete('cancelled')}
                                            title="Delete all cancelled appointments">
                                            🗑 Clear Cancelled
                                        </button>
                                        <button className="dash-btn dash-btn-secondary dash-btn-sm"
                                            onClick={() => handleBulkDelete('completed')}
                                            title="Delete all completed appointments">
                                            🗑 Clear Completed
                                        </button>
                                    </div>
                                </div>

                                {/* Search + Status Filters */}
                                <div style={{ marginBottom: '1.25rem' }}>
                                    <input type="text" placeholder="Search by patient or doctor name..."
                                        value={search} onChange={e => setSearch(e.target.value)}
                                        style={{ width: '100%', padding: '0.75rem', border: '1px solid #ddd', borderRadius: '8px', fontSize: '0.95rem', marginBottom: '0.75rem', boxSizing: 'border-box' }} />
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {['all', 'upcoming', 'today', 'completed', 'cancelled'].map(f => (
                                            <button key={f}
                                                onClick={() => setApptFilter(f)}
                                                style={{
                                                    padding: '5px 14px', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', border: '1px solid #ddd',
                                                    background: apptFilter === f ? '#1b3a4b' : '#f5f5f5',
                                                    color: apptFilter === f ? '#fff' : '#555',
                                                }}>
                                                {f === 'all' ? `All (${appointments.length})` :
                                                 f === 'today' ? 'Today' :
                                                 f === 'upcoming' ? 'Upcoming' :
                                                 f.charAt(0).toUpperCase() + f.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="appointments-list">
                                    {(() => {
                                        const now = new Date();
                                        const todayStr = now.toDateString();
                                        let list = appointments.filter(a =>
                                            (a.patientName || '').toLowerCase().includes(search.toLowerCase()) ||
                                            (a.doctorName || '').toLowerCase().includes(search.toLowerCase())
                                        );
                                        if (apptFilter === 'today') list = list.filter(a => new Date(a.date).toDateString() === todayStr);
                                        else if (apptFilter === 'upcoming') list = list.filter(a => new Date(a.date) > now && !['completed','cancelled'].includes(a.status));
                                        else if (apptFilter === 'completed') list = list.filter(a => a.status === 'completed');
                                        else if (apptFilter === 'cancelled') list = list.filter(a => a.status === 'cancelled');
                                        // Sort: upcoming first, then past
                                        list = list.sort((a, b) => new Date(b.date) - new Date(a.date));

                                        if (list.length === 0) return <p style={{ padding: '1.5rem', color: '#777' }}>No appointments found.</p>;

                                        return list.map(a => {
                                            const centreKey = a.centre || '';
                                            const centreName = centres.find(c => (c.slug || c.id) === centreKey)?.name || centreKey || '—';
                                            const isPast = new Date(a.date) < now;
                                            return (
                                                <div key={a._id} className="appointment-item"
                                                    style={{ opacity: (a.status === 'cancelled' || (isPast && a.status !== 'completed')) ? 0.7 : 1 }}>
                                                    <div className="appointment-details">
                                                        <h4>{a.patientName} → {a.doctorName}</h4>
                                                        <p>🔬 {a.type} · {a.duration} min</p>
                                                        <p>📅 {new Date(a.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                                                            {isPast && <span style={{ marginLeft: '6px', fontSize: '0.75rem', color: '#f44336', fontWeight: 600 }}>(Past)</span>}
                                                        </p>
                                                        <p>🏛️ {centreName}</p>
                                                    </div>
                                                    <div className="appointment-actions" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                                                        <span className={`status-badge status-${a.status}`}>{a.status}</span>
                                                        <button
                                                            className="dash-btn dash-btn-danger dash-btn-sm"
                                                            onClick={() => handleDeleteAppt(a._id, `${a.patientName} → ${a.doctorName}`)}
                                                            title="Permanently delete this appointment">
                                                            🗑 Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            </div>
                        )}
                    </main>
                </div>

                {/* Footer */}
                <footer style={{ background: '#1b3a4b', color: '#cfe2f3', padding: '2rem 2rem 1.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '2rem', marginBottom: '1.5rem' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
                                <span style={{ fontSize: '1.6rem' }}>🌿</span>
                                <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#4caf50' }}>Panchakarma centre</span>
                            </div>
                            <p style={{ color: '#aabbc8', fontSize: '0.9rem' }}>Modern management for traditional healing</p>
                        </div>
                        <div>
                            <h4 style={{ color: '#fff', marginBottom: '0.75rem', fontWeight: 600 }}>Platform</h4>
                            {[['Patient Login', null], ['Doctor Login', null], ['Sign Up', null]].map(([label]) => (
                                <div key={label} style={{ color: '#aabbc8', marginBottom: '0.4rem', fontSize: '0.9rem', cursor: 'pointer' }}
                                    onMouseEnter={e => e.target.style.color = '#fff'}
                                    onMouseLeave={e => e.target.style.color = '#aabbc8'}>
                                    {label}
                                </div>
                            ))}
                        </div>
                        <div>
                            <h4 style={{ color: '#fff', marginBottom: '0.75rem', fontWeight: 600 }}>Support</h4>
                            {['Help Center', 'Contact Us', 'Documentation'].map(label => (
                                <div key={label} style={{ color: '#aabbc8', marginBottom: '0.4rem', fontSize: '0.9rem', cursor: 'pointer' }}
                                    onMouseEnter={e => e.target.style.color = '#fff'}
                                    onMouseLeave={e => e.target.style.color = '#aabbc8'}>
                                    {label}
                                </div>
                            ))}
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}
