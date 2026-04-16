import { useState, useEffect } from 'react';
import * as documentService from '../../services/documentService';

export default function DocumentsTab({ user, showNotification }) {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [docForm, setDocForm] = useState({ name: '', type: '', date: new Date().toISOString().split('T')[0] });

    const icons = { pdf: '📄', word: '📝', image: '🖼️', default: '📁' };

    const loadDocuments = async () => {
        try {
            const data = await documentService.getDocuments();
            setDocuments(data || []);
        } catch (err) {
            console.error('Failed to load documents:', err);
        } finally { setLoading(false); }
    };

    useEffect(() => {
        loadDocuments();
        const interval = setInterval(loadDocuments, 15000);
        return () => clearInterval(interval);
    }, []);

    const submitUpload = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const fileType = docForm.type === 'lab-report' ? 'pdf' : 'pdf';
            await documentService.uploadDocument({
                name: docForm.name,
                type: docForm.type,
                date: docForm.date,
                fileType,
                reviewed: false,
            });
            setShowModal(false);
            setDocForm({ name: '', type: '', date: new Date().toISOString().split('T')[0] });
            showNotification('Document uploaded successfully! Your doctor will be notified.', 'success');
            loadDocuments();
        } catch (err) {
            showNotification(err.response?.data?.message || 'Upload failed.', 'error');
        } finally { setSubmitting(false); }
    };

    const deleteDoc = async (id) => {
        try {
            await documentService.deleteDocument(id);
            showNotification('Document deleted.', 'info');
            loadDocuments();
        } catch { showNotification('Failed to delete document.', 'error'); }
    };

    if (loading) return (
        <div className="tab-content active" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
            <div style={{ textAlign: 'center', color: '#2a7d2e' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📁</div>
                <p>Loading documents...</p>
            </div>
        </div>
    );

    return (
        <div className="tab-content active">
            <div className="tab-header">
                <h2>Medical Documents
                    <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: '#999', fontWeight: 400 }}>
                        🔄 Auto-refreshes every 15s
                    </span>
                </h2>
                <button className="dash-btn dash-btn-primary" onClick={() => setShowModal(true)}>
                    ↑ Upload Document
                </button>
            </div>

            <div className="documents-grid">
                {documents.map(doc => (
                    <div key={doc._id} className="document-card">
                        <div className="document-icon">{icons[doc.fileType] || icons.default}</div>
                        <div className="document-name">{doc.name}</div>
                        <div className="document-date">{new Date(doc.date).toLocaleDateString('en-IN')}</div>
                        <div style={{ marginBottom: '0.5rem' }}>
                            <span className="status-badge" style={{ fontSize: '0.75rem', display: 'inline-block', marginBottom: '0.25rem', background: doc.reviewed ? '#4caf5022' : '#ff980022', color: doc.reviewed ? '#4caf50' : '#ff9800' }}>
                                {doc.reviewed ? '✅ Reviewed by Doctor' : '⏳ Awaiting Review'}
                            </span>
                            {doc.reviewedBy && <div style={{ fontSize: '0.75rem', color: '#777' }}>by Dr. {doc.reviewedBy}</div>}
                        </div>
                        <div className="document-actions">
                            <button className="dash-btn dash-btn-danger dash-btn-sm" onClick={() => deleteDoc(doc._id)}>Delete</button>
                        </div>
                    </div>
                ))}
                {documents.length === 0 && (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: '#777' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📁</div>
                        <p>No documents uploaded yet.</p>
                        <p style={{ fontSize: '0.85rem' }}>Upload your medical records, lab reports, or prescriptions for your doctor to review.</p>
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            {showModal && (
                <div className="dash-modal open">
                    <div className="dash-modal-content">
                        <div className="modal-header">
                            <h3>Upload Document</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={submitUpload}>
                            <div className="dash-form-group">
                                <label>Document Name</label>
                                <input type="text" required placeholder="e.g., Lab Report, Prescription..." value={docForm.name} onChange={e => setDocForm({ ...docForm, name: e.target.value })} />
                            </div>
                            <div className="dash-form-group">
                                <label>Document Type</label>
                                <select required value={docForm.type} onChange={e => setDocForm({ ...docForm, type: e.target.value })}>
                                    <option value="">Select Type</option>
                                    <option value="prescription">Prescription</option>
                                    <option value="lab-report">Lab Report</option>
                                    <option value="therapy-plan">Therapy Plan</option>
                                    <option value="progress-note">Progress Note</option>
                                    <option value="medical-history">Medical History</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div className="dash-form-group">
                                <label>Document Date</label>
                                <input type="date" required value={docForm.date} onChange={e => setDocForm({ ...docForm, date: e.target.value })} />
                            </div>
                            <div className="dash-form-group">
                                <label>Select File (PDF, DOC, JPG, PNG)</label>
                                <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                                <small style={{ color: '#777', marginTop: '0.25rem', display: 'block' }}>Maximum file size: 10MB</small>
                            </div>
                            <div style={{ padding: '0.75rem', background: '#f0f9f0', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem', color: '#2a7d2e' }}>
                                📌 Your document will be available for your doctor to review. You'll see a "Reviewed" badge once reviewed.
                            </div>
                            <button type="submit" className="dash-btn dash-btn-primary" style={{ width: '100%' }} disabled={submitting}>
                                {submitting ? 'Uploading...' : 'Upload Document'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
