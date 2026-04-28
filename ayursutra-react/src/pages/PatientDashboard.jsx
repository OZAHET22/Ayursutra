import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import Notification from '../components/Notification';
import NotificationBell from '../components/NotificationBell';
import ChangeDoctorModal from '../components/ChangeDoctorModal';
import AppointmentsTab from './patient/AppointmentsTab';
import TherapiesTab from './patient/TherapiesTab';
import DocumentsTab from './patient/DocumentsTab';
import ProgressTab from './patient/ProgressTab';
import FeedbackTab from './patient/FeedbackTab';
import PatientTherapyTrackingTab from './patient/TherapyTrackingTab';
import PatientNotificationPrefsTab from './patient/NotificationPrefsTab';
import DietPlansTab from './patient/DietPlansTab';
import PatientPrescriptionsTab from './patient/PrescriptionsTab';

const TABS = [
    { id: 'appointments', label: 'Appointments',    icon: '📅' },
    { id: 'therapies',    label: 'My Therapies',    icon: '💆' },
    { id: 'tracking',     label: 'Therapy Tracking', icon: '🌿' },
    { id: 'progress',     label: 'Progress',         icon: '📈' },
    { id: 'diet',         label: 'My Diet Plans',    icon: '🥗' },
    { id: 'prescriptions',label: 'My Prescriptions',  icon: '💊' },
    { id: 'documents',    label: 'Documents',        icon: '📁' },
    { id: 'feedback',     label: 'Feedback',         icon: '💬' },
    { id: 'notifications',label: 'Notifications',    icon: '🔔' },
];

