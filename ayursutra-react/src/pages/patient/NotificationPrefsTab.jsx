import { useState, useEffect } from 'react';
import { getNotificationPrefs, updateNotificationPrefs } from '../../services/notificationService';
import { getNotifications } from '../../services/notificationService';

const CHANNELS = [
    { key: 'in_app', label: 'In-App Notifications', icon: '📱', desc: 'Bell notifications inside the app (always recommended)' },
    { key: 'email', label: 'Email Notifications', icon: '📧', desc: 'Receive reminders and care instructions via email' },
    { key: 'whatsapp', label: 'WhatsApp Messages', icon: '💬', desc: 'Get WhatsApp messages for your therapy reminders' },
    { key: 'sms', label: 'Mobile SMS', icon: '📲', desc: 'Receive SMS alerts on your registered mobile number' },
];
const NOTIF_TYPES = [
    { key: 'pre_24h', icon: '⏰', label: '24h Before Reminder', desc: 'Reminder with pre-procedure instructions one day before' },
    { key: 'pre_1h', icon: '⚡', label: '1h Before Reminder', desc: 'Last-minute reminder one hour before your session' },
    { key: 'post_session', icon: '🌿', label: 'Post-Session Care', desc: 'Post-procedure care instructions after each session' },
    { key: 'medication', icon: '💊', label: 'Medication Reminders', desc: 'Reminders for prescribed herbs and supplements' },
    { key: 'followup', icon: '📋', label: 'Follow-Up Prompts', desc: 'Check-in prompts between sessions' },
];

export default function PatientNotificationPrefsTab({ user, showNotification }) {
    const [prefs, setPrefs] = useState({ in_app: true, email: false, whatsapp: false, sms: false });
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const [p, n] = await Promise.all([getNotificationPrefs(), getNotifications()]);
                setPrefs(p || { in_app: true, email: false, whatsapp: false, sms: false });
                setNotifications(n.data || []);
            } catch { }
            finally { setLoading(false); }
        };
        load();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateNotificationPrefs(prefs);
            showNotification('Preferences saved!', 'success');
        } catch { showNotification('Failed to save', 'error'); }
        finally { setSaving(false); }
    };

    const typeIcon = { pre_24h: '⏰', pre_1h: '⚡', post_session: '🌿', medication: '💊', followup: '📋', general: '🔔' };

    if (loading) return (
        <div className="tab-content active" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
            <div style={{ textAlign: 'center', color: '#2a7d2e' }}><div style={{ fontSize: '2rem' }}>🔔</div><p>Loading...</p></div>
        </div>
    );

    return (
        <div className="tab-content active">
            <div className="tab-header"><h2>🔔 Notification Preferences</h2></div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                {/* Channel Toggles */}
                <div className="card">
                    <h3 style={{ color: '#2a7d2e', marginBottom: '1.2rem' }}>📡 Notification Channels</h3>
                    {CHANNELS.map(ch => (
                        <div key={ch.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.9rem', background: prefs[ch.key] ? '#f0f9f0' : '#fafafa', borderRadius: '12px', marginBottom: '0.75rem', border: `1px solid ${prefs[ch.key] ? '#c8e6c9' : '#e0e0e0'}`, transition: 'all 0.2s' }}>
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                <span style={{ fontSize: '1.5rem' }}>{ch.icon}</span>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{ch.label}</div>
                                    <div style={{ color: '#777', fontSize: '0.78rem' }}>{ch.desc}</div>
                                </div>
                            </div>
                            <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', flexShrink: 0 }}>
                                <input type="checkbox" checked={!!prefs[ch.key]} onChange={e => setPrefs(p => ({ ...p, [ch.key]: e.target.checked }))}
                                    style={{ opacity: 0, width: 0, height: 0 }} />
                                <span style={{
                                    position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                                    background: prefs[ch.key] ? '#2a7d2e' : '#ccc', borderRadius: '24px', transition: '0.3s',
                                }}>
                                    <span style={{
                                        position: 'absolute', content: '', height: '16px', width: '16px', left: prefs[ch.key] ? '24px' : '4px', bottom: '4px',
                                        background: '#fff', borderRadius: '50%', transition: '0.3s',
                                    }} />
                                </span>
                            </label>
                        </div>
                    ))}
                    <button onClick={handleSave} className="dash-btn dash-btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={saving}>
                        {saving ? 'Saving...' : '💾 Save Preferences'}
                    </button>
                </div>

                {/* Notification Types Info */}
                <div className="card">
                    <h3 style={{ color: '#2a7d2e', marginBottom: '1.2rem' }}>📋 What You'll Receive</h3>
                    {NOTIF_TYPES.map(nt => (
                        <div key={nt.key} style={{ display: 'flex', gap: '0.75rem', padding: '0.75rem', background: '#f9fbe7', borderRadius: '10px', marginBottom: '0.6rem', border: '1px solid #e8f5e9' }}>
                            <span style={{ fontSize: '1.3rem' }}>{nt.icon}</span>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{nt.label}</div>
                                <div style={{ color: '#666', fontSize: '0.78rem' }}>{nt.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Notifications Inbox */}
            <h3 style={{ color: '#2a7d2e', marginBottom: '1rem' }}>📬 Your Notifications</h3>
            {notifications.length === 0 && (
                <div style={{ textAlign: 'center', color: '#aaa', padding: '2rem' }}>
                    <div style={{ fontSize: '2.5rem' }}>🌿</div>
                    <p>No notifications yet. They'll appear here when your doctor or the system sends them.</p>
                </div>
            )}
            {notifications.map(n => (
                <div key={n._id} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', padding: '0.85rem 1.2rem', background: n.status !== 'read' ? '#f0f9f0' : '#fafafa', borderRadius: '12px', marginBottom: '0.6rem', border: `1px solid ${n.status !== 'read' ? '#c8e6c9' : '#eee'}` }}>
                    <div style={{ fontSize: '1.4rem', minWidth: '36px', background: '#e8f5e9', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {typeIcon[n.type] || '🔔'}
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: n.status !== 'read' ? 700 : 500, color: '#2c3e50', fontSize: '0.9rem' }}>{n.title}</div>
                        <div style={{ color: '#666', fontSize: '0.82rem', marginTop: '3px', lineHeight: 1.5 }}>{n.message}</div>
                        <div style={{ color: '#aaa', fontSize: '0.72rem', marginTop: '4px' }}>
                            {new Date(n.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                        </div>
                    </div>
                    {n.status !== 'read' && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2a7d2e', marginTop: '6px' }} />}
                </div>
            ))}
        </div>
    );
}
