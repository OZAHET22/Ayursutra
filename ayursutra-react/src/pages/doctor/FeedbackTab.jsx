import { useState, useEffect } from 'react';
import * as feedbackService from '../../services/feedbackService';

export default function FeedbackTab({ user, showNotification }) {
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [replies, setReplies] = useState({});
    const [submitting, setSubmitting] = useState({});

    const loadFeedback = async () => {
        try {
            const data = await feedbackService.getFeedback();
            setFeedbacks(data || []);
        } catch (err) { console.error('Failed to load feedback:', err); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        loadFeedback();
        const interval = setInterval(loadFeedback, 15000);
        return () => clearInterval(interval);
    }, []);

    const submitReply = async (id) => {
        if (!replies[id]?.trim()) { showNotification('Please enter a reply.', 'error'); return; }
        setSubmitting(prev => ({ ...prev, [id]: true }));
        try {
            await feedbackService.replyFeedback(id, replies[id]);
            setReplies(prev => ({ ...prev, [id]: '' }));
            showNotification('Reply sent successfully!', 'success');
            loadFeedback();
        } catch { showNotification('Failed to send reply.', 'error'); }
        finally { setSubmitting(prev => ({ ...prev, [id]: false })); }
    };

    const avgRating = feedbacks.length > 0
        ? (feedbacks.reduce((sum, fb) => sum + fb.rating, 0) / feedbacks.length).toFixed(1)
        : '—';

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
                <h2>Patient Feedback
                    <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: '#999', fontWeight: 400 }}>🔄 15s</span>
                </h2>
            </div>

            {/* Summary stats */}
            <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="stat-card"><div className="stat-content"><h3>Total Reviews</h3><p className="stat-value">{feedbacks.length}</p></div><div className="stat-icon">💬</div></div>
                <div className="stat-card"><div className="stat-content"><h3>Avg. Rating</h3><p className="stat-value">{avgRating} ⭐</p></div><div className="stat-icon">🌟</div></div>
                <div className="stat-card"><div className="stat-content"><h3>Replied</h3><p className="stat-value">{feedbacks.filter(f => f.replied).length}</p></div><div className="stat-icon">✅</div></div>
                <div className="stat-card"><div className="stat-content"><h3>Pending Reply</h3><p className="stat-value" style={{ color: feedbacks.filter(f => !f.replied).length > 0 ? '#ff9800' : undefined }}>{feedbacks.filter(f => !f.replied).length}</p></div><div className="stat-icon">⏳</div></div>
            </div>

            {feedbacks.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#777' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
                    <p>No patient feedback yet.</p>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {feedbacks.map(fb => (
                    <div key={fb._id} className="card" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '1rem' }}>{fb.patientName}</div>
                                <div style={{ fontSize: '0.85rem', color: '#777' }}>
                                    {new Date(fb.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                                </div>
                            </div>
                            <div style={{ fontSize: '1.2rem' }}>{'⭐'.repeat(fb.rating)}</div>
                        </div>

                        <div style={{ padding: '0.75rem', background: '#f8f9fa', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.95rem', lineHeight: '1.5' }}>
                            {fb.content}
                        </div>

                        {fb.replied ? (
                            <div style={{ padding: '0.75rem', background: '#e8f5e9', borderRadius: '8px', borderLeft: '3px solid #4caf50' }}>
                                <div style={{ fontWeight: 600, color: '#2a7d2e', marginBottom: '0.25rem' }}>👨‍⚕️ Your Reply:</div>
                                <div style={{ fontSize: '0.9rem' }}>{fb.reply}</div>
                            </div>
                        ) : (
                            <div>
                                <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#555' }}>Reply to Patient:</div>
                                <textarea
                                    rows={3}
                                    placeholder="Write a professional, caring response..."
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', resize: 'vertical', fontSize: '0.9rem' }}
                                    value={replies[fb._id] || ''}
                                    onChange={e => setReplies(prev => ({ ...prev, [fb._id]: e.target.value }))}
                                />
                                <button
                                    className="dash-btn dash-btn-primary dash-btn-sm"
                                    style={{ marginTop: '0.5rem' }}
                                    disabled={submitting[fb._id]}
                                    onClick={() => submitReply(fb._id)}
                                >
                                    {submitting[fb._id] ? 'Sending...' : '📤 Send Reply'}
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
