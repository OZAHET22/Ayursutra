import { useState, useEffect } from 'react';
import * as feedbackService from '../../services/feedbackService';
import API from '../../services/api';

export default function FeedbackTab({ user, showNotification }) {
    const [feedbacks, setFeedbacks] = useState([]);
    const [assignedDoctor, setAssignedDoctor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState('date-desc');
    const [selectedRating, setSelectedRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [content, setContent] = useState('');
    const [doctorId, setDoctorId] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const loadData = async () => {
        try {
            const fbs = await feedbackService.getFeedback();
            setFeedbacks(fbs || []);

            // Load only the patient's assigned doctor (set during signup)
            const prefDocId = user?.preferredDoctor;
            if (prefDocId) {
                try {
                    const res = await API.get(`/users/${prefDocId}`);
                    const doc = res.data?.data || res.data?.user || null;
                    if (doc) {
                        setAssignedDoctor(doc);
                        setDoctorId(doc._id);
                    }
                } catch {
                    setAssignedDoctor(null);
                }
            }
        } catch (err) {
            console.error('Failed to load feedback:', err);
        } finally { setLoading(false); }
    };

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 15000);
        return () => clearInterval(interval);
    }, []);

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
        if (!doctorId) { showNotification('No assigned doctor found. Please contact support.', 'error'); return; }
        setSubmitting(true);
        try {
            await feedbackService.submitFeedback({ content, rating: selectedRating, doctorId });
            setContent('');
            setSelectedRating(0);
            showNotification('Feedback submitted successfully!', 'success');
            loadData();
        } catch (err) {
            showNotification(err.response?.data?.message || 'Failed to submit feedback.', 'error');
        } finally { setSubmitting(false); }
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
                {/* Submit Form */}
                <div className="feedback-form">
                    <h3>Share Your Experience</h3>
                    <form onSubmit={submitFeedback}>
                        {/* Assigned Doctor Display (read-only — set at signup) */}
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
                            ) : (
                                <div style={{ color: '#999', fontSize: '0.9rem', padding: '0.5rem 0' }}>
                                    ⚠️ No assigned doctor found. Your feedback may be general.
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
                        <button type="submit" className="dash-btn dash-btn-primary" style={{ width: '100%' }} disabled={submitting || !doctorId}>
                            {submitting ? 'Submitting...' : 'Submit Feedback'}
                        </button>
                    </form>
                </div>

                {/* Feedback History */}
                <div className="feedback-history">
                    <h3>Your Feedback History</h3>
                    {sorted.length === 0 && <p style={{ color: '#777' }}>No feedback submitted yet.</p>}
                    {sorted.map(fb => (
                        <div key={fb._id} className="feedback-item">
                            <div className="feedback-header">
                                <span className="feedback-rating">{'⭐'.repeat(fb.rating)}</span>
                                <span className="feedback-date">{new Date(fb.createdAt).toLocaleDateString('en-IN')}</span>
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
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
