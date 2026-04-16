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

const TABS = [
    { id: 'appointments', label: 'Appointments', icon: '📅' },
    { id: 'therapies', label: 'My Therapies', icon: '💆' },
    { id: 'tracking', label: 'Therapy Tracking', icon: '🌿' },
    { id: 'progress', label: 'Progress', icon: '📈' },
    { id: 'documents', label: 'Documents', icon: '📁' },
    { id: 'feedback', label: 'Feedback', icon: '💬' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
];

export default function PatientDashboard({ user: initialUser, onLogout, showNotification, notification }) {
    const [activeTab, setActiveTab] = useState('appointments');
    const [showChangeDoctor, setShowChangeDoctor] = useState(false);
    const [user, setUser] = useState(initialUser); // allow local update after reassign
    const socketRef = useRef(null);

    // Keep local user in sync if parent updates it
    useEffect(() => { setUser(initialUser); }, [initialUser]);

    useEffect(() => {
        const socket = io('http://localhost:5000', { transports: ['websocket', 'polling'] });
        socketRef.current = socket;
        const userId = user.id || user._id;
        if (userId) socket.emit('join_user_room', userId);

        // Listen for reassignment events from other devices / backend
        socket.on('patient_reassigned', (data) => {
            showNotification(`You have been reassigned to Dr. ${data.newDoctorName}`, 'info');
        });

        return () => socket.disconnect();
    }, [user]);

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
                        <div className="user-info">
                            <div className="user-avatar">👤</div>
                            <div className="user-details">
                                <span className="user-name">{user.name}</span>
                                <span className="user-role">Patient · {user.centre || user.centreId || 'Wellness Centre'}</span>
                            </div>
                        </div>
                        {/* Change Doctor / Centre Button */}
                        <button
                            onClick={() => setShowChangeDoctor(true)}
                            title="Change your assigned centre or doctor"
                            style={{
                                padding: '7px 14px',
                                borderRadius: '8px',
                                border: '1.5px solid #c8e6c9',
                                background: '#f0f9f0',
                                color: '#2a7d2e',
                                fontWeight: 600,
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                whiteSpace: 'nowrap',
                                transition: 'all 0.2s',
                            }}
                        >
                            🔄 Change Doctor
                        </button>
                        <button className="logout-btn" onClick={onLogout}>Logout</button>
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
                        {activeTab === 'appointments' && <AppointmentsTab user={user} showNotification={showNotification} socketRef={socketRef} />}
                        {activeTab === 'therapies' && <TherapiesTab user={user} />}
                        {activeTab === 'tracking' && <PatientTherapyTrackingTab user={user} showNotification={showNotification} socketRef={socketRef} />}
                        {activeTab === 'progress' && <ProgressTab user={user} />}
                        {activeTab === 'documents' && <DocumentsTab user={user} showNotification={showNotification} />}
                        {activeTab === 'feedback' && <FeedbackTab user={user} showNotification={showNotification} />}
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