export default function PatientDashboard({ user: initialUser, onLogout, showNotification, notification }) {
    const [activeTab, setActiveTab] = useState('appointments');
    const [showChangeDoctor, setShowChangeDoctor] = useState(false);
    const [user, setUser] = useState(initialUser); // allow local update after reassign
    const [menuOpen, setMenuOpen] = useState(false);
    const socketRef = useRef(null);
    const menuRef = useRef(null);

    // Keep local user in sync if parent updates it
    useEffect(() => { setUser(initialUser); }, [initialUser]);

    useEffect(() => {
        const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        // IMPORTANT: 'polling' MUST come first — WebSocket-first causes
        // "closed before connection established" errors when the server is local.
        const socket = io(socketUrl, {
            transports: ['polling', 'websocket'],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
            timeout: 10000,
        });
        socketRef.current = socket;
        const userId = user.id || user._id;
        socket.on('connect', () => {
            if (userId) socket.emit('join_user_room', userId);
        });
        socket.on('reconnect', () => {
            if (userId) socket.emit('join_user_room', userId);
        });

        // Listen for reassignment events from other devices / backend
        socket.on('patient_reassigned', (data) => {
            showNotification(`You have been reassigned to Dr. ${data.newDoctorName}`, 'info');
        });

        return () => socket.disconnect();
    }, [user]);

    // Close user menu on outside click
    useEffect(() => {
        const handler = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Called after successful reassignment — update local user state so header reflects new doctor/centre
    const handleReassignSuccess = (result) => {
        if (result?.data) {
            setUser(prev => ({
                ...prev,
                ...result.data,
                id: result.data._id || prev.id,
            }));
        }
    };

    return (
        <div className="dashboard-page">
            {notification && (
                <Notification message={notification.message} type={notification.type} onClose={() => { }} />
            )}
            <div className="dashboard-container">
                {/* Header */}
                <header className="dashboard-header">
                    <div className="header-left">
                        <div className="logo">
                            <span className="dash-logo-icon">🌿</span>
                            <span className="dash-logo-text">Ayursutra</span>
                        </div>
                    </div>
                    <div className="header-right">
                        <NotificationBell userId={user.id || user._id} socketRef={socketRef} />

                        {/* Change Doctor button — compact */}
                        <button
                            onClick={() => setShowChangeDoctor(true)}
                            title="Change your assigned centre or doctor"
                            style={{
                                padding: '5px 10px',
                                borderRadius: '7px',
                                border: '1px solid #c8e6c9',
                                background: '#f0f9f0',
                                color: '#2a7d2e',
                                fontWeight: 600,
                                fontSize: '12px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                whiteSpace: 'nowrap',
                                transition: 'all 0.15s',
                            }}
                        >
                            🔄 Change Doctor
                        </button>

                        {/* Avatar dropdown menu */}
                        <div className="user-menu-wrapper" ref={menuRef}>
                            <button
                                className="user-menu-trigger"
                                onClick={() => setMenuOpen(prev => !prev)}
                                aria-label="User menu"
                            >
                                <div className="user-avatar">👤</div>
                                <div className="user-details">
                                    <span className="user-name">{user.name}</span>
                                    <span className="user-role">Patient · {user.centre || user.centreId || 'Wellness Centre'}</span>
                                </div>
                                <span className={`user-menu-caret${menuOpen ? ' open' : ''}`}>▼</span>
                            </button>

                            {menuOpen && (
                                <div className="user-menu-dropdown">
                                    <div className="user-menu-header">
                                        <div className="user-menu-header-name">{user.name}</div>
                                        <div className="user-menu-header-role">Patient · {user.centre || 'Wellness Centre'}</div>
                                    </div>
                                    <div className="user-menu-divider" />
                                    <button className="user-menu-item" onClick={() => { setMenuOpen(false); setShowChangeDoctor(true); }}>
                                        <span>🔄</span> Change Doctor / Centre
                                    </button>
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
                    <nav className="sidebar">
                        <div className="sidebar-menu">
                            {TABS.map(tab => (
                                <button
                                    key={tab.id}
                                    className={`menu-item ${activeTab === tab.id ? 'active' : ''}`}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    <span className="menu-icon">{tab.icon}</span>
                                    <span>{tab.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* Sidebar doctor info card */}
                        {(user.centre || user.centreId) && (
                            <div style={{
                                margin: '1rem',
                                padding: '0.75rem',
                                background: '#f0f9f0',
                                borderRadius: '10px',
                                border: '1px solid #c8e6c9',
                                fontSize: '0.78rem',
                                color: '#555',
                            }}>
                                <div style={{ fontWeight: 700, color: '#2a7d2e', marginBottom: '4px' }}>🏥 Your Centre</div>
                                <div>{user.centre || user.centreId}</div>
                                <button
                                    onClick={() => setShowChangeDoctor(true)}
                                    style={{
                                        marginTop: '6px',
                                        width: '100%',
                                        padding: '5px',
                                        background: '#fff',
                                        border: '1px solid #c8e6c9',
                                        borderRadius: '6px',
                                        color: '#2a7d2e',
                                        fontSize: '0.75rem',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                    }}
                                >
                                    🔄 Change Centre/Doctor
                                </button>
                            </div>
                        )}
                    </nav>

                    {/* Main Content */}
                    <main className="dashboard-main">
                        {activeTab === 'appointments'  && <AppointmentsTab user={user} showNotification={showNotification} socketRef={socketRef} />}
                        {activeTab === 'therapies'     && <TherapiesTab user={user} />}
                        {activeTab === 'tracking'      && <PatientTherapyTrackingTab user={user} showNotification={showNotification} socketRef={socketRef} />}
                        {activeTab === 'progress'      && <ProgressTab user={user} />}
                        {activeTab === 'diet'          && <DietPlansTab user={user} showNotification={showNotification} />}
                        {activeTab === 'prescriptions' && <PatientPrescriptionsTab user={user} showNotification={showNotification} socketRef={socketRef} />}
                        {activeTab === 'documents'     && <DocumentsTab user={user} showNotification={showNotification} />}
                        {activeTab === 'feedback'      && <FeedbackTab user={user} showNotification={showNotification} />}
                        {activeTab === 'notifications' && <PatientNotificationPrefsTab user={user} showNotification={showNotification} />}
                    </main>
                </div>
            </div>

            {/* Change Centre & Doctor Modal */}
            {showChangeDoctor && (
                <ChangeDoctorModal
                    user={user}
                    onClose={() => setShowChangeDoctor(false)}
                    onSuccess={handleReassignSuccess}
                    showNotification={showNotification}
                />
            )}
        </div>
    );
}
