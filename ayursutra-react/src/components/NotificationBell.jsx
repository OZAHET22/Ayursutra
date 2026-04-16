import { useState, useEffect, useRef } from 'react';
import { getNotifications, markRead, markAllRead } from '../services/notificationService';

export default function NotificationBell({ userId, socketRef }) {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef(null);

    const loadNotifications = async () => {
        try {
            const data = await getNotifications();
            setNotifications(data.data || []);
            setUnreadCount(data.unreadCount || 0);
        } catch { /* silent */ }
    };

    useEffect(() => {
        loadNotifications();
        const interval = setInterval(loadNotifications, 30000);

        // Real-time Socket.io notifications
        if (socketRef?.current) {
            socketRef.current.on('new_notification', (notif) => {
                setNotifications(prev => [{ ...notif, status: 'sent' }, ...prev]);
                setUnreadCount(c => c + 1);
                // Play a subtle sound / flash
                document.title = `🔔 New notification — Ayursutra`;
                setTimeout(() => { document.title = 'Ayursutra'; }, 3000);
            });
        }

        return () => clearInterval(interval);
    }, [socketRef]);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleMarkRead = async (id) => {
        await markRead(id);
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, status: 'read' } : n));
        setUnreadCount(c => Math.max(0, c - 1));
    };

    const handleMarkAll = async () => {
        await markAllRead();
        setNotifications(prev => prev.map(n => ({ ...n, status: 'read' })));
        setUnreadCount(0);
    };

    const typeIcon = { pre_24h: '⏰', pre_1h: '⚡', post_session: '🌿', medication: '💊', followup: '📋', general: '🔔' };
    const typeColor = { pre_24h: '#ff9800', pre_1h: '#f44336', post_session: '#4caf50', medication: '#2196f3', followup: '#9c27b0', general: '#607d8b' };

    return (
        <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
            <button
                onClick={() => setOpen(o => !o)}
                style={{
                    background: 'none', border: 'none', cursor: 'pointer', padding: '8px',
                    fontSize: '1.3rem', position: 'relative', color: '#2a7d2e',
                    borderRadius: '50%', transition: 'background 0.2s',
                }}
                title="Notifications"
            >
                🔔
                {unreadCount > 0 && (
                    <span style={{
                        position: 'absolute', top: '2px', right: '2px',
                        background: '#f44336', color: '#fff', borderRadius: '50%',
                        fontSize: '0.6rem', fontWeight: 700, minWidth: '16px', height: '16px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '0 3px', lineHeight: 1,
                    }}>{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
            </button>

            {open && (
                <div style={{
                    position: 'absolute', right: 0, top: '100%', width: '360px', maxHeight: '480px',
                    background: '#fff', borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                    zIndex: 9999, overflow: 'hidden', border: '1px solid #e8f5e9',
                }}>
                    {/* Header */}
                    <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '1rem 1.2rem', borderBottom: '1px solid #f0f0f0',
                        background: 'linear-gradient(135deg, #e8f5e9, #f1f8e9)',
                    }}>
                        <span style={{ fontWeight: 700, color: '#2a7d2e', fontSize: '1rem' }}>🔔 Notifications</span>
                        {unreadCount > 0 && (
                            <button onClick={handleMarkAll} style={{
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: '#2a7d2e', fontSize: '0.78rem', fontWeight: 600, textDecoration: 'underline',
                            }}>Mark all read</button>
                        )}
                    </div>

                    {/* List */}
                    <div style={{ overflowY: 'auto', maxHeight: '400px' }}>
                        {notifications.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
                                <div style={{ fontSize: '2rem' }}>🌿</div>
                                <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>All caught up!</p>
                            </div>
                        ) : notifications.map(n => (
                            <div key={n._id} onClick={() => n.status !== 'read' && handleMarkRead(n._id)} style={{
                                display: 'flex', gap: '0.75rem', padding: '0.85rem 1.2rem',
                                borderBottom: '1px solid #f5f5f5', cursor: n.status !== 'read' ? 'pointer' : 'default',
                                background: n.status !== 'read' ? '#f0f9f0' : '#fff',
                                transition: 'background 0.15s',
                            }}>
                                <div style={{
                                    fontSize: '1.3rem', minWidth: '36px', height: '36px',
                                    background: typeColor[n.type] + '20', borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>{typeIcon[n.type] || '🔔'}</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontWeight: n.status !== 'read' ? 700 : 500, fontSize: '0.85rem', color: '#2c3e50' }}>
                                        {n.title}
                                    </div>
                                    <div style={{ color: '#666', fontSize: '0.78rem', marginTop: '2px', lineHeight: 1.4,
                                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {n.message}
                                    </div>
                                    <div style={{ color: '#aaa', fontSize: '0.72rem', marginTop: '4px' }}>
                                        {new Date(n.createdAt || n.sentAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                                    </div>
                                </div>
                                {n.status !== 'read' && (
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2a7d2e', marginTop: '4px', flexShrink: 0 }} />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
