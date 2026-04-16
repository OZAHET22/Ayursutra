import { useState, useEffect } from 'react';
import * as documentService from '../../services/documentService';
import { getMyPatients } from '../../services/userService';

const TYPE_LABELS = {
    'prescription': 'Prescription',
    'lab-report':   'Lab Report',
    'therapy-plan': 'Therapy Plan',
    'progress-note':'Progress Note',
    'medical-history':'Medical History',
    'other':        'Other',
};

const FILE_ICONS = { pdf: '📄', word: '📝', image: '🖼️', default: '📁' };

function canOpenFile(doc) {
    return doc.fileUrl && doc.fileUrl.trim() !== '';
}

function openFile(doc) {
    if (!canOpenFile(doc)) return;
    // data URI — open inline
    if (doc.fileUrl.startsWith('data:')) {
        const w = window.open();
        if (doc.fileType === 'image') {
            w.document.write(`<img src="${doc.fileUrl}" style="max-width:100%;"/>`);
        } else {
            // PDF data URI — embed
            w.document.write(`<iframe src="${doc.fileUrl}" style="width:100%;height:100vh;border:none;"></iframe>`);
        }
    } else {
        // External URL
        window.open(doc.fileUrl, '_blank', 'noopener,noreferrer');
    }
}

export default function PatientFilesTab({ user, showNotification }) {
    const [documents, setDocuments]           = useState([]);
    const [patients, setPatients]             = useState([]);
    const [selectedPatient, setSelectedPatient] = useState('');
    const [loading, setLoading]               = useState(true);
    const [reviewNotes, setReviewNotes]       = useState({});
    const [typeFilter, setTypeFilter]         = useState('all');
    const [search, setSearch]                 = useState('');

    const loadData = async () => {
        try {
            const pats = await getMyPatients();
            setPatients(pats || []);
            const docs = await documentService.getDocuments(selectedPatient || undefined);
            setDocuments(docs || []);
        } catch (err) {
            console.error('Failed to load files:', err);
            showNotification && showNotification('Failed to load patient files.', 'error');
        } finally { setLoading(false); }
    };

    useEffect(() => {
        setLoading(true);
        loadData();
        const interval = setInterval(loadData, 15000);
        return () => clearInterval(interval);
    }, [selectedPatient]);

    const markReviewed = async (id) => {
        try {
            await documentService.reviewDocument(id, reviewNotes[id] || '');
            showNotification('Document marked as reviewed!', 'success');
            loadData();
        } catch { showNotification('Failed to review document.', 'error'); }
    };

    // Filter
    const filtered = documents.filter(doc => {
        const matchType   = typeFilter === 'all' || doc.type === typeFilter;
        const matchSearch = !search || doc.name.toLowerCase().includes(search.toLowerCase()) ||
                            (doc.patientName || '').toLowerCase().includes(search.toLowerCase());
        return matchType && matchSearch;
    });

    if (loading) return (
        <div className="tab-content active" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
            <div style={{ textAlign: 'center', color: '#2a7d2e' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📁</div>
                <p>Loading patient files...</p>
            </div>
        </div>
    );

    return (
        <div className="tab-content active">
            <div className="tab-header">
                <h2>Patient Files
                    <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: '#999', fontWeight: 400 }}>🔄 15s</span>
                </h2>
                <span style={{ fontSize: '0.85rem', color: '#6b7280', alignSelf: 'center' }}>
                    {filtered.length} document(s)
                </span>
            </div>

            {/* Controls */}
            <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
                    {/* Patient filter */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <label style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap' }}>Patient:</label>
                        <select
                            style={{ padding: '0.4rem 0.6rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.88rem' }}
                            value={selectedPatient}
                            onChange={e => setSelectedPatient(e.target.value)}
                        >
                            <option value="">All Patients</option>
                            {patients.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                        </select>
                    </div>

                    {/* Type filter chips */}
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {['all', 'prescription', 'lab-report', 'therapy-plan', 'progress-note', 'other'].map(t => (
                            <button key={t} onClick={() => setTypeFilter(t)}
                                style={{ padding: '0.25rem 0.7rem', borderRadius: '20px', border: `1px solid ${typeFilter === t ? '#2a7d2e' : '#ddd'}`, background: typeFilter === t ? '#2a7d2e' : '#fff', color: typeFilter === t ? '#fff' : '#555', fontSize: '0.78rem', cursor: 'pointer' }}>
                                {t === 'all' ? 'All Types' : TYPE_LABELS[t] || t}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <input
                        placeholder="Search by name or patient..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ marginLeft: 'auto', padding: '0.4rem 0.7rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.88rem', minWidth: 180 }}
                    />
                </div>
            </div>

            {filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#777' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📂</div>
                    <p style={{ fontWeight: 600 }}>No documents found.</p>
                    <p style={{ fontSize: '0.85rem' }}>Documents uploaded by patients will appear here for your review.</p>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {filtered.map(doc => (
                    <div key={doc._id} className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

                        {/* Header */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                            <div style={{ fontSize: '2rem', lineHeight: 1 }}>{FILE_ICONS[doc.fileType] || FILE_ICONS.default}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 700, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.name}</div>
                                <div style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: '2px' }}>
                                    {TYPE_LABELS[doc.type] || doc.type} · {doc.fileType?.toUpperCase()}
                                </div>
                                <div style={{ fontSize: '0.82rem', color: '#6b7280' }}>
                                    📅 {new Date(doc.date).toLocaleDateString('en-IN')} · 👤 {doc.patientName}
                                </div>
                                {doc.description && (
                                    <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '3px', fontStyle: 'italic' }}>
                                        "{doc.description}"
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Open File button */}
                        {canOpenFile(doc) ? (
                            <button
                                onClick={() => openFile(doc)}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.45rem', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', transition: 'background 0.15s' }}
                                onMouseEnter={e => e.currentTarget.style.background = '#dbeafe'}
                                onMouseLeave={e => e.currentTarget.style.background = '#eff6ff'}
                            >
                                📂 Open / View File
                            </button>
                        ) : (
                            <div style={{ padding: '0.4rem', background: '#f9fafb', border: '1px dashed #d1d5db', borderRadius: '8px', fontSize: '0.78rem', color: '#9ca3af', textAlign: 'center' }}>
                                No file attached · Patient can re-upload with a file link
                            </div>
                        )}

                        {/* Review section */}
                        {doc.reviewed ? (
                            <div style={{ padding: '0.5rem 0.75rem', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                                <div style={{ color: '#16a34a', fontWeight: 600, fontSize: '0.88rem' }}>✅ Reviewed by {doc.reviewedBy || 'Doctor'}</div>
                                {doc.notes && <div style={{ fontSize: '0.8rem', color: '#555', marginTop: '3px' }}>Notes: {doc.notes}</div>}
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                <div style={{ padding: '0.3rem 0.65rem', background: '#fff7ed', borderRadius: '6px', color: '#ea580c', fontSize: '0.82rem', fontWeight: 500 }}>
                                    ⏳ Pending Review
                                </div>
                                <textarea
                                    placeholder="Add review notes (optional)..."
                                    rows={2}
                                    style={{ width: '100%', padding: '0.45rem', borderRadius: '6px', border: '1px solid #e5e7eb', fontSize: '0.85rem', resize: 'vertical', boxSizing: 'border-box' }}
                                    value={reviewNotes[doc._id] || ''}
                                    onChange={e => setReviewNotes(prev => ({ ...prev, [doc._id]: e.target.value }))}
                                />
                                <button
                                    className="dash-btn dash-btn-success dash-btn-sm"
                                    style={{ width: '100%' }}
                                    onClick={() => markReviewed(doc._id)}
                                >
                                    ✓ Mark as Reviewed
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
