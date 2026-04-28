import { useState, useEffect, useCallback } from 'react';
import * as feedbackService from '../../services/feedbackService';

export default function FeedbackTab({ user, showNotification }) {
    const [feedbacks, setFeedbacks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [replies, setReplies] = useState({});
    const [submitting, setSubmitting] = useState({});
    const [filterReplied, setFilterReplied] = useState('all'); // 'all' | 'pending' | 'replied'
    const [sortBy, setSortBy] = useState('date-desc');
    
    // NEW: Edit reply state
    const [editingReplyId, setEditingReplyId] = useState(null);
    const [editingReplyText, setEditingReplyText] = useState('');

    const loadFeedback = useCallback(async () => {
        setLoading(true);
        try {
            // getFeedback now returns { data: [], pagination: {} }
            const response = await feedbackService.getFeedback(1, 1000);
            setFeedbacks(response?.data || []);
        } catch (err) {
            console.error('Failed to load feedback:', err);
            showNotification('Failed to load feedback. Please refresh.', 'error');
        } finally {
            setLoading(false);
        }
    }, [showNotification]);

    useEffect(() => {
        loadFeedback();
        const interval = setInterval(loadFeedback, 15000);
        return () => clearInterval(interval);
    }, [loadFeedback]);

    const submitReply = async (id) => {
        const reply = replies[id]?.trim();
        if (!reply) { showNotification('Please enter a reply.', 'error'); return; }
        setSubmitting(prev => ({ ...prev, [id]: true }));
        try {
            await feedbackService.replyFeedback(id, reply);
            setReplies(prev => ({ ...prev, [id]: '' }));
            showNotification('Reply sent successfully!', 'success');
            await loadFeedback();
        } catch (err) {
            showNotification(err?.response?.data?.message || 'Failed to send reply.', 'error');
        } finally {
            setSubmitting(prev => ({ ...prev, [id]: false }));
        }
    };

    // NEW: Edit reply functions
    const startEditReply = (fb) => {
        setEditingReplyId(fb._id);
        setEditingReplyText(fb.reply || '');
    };

    const cancelEditReply = () => {
        setEditingReplyId(null);
        setEditingReplyText('');
    };

    const saveReplyEdit = async (id) => {
        const replyText = editingReplyText?.trim();
        if (!replyText) {
            showNotification('Reply cannot be empty.', 'error');
            return;
        }
        if (replyText.length < 5) {
            showNotification('Reply must be at least 5 characters.', 'error');
            return;
        }
        if (replyText.length > 2000) {
            showNotification('Reply cannot exceed 2000 characters.', 'error');
            return;
        }
        setSubmitting(prev => ({ ...prev, [id]: true }));
        try {
            await feedbackService.updateReply(id, replyText);
            showNotification('Reply updated successfully!', 'success');
            cancelEditReply();
            await loadFeedback();
        } catch (err) {
            showNotification(err?.response?.data?.message || 'Failed to update reply.', 'error');
        } finally {
            setSubmitting(prev => ({ ...prev, [id]: false }));
        }
    };

    // Stats — guard against missing rating values
    const validFeedbacks = feedbacks.filter(f => typeof f.rating === 'number' && f.rating >= 1);
    const avgRating = validFeedbacks.length > 0
        ? (validFeedbacks.reduce((sum, fb) => sum + fb.rating, 0) / validFeedbacks.length).toFixed(1)
        : '—';

    // Filter + Sort
    const displayed = feedbacks
        .filter(f => {
            if (filterReplied === 'pending') return !f.replied;
            if (filterReplied === 'replied') return f.replied;
            return true;
        })
        .sort((a, b) => {
            if (sortBy === 'date-desc') return new Date(b.createdAt) - new Date(a.createdAt);
            if (sortBy === 'date-asc')  return new Date(a.createdAt) - new Date(b.createdAt);
            if (sortBy === 'rating-desc') return (b.rating || 0) - (a.rating || 0);
            if (sortBy === 'rating-asc')  return (a.rating || 0) - (b.rating || 0);
            return 0;
        });

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
                    <span style={{ marginLeft: '0.5rem', fontSize: '0.8rem', color: '#999', fontWeight: 400 }}>🔄 15s auto-refresh</span>
                </h2>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {/* Filter by reply status */}
                    {[['all', 'All'], ['pending', 'Pending'], ['replied', 'Replied']].map(([val, label]) => (
                        <button
                            key={val}
                            onClick={() => setFilterReplied(val)}
                            style={{
                                padding: '0.3rem 0.75rem', borderRadius: '20px', cursor: 'pointer',
                                border: `1px solid ${filterReplied === val ? '#2a7d2e' : '#ddd'}`,
                                background: filterReplied === val ? '#2a7d2e' : '#fff',
                                color: filterReplied === val ? '#fff' : '#555',
                                fontSize: '0.82rem', fontWeight: 500,
                            }}
                        >{label}</button>
                    ))}
                    <select
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value)}
                        style={{ padding: '0.3rem 0.6rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '0.82rem' }}
                    >
                        <option value="date-desc">Newest First</option>
                        <option value="date-asc">Oldest First</option>
                        <option value="rating-desc">Rating ▼</option>
                        <option value="rating-asc">Rating ▲</option>
                    </select>
                    <button className="dash-btn dash-btn-secondary" style={{ fontSize: '0.82rem', padding: '0.3rem 0.75rem' }} onClick={loadFeedback}>
                        ↻ Refresh
                    </button>
                </div>
            </div>

            {/* ── Rating Summary Dashboard ──────────────────────────────────── */}
            {feedbacks.length > 0 && (() => {
                const totalReviews = feedbacks.length;
                const avg = validFeedbacks.length > 0
                    ? validFeedbacks.reduce((s, f) => s + f.rating, 0) / validFeedbacks.length
                    : 0;
                const fullStars = Math.floor(avg);
                const halfStar = avg - fullStars >= 0.5;
                const breakdown = [5, 4, 3, 2, 1].map(n => ({
                    star: n,
                    count: feedbacks.filter(f => f.rating === n).length,
                    pct: totalReviews > 0 ? Math.round((feedbacks.filter(f => f.rating === n).length / totalReviews) * 100) : 0,
                }));
                return (
                    <div style={{
                        background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                        border: '1.5px solid #86efac',
                        borderRadius: '16px',
                        padding: '1.25rem 1.5rem',
                        marginBottom: '1.5rem',
                        display: 'flex',
                        gap: '2rem',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                    }}>
                        {/* Big rating number */}
                        <div style={{ textAlign: 'center', minWidth: '90px' }}>
                            <div style={{ fontSize: '3rem', fontWeight: 900, color: '#14532d', lineHeight: 1 }}>
                                {avg.toFixed(1)}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '2px', margin: '6px 0 4px' }}>
                                {[1,2,3,4,5].map(i => (
                                    <span key={i} style={{
                                        fontSize: '1.1rem',
                                        color: i <= fullStars ? '#f59e0b' : (i === fullStars + 1 && halfStar) ? '#f59e0b' : '#d1d5db',
                                        opacity: (i === fullStars + 1 && halfStar) ? 0.55 : 1,
                                    }}>★</span>
                                ))}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#4b7c52' }}>
                                {totalReviews} review{totalReviews !== 1 ? 's' : ''}
                            </div>
                        </div>

                        {/* Bar breakdown */}
                        <div style={{ flex: 1, minWidth: '180px' }}>
                            {breakdown.map(({ star, count, pct }) => (
                                <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                                    <span style={{ fontSize: '0.78rem', color: '#555', width: '14px', textAlign: 'right' }}>{star}</span>
                                    <span style={{ fontSize: '0.8rem', color: '#f59e0b' }}>★</span>
                                    <div style={{ flex: 1, height: '8px', background: '#d1fae5', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%', width: `${pct}%`,
                                            background: star >= 4 ? '#16a34a' : star === 3 ? '#f59e0b' : '#ef4444',
                                            borderRadius: '4px', transition: 'width 0.4s ease'
                                        }} />
                                    </div>
                                    <span style={{ fontSize: '0.72rem', color: '#777', width: '28px' }}>{count}</span>
                                </div>
                            ))}
                        </div>

                        {/* Reply stat */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '110px' }}>
                            <div style={{ background: '#fff', borderRadius: '10px', padding: '0.5rem 0.75rem', textAlign: 'center', border: '1px solid #bbf7d0' }}>
                                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#16a34a' }}>{feedbacks.filter(f => f.replied).length}</div>
                                <div style={{ fontSize: '0.7rem', color: '#555' }}>Replied</div>
                            </div>
                            <div style={{ background: '#fff', borderRadius: '10px', padding: '0.5rem 0.75rem', textAlign: 'center', border: '1px solid #fde68a' }}>
                                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: feedbacks.filter(f => !f.replied).length > 0 ? '#d97706' : '#aaa' }}>
                                    {feedbacks.filter(f => !f.replied).length}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: '#555' }}>Pending</div>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Small stats when no reviews yet */}
            {feedbacks.length === 0 && (
                <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                    <div className="stat-card"><div className="stat-content"><h3>Total Reviews</h3><p className="stat-value">0</p></div><div className="stat-icon">💬</div></div>
                    <div className="stat-card"><div className="stat-content"><h3>Avg. Rating</h3><p className="stat-value">— ⭐</p></div><div className="stat-icon">🌟</div></div>
                    <div className="stat-card"><div className="stat-content"><h3>Replied</h3><p className="stat-value">0</p></div><div className="stat-icon">✅</div></div>
                    <div className="stat-card"><div className="stat-content"><h3>Pending Reply</h3><p className="stat-value">0</p></div><div className="stat-icon">⏳</div></div>
                </div>
            )}

            {displayed.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#777' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
                    <p>{feedbacks.length === 0 ? 'No patient feedback yet.' : 'No feedback matches this filter.'}</p>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {displayed.map(fb => (
                    <div key={fb._id} className="card" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '1rem' }}>{fb.patientName || 'Anonymous'}</div>
                                <div style={{ fontSize: '0.85rem', color: '#777' }}>
                                    {new Date(fb.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                                </div>
                            </div>
                            <div style={{ fontSize: '1.2rem' }}>{'⭐'.repeat(fb.rating || 0)}</div>
                        </div>

                        <div style={{ padding: '0.75rem', background: '#f8f9fa', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.95rem', lineHeight: '1.5' }}>
                            {fb.content}
                        </div>

                        {fb.replied ? (
                            <div style={{ padding: '0.75rem', background: '#e8f5e9', borderRadius: '8px', borderLeft: '3px solid #4caf50' }}>
                                {editingReplyId === fb._id ? (
                                    <>
                                        <label style={{ fontWeight: 600, color: '#2a7d2e', marginBottom: '0.5rem', display: 'block' }}>Edit Your Reply:</label>
                                        <textarea
                                            rows={3}
                                            placeholder="Edit your professional response..."
                                            value={editingReplyText}
                                            onChange={e => setEditingReplyText(e.target.value)}
                                            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #4caf50', resize: 'vertical', fontSize: '0.9rem', boxSizing: 'border-box', marginBottom: '0.5rem' }}
                                        />
                                        <small style={{ color: '#666', display: 'block', marginBottom: '0.5rem' }}>
                                            {editingReplyText.length}/2000 characters
                                        </small>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                className="dash-btn dash-btn-primary dash-btn-sm"
                                                onClick={() => saveReplyEdit(fb._id)}
                                                disabled={submitting[fb._id]}
                                            >
                                                {submitting[fb._id] ? '💾 Saving...' : '💾 Save Changes'}
                                            </button>
                                            <button
                                                className="dash-btn dash-btn-secondary dash-btn-sm"
                                                onClick={cancelEditReply}
                                                disabled={submitting[fb._id]}
                                            >
                                                ❌ Cancel
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div style={{ fontWeight: 600, color: '#2a7d2e', marginBottom: '0.25rem' }}>👨‍⚕️ Your Reply:</div>
                                        <div style={{ fontSize: '0.9rem', marginBottom: '0.75rem', whiteSpace: 'pre-wrap' }}>{fb.reply}</div>
                                        {fb.replyDate && (
                                            <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.5rem' }}>
                                                Sent: {new Date(fb.replyDate).toLocaleDateString('en-IN')}
                                            </div>
                                        )}
                                        <button
                                            className="dash-btn dash-btn-secondary dash-btn-sm"
                                            onClick={() => startEditReply(fb)}
                                        >
                                            ✏️ Edit Reply
                                        </button>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div>
                                <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#555' }}>Reply to Patient:</div>
                                <textarea
                                    rows={3}
                                    placeholder="Write a professional, caring response..."
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', resize: 'vertical', fontSize: '0.9rem', boxSizing: 'border-box' }}
                                    value={replies[fb._id] || ''}
                                    onChange={e => setReplies(prev => ({ ...prev, [fb._id]: e.target.value }))}
                                />
                                <button
                                    className="dash-btn dash-btn-primary dash-btn-sm"
                                    style={{ marginTop: '0.5rem' }}
                                    disabled={submitting[fb._id] || !replies[fb._id]?.trim()}
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
