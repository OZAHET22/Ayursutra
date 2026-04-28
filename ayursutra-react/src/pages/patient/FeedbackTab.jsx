import { useState, useEffect, useCallback } from 'react';
import * as feedbackService from '../../services/feedbackService';
import API from '../../services/api';

// Helper: render static star display
function StarDisplay({ rating, size = '1rem' }) {
    const full = Math.floor(rating);
    const half = rating - full >= 0.5;
    return (
        <span style={{ display: 'inline-flex', gap: '1px' }}>
            {[1,2,3,4,5].map(i => (
                <span key={i} style={{
                    fontSize: size,
                    color: i <= full ? '#f59e0b' : (i === full + 1 && half) ? '#f59e0b' : '#d1d5db',
                    opacity: (i === full + 1 && half) ? 0.55 : 1,
                }}>★</span>
            ))}
        </span>
    );
}

export default function FeedbackTab({ user, showNotification }) {
    const [feedbacks, setFeedbacks] = useState([]);
    const [assignedDoctor, setAssignedDoctor] = useState(null);
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState('date-desc');
    const [selectedRating, setSelectedRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [content, setContent] = useState('');
    const [doctorId, setDoctorId] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [doctorPublicRating, setDoctorPublicRating] = useState(null); // live rating from public endpoint
    
    // Edit/Delete states
    const [editingId, setEditingId] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [editRating, setEditRating] = useState(0);
    const [editHoverRating, setEditHoverRating] = useState(0);
    const [deletingId, setDeletingId] = useState(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            // Load feedback list
            const response = await feedbackService.getFeedback(1, 100);
            setFeedbacks(response?.data || []);

            // Try to load the assigned doctor from preferredDoctor field
            const prefDocId = user?.preferredDoctor;
            if (prefDocId) {
                try {
                    const res = await API.get(`/users/${prefDocId}`);
                    const doc = res.data?.data || null;
                    if (doc) {
                        setAssignedDoctor(doc);
                        setDoctorId(doc._id);
                        // Load the doctor's public rating summary
                        try {
                            const ratingData = await feedbackService.getDoctorPublicRating(doc._id);
                            setDoctorPublicRating(ratingData);
                        } catch { setDoctorPublicRating(null); }
                        return;
                    }
                } catch (err) {
                    console.error('Failed to load assigned doctor:', err);
                    setAssignedDoctor(null);
                }
            }

            // No assigned doctor — load all approved doctors so patient can pick
            try {
                const res = await API.get('/users/doctors');
                const allDocs = res.data?.data || [];
                setDoctors(allDocs);
                if (allDocs.length === 1) {
                    setAssignedDoctor(allDocs[0]);
                    setDoctorId(allDocs[0]._id);
                }
            } catch (err) {
                console.error('Failed to load doctors:', err);
                setDoctors([]);
            }
        } catch (err) {
            console.error('Failed to load feedback:', err);
            showNotification('Failed to load feedback. Please refresh.', 'error');
        } finally {
            setLoading(false);
        }
    }, [user?.preferredDoctor, showNotification]);

    useEffect(() => {
        loadData();
        const interval = setInterval(async () => {
            try {
                const response = await feedbackService.getFeedback(1, 100);
                setFeedbacks(response?.data || []);
            } catch (err) {
                console.error('Auto-refresh failed:', err);
            }
        }, 15000);
        return () => clearInterval(interval);
    }, [loadData]);

    const sorted = [...feedbacks].sort((a, b) => {
        if (sortBy === 'date-desc') return new Date(b.createdAt) - new Date(a.createdAt);
        if (sortBy === 'date-asc') return new Date(a.createdAt) - new Date(b.createdAt);
        if (sortBy === 'rating-desc') return b.rating - a.rating;
        if (sortBy === 'rating-asc') return a.rating - b.rating;
        return 0;
    });

    const submitFeedback = async (e) => {
        e.preventDefault();
        if (selectedRating === 0) { showNotification('Please select a rating.', 'error'); return; }
        if (!doctorId) { showNotification('Please select a doctor to send feedback to.', 'error'); return; }
        setSubmitting(true);
        try {
            await feedbackService.submitFeedback({ content, rating: selectedRating, doctorId });
            setContent('');
            setSelectedRating(0);
            showNotification('Feedback submitted successfully!', 'success');
            loadData();
        } catch (err) {
            showNotification(err.response?.data?.message || 'Failed to submit feedback.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    // NEW: Edit feedback
    const startEdit = (fb) => {
        if (fb.replied) {
            showNotification('Cannot edit feedback after doctor has replied.', 'error');
            return;
        }
        setEditingId(fb._id);
        setEditContent(fb.content);
        setEditRating(fb.rating);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditContent('');
        setEditRating(0);
        setEditHoverRating(0);
    };

    const saveFeedbackEdit = async (id) => {
        if (editRating === 0) {
            showNotification('Please select a rating.', 'error');
            return;
        }
        if (editContent.trim().length < 10) {
            showNotification('Feedback must be at least 10 characters.', 'error');
            return;
        }
        setSubmitting(true);
        try {
            await feedbackService.updateFeedback(id, {
                content: editContent.trim(),
                rating: editRating
            });
            showNotification('Feedback updated successfully!', 'success');
            cancelEdit();
            loadData();
        } catch (err) {
            showNotification(err.response?.data?.message || 'Failed to update feedback.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    // NEW: Delete feedback
    const deleteFeedback = async (id) => {
        if (!confirm('Are you sure you want to delete this feedback?')) return;
        setDeletingId(id);
        try {
            await feedbackService.deleteFeedback(id);
            showNotification('Feedback deleted successfully!', 'success');
            loadData();
        } catch (err) {
            showNotification(err.response?.data?.message || 'Failed to delete feedback.', 'error');
        } finally {
            setDeletingId(null);
        }
    };

    const displayRating = hoverRating || selectedRating;

    if (loading) return (
        <div className="tab-content active" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
            <div style={{ textAlign: 'center', color: '#2a7d2e' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⭐</div>
                <p>Loading feedback...</p>
            </div>
        </div>
    );

    return (
        <div className="tab-content active">
            <div className="tab-header">
                <h2>Provide Feedback
                    <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: '#999', fontWeight: 400 }}>
                        🔄 Auto-refreshes every 15s
                    </span>
                </h2>
                <div className="sort-controls">
                    <select className="sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                        <option value="date-desc">Date (Newest First)</option>
                        <option value="date-asc">Date (Oldest First)</option>
                        <option value="rating-desc">Rating (High to Low)</option>
                        <option value="rating-asc">Rating (Low to High)</option>
                    </select>
                </div>
            </div>

            <div className="feedback-container">
                {/* Doctor Public Rating Panel */}
                {doctorPublicRating && (
                    <div style={{
                        background: 'linear-gradient(135deg, #fffbeb, #fef9c3)',
                        border: '1.5px solid #fde68a',
                        borderRadius: '14px',
                        padding: '1rem 1.25rem',
                        marginBottom: '1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1.25rem',
                        flexWrap: 'wrap',
                    }}>
                        <div style={{ textAlign: 'center', minWidth: '70px' }}>
                            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#92400e', lineHeight: 1 }}>
                                {doctorPublicRating.rating.average.toFixed(1)}
                            </div>
                            <StarDisplay rating={doctorPublicRating.rating.average} size="0.95rem" />
                            <div style={{ fontSize: '0.7rem', color: '#78350f', marginTop: '3px' }}>
                                {doctorPublicRating.rating.total} review{doctorPublicRating.rating.total !== 1 ? 's' : ''}
                            </div>
                        </div>
                        <div style={{ flex: 1, minWidth: '140px' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#78350f', marginBottom: '3px' }}>
                                📊 Dr. {doctorPublicRating.doctor.name}'s Overall Rating
                            </div>
                            {doctorPublicRating.doctor.hospitalName && (
                                <div style={{ fontSize: '0.78rem', color: '#a16207' }}>
                                    🏥 {doctorPublicRating.doctor.hospitalName}
                                </div>
                            )}
                            <div style={{ fontSize: '0.75rem', color: '#b45309', marginTop: '4px' }}>
                                Your reviews help other patients choose the right doctor 🌟
                            </div>
                        </div>
                        {/* Mini breakdown */}
                        <div style={{ minWidth: '120px' }}>
                            {[5,4,3,2,1].map(n => {
                                const cnt = doctorPublicRating.rating.breakdown[n] || 0;
                                const pct = doctorPublicRating.rating.total > 0 ? Math.round((cnt / doctorPublicRating.rating.total) * 100) : 0;
                                return (
                                    <div key={n} style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '3px' }}>
                                        <span style={{ fontSize: '0.7rem', color: '#555', width: '10px' }}>{n}</span>
                                        <span style={{ fontSize: '0.7rem', color: '#f59e0b' }}>★</span>
                                        <div style={{ flex: 1, height: '6px', background: '#fde68a', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${pct}%`, background: n >= 4 ? '#f59e0b' : n === 3 ? '#fb923c' : '#ef4444', borderRadius: '3px' }} />
                                        </div>
                                        <span style={{ fontSize: '0.65rem', color: '#777', width: '18px' }}>{cnt}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Submit Form */}
                <div className="feedback-form">
                    <h3>Share Your Experience</h3>
                    <form onSubmit={submitFeedback}>
                        {/* Doctor Display / Selector */}
                        <div className="dash-form-group">
                            <label>Your Doctor</label>
                            {assignedDoctor ? (
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                                    background: '#f0f7f0', borderRadius: '8px', padding: '0.6rem 1rem',
                                    border: '1px solid #c8e6c9'
                                }}>
                                    <span style={{ fontSize: '1.4rem' }}>{assignedDoctor.avatar || '👨‍⚕️'}</span>
                                    <div>
                                        <div style={{ fontWeight: 600, color: '#1b5e20' }}>Dr. {assignedDoctor.name}</div>
                                        <div style={{ fontSize: '0.82rem', color: '#555' }}>{assignedDoctor.speciality || 'Ayurveda'}</div>
                                    </div>
                                    <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#2a7d2e', background: '#c8e6c9', borderRadius: '12px', padding: '0.2rem 0.6rem', fontWeight: 600 }}>
                                        ✓ Your Assigned Doctor
                                    </span>
                                </div>
                            ) : doctors.length > 0 ? (
                                <select
                                    value={doctorId}
                                    onChange={e => {
                                        setDoctorId(e.target.value);
                                        const doc = doctors.find(d => d._id === e.target.value);
                                        setAssignedDoctor(doc || null);
                                    }}
                                    style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #c8e6c9' }}
                                >
                                    <option value="">— Select a doctor —</option>
                                    {doctors.map(d => (
                                        <option key={d._id} value={d._id}>Dr. {d.name} – {d.speciality || 'Ayurveda'}</option>
                                    ))}
                                </select>
                            ) : (
                                <div style={{ color: '#999', fontSize: '0.9rem', padding: '0.5rem 0' }}>
                                    ⚠️ No doctor found. Please contact support or assign a doctor first.
                                </div>
                            )}
                        </div>

                        <div className="dash-form-group">
                            <label>How are you feeling about your progress?</label>
                            <textarea
                                rows={5}
                                placeholder="Share your experience, symptoms, improvements, or concerns..."
                                required
                                value={content}
                                onChange={e => setContent(e.target.value)}
                            />
                        </div>
                        <div className="dash-form-group">
                            <label>Rate your current well-being</label>
                            <div className="rating-stars-input">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <span
                                        key={i}
                                        className={`star ${i <= displayRating ? 'filled' : ''}`}
                                        onMouseEnter={() => setHoverRating(i)}
                                        onMouseLeave={() => setHoverRating(0)}
                                        onClick={() => setSelectedRating(i)}
                                        style={{ cursor: 'pointer', fontSize: '1.8rem' }}
                                    >⭐</span>
                                ))}
                            </div>
                            {selectedRating > 0 && <small style={{ color: '#ff9800' }}>You selected {selectedRating} star{selectedRating > 1 ? 's' : ''}</small>}
                        </div>
                        <button
                            type="submit"
                            className="dash-btn dash-btn-primary"
                            style={{ width: '100%' }}
                            disabled={submitting || !doctorId || selectedRating === 0}
                        >
                            {submitting ? 'Submitting...' : 'Submit Feedback'}
                        </button>
                    </form>
                </div>

                {/* Feedback History */}
                <div className="feedback-history">
                    <h3>Your Feedback History</h3>
                    {sorted.length === 0 && <p style={{ color: '#777' }}>No feedback submitted yet.</p>}
                    {sorted.map(fb => (
                        <div key={fb._id} className="feedback-item" style={{ position: 'relative' }}>
                            {/* EDIT MODE */}
                            {editingId === fb._id ? (
                                <div style={{ padding: '1rem', background: '#f0f7f0', borderRadius: '8px', border: '1px solid #c8e6c9' }}>
                                    <div style={{ marginBottom: '0.75rem' }}>
                                        <label style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>Edit Your Feedback</label>
                                        <textarea
                                            rows={4}
                                            value={editContent}
                                            onChange={e => setEditContent(e.target.value)}
                                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #c8e6c9', fontSize: '0.9rem', boxSizing: 'border-box' }}
                                        />
                                        <small style={{ color: '#666' }}>{editContent.length}/2000 characters</small>
                                    </div>
                                    <div style={{ marginBottom: '0.75rem' }}>
                                        <label style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>Update Rating</label>
                                        <div className="rating-stars-input">
                                            {[1, 2, 3, 4, 5].map(i => (
                                                <span
                                                    key={i}
                                                    className={`star ${i <= (editHoverRating || editRating) ? 'filled' : ''}`}
                                                    onMouseEnter={() => setEditHoverRating(i)}
                                                    onMouseLeave={() => setEditHoverRating(0)}
                                                    onClick={() => setEditRating(i)}
                                                    style={{ cursor: 'pointer', fontSize: '1.8rem' }}
                                                >⭐</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            className="dash-btn dash-btn-primary dash-btn-sm"
                                            onClick={() => saveFeedbackEdit(fb._id)}
                                            disabled={submitting}
                                        >
                                            {submitting ? '💾 Saving...' : '💾 Save Changes'}
                                        </button>
                                        <button
                                            className="dash-btn dash-btn-secondary dash-btn-sm"
                                            onClick={cancelEdit}
                                            disabled={submitting}
                                        >
                                            ❌ Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* DISPLAY MODE */}
                                    <div className="feedback-header">
                                        <span className="feedback-rating">{'⭐'.repeat(fb.rating)}</span>
                                        <span className="feedback-date">{new Date(fb.createdAt).toLocaleDateString('en-IN')}</span>
                                        {fb.isEdited && (
                                            <span style={{ fontSize: '0.7rem', color: '#999', marginLeft: '0.5rem' }}>
                                                (edited)
                                            </span>
                                        )}
                                    </div>
                                    <div className="feedback-content">{fb.content}</div>
                                    {fb.replied && fb.reply && (
                                        <div className="feedback-reply">
                                            <div className="feedback-reply-label">👨‍⚕️ Doctor's Reply:</div>
                                            <div>{fb.reply}</div>
                                        </div>
                                    )}
                                    {!fb.replied && (
                                        <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#999' }}>
                                            ⏳ Awaiting doctor's reply...
                                        </div>
                                    )}
                                    {/* Action buttons */}
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', borderTop: '1px solid #e0e0e0', paddingTop: '0.75rem' }}>
                                        <button
                                            className="dash-btn dash-btn-secondary dash-btn-sm"
                                            onClick={() => startEdit(fb)}
                                            disabled={fb.replied || submitting}
                                            title={fb.replied ? 'Cannot edit after doctor reply' : 'Edit feedback'}
                                            style={{ opacity: fb.replied ? 0.5 : 1 }}
                                        >
                                            ✏️ Edit
                                        </button>
                                        <button
                                            className="dash-btn dash-btn-secondary dash-btn-sm"
                                            onClick={() => deleteFeedback(fb._id)}
                                            disabled={deletingId === fb._id}
                                            style={{ color: '#d32f2f' }}
                                        >
                                            {deletingId === fb._id ? '🗑️ Deleting...' : '🗑️ Delete'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
