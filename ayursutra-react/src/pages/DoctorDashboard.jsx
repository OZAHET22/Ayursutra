import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import Notification from '../components/Notification';
import NotificationBell from '../components/NotificationBell';
import DoctorAppointmentsTab from './doctor/AppointmentsTab';
import PatientsTab from './doctor/PatientsTab';
import PatientFilesTab from './doctor/PatientFilesTab';
import DoctorTherapiesTab from './doctor/TherapiesTab';
import DietTableTab from './doctor/DietTableTab';
import ScheduleTab from './doctor/ScheduleTab';
import AvailabilityTab from './doctor/AvailabilityTab';
import AnalyticsTab from './doctor/AnalyticsTab';
import DoctorFeedbackTab from './doctor/FeedbackTab';
import DoctorTherapyTrackingTab from './doctor/TherapyTrackingTab';
import DoctorNotificationsTab from './doctor/NotificationsTab';
import TimeManagementTab from './doctor/TimeManagementTab';
import PrescriptionsTab from './doctor/PrescriptionsTab';

const TABS = [
    { id: 'appointments', label: 'Appointments', icon: '📅' },
    { id: 'schedule',     label: 'Schedule',      icon: '🗓️' },
    { id: 'availability', label: 'My Availability', icon: '⏰' },
    { id: 'timemgmt',    label: 'Time Management', icon: '⚙️' },
    { id: 'patients', label: 'Patients', icon: '👥' },
    { id: 'patientFiles', label: 'Patient Files', icon: '📁' },
    { id: 'therapies', label: 'Therapies', icon: '💆' },
    { id: 'tracking', label: 'Live Tracking', icon: '🔴' },
    { id: 'diet', label: 'Diet Table', icon: '🥗' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'feedback', label: 'Feedback', icon: '⭐' },
    { id: 'prescriptions', label: 'Prescriptions', icon: '💊' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
];

export default function DoctorDashboard({ user, onLogout, showNotification, notification }) {
    const [activeTab, setActiveTab] = useState('appointments');
    const [menuOpen, setMenuOpen] = useState(false);
    const socketRef = useRef(null);
    const menuRef = useRef(null);

    useEffect(() => {
        const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        // IMPORTANT: 'polling' MUST come first so Socket.io completes the HTTP
        // handshake before upgrading to WebSocket. Reversing this order causes
        // "WebSocket closed before connection established" errors.
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
        // Re-join room on reconnection
        socket.on('reconnect', () => {
            if (userId) socket.emit('join_user_room', userId);
        });
        return () => socket.disconnect();
    }, [user]);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className="dashboard-page">
            {notification && (
                <Notification message={notification.message} type={notification.type} onClose={() => { }} />
            )}
            <div className="dashboard-container">
                <header className="dashboard-header">
                    <div className="header-left">
                        <div className="logo">
                            <span className="dash-logo-icon">🌿</span>
                            <span className="dash-logo-text">Ayursutra</span>
                        </div>
                    </div>
                    <div className="header-right">
                        <NotificationBell userId={user.id || user._id} socketRef={socketRef} />

                        {/* Avatar dropdown menu */}
                        <div className="user-menu-wrapper" ref={menuRef}>
                            <button
                                className="user-menu-trigger"
                                onClick={() => setMenuOpen(prev => !prev)}
                                aria-label="User menu"
                            >
                                <div className="user-avatar">👨‍⚕️</div>
                                <div className="user-details">
                                    <span className="user-name">{user.name}</span>
                                    <span className="user-role">Doctor · {user.speciality || 'Ayurvedic Physician'}</span>
                                </div>
                                <span className={`user-menu-caret${menuOpen ? ' open' : ''}`}>▼</span>
                            </button>

                            {menuOpen && (
                                <div className="user-menu-dropdown">
                                    <div className="user-menu-header">
                                        <div className="user-menu-header-name">{user.name}</div>
                                        <div className="user-menu-header-role">Doctor · {user.speciality || 'Ayurvedic Physician'}</div>
                                    </div>
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
                    </nav>

                    <main className="dashboard-main">
                        {activeTab === 'appointments' && <DoctorAppointmentsTab user={user} showNotification={showNotification} socketRef={socketRef} />}
                        {activeTab === 'patients' && <PatientsTab user={user} showNotification={showNotification} />}
                        {activeTab === 'patientFiles' && <PatientFilesTab user={user} showNotification={showNotification} />}
                        {activeTab === 'therapies' && <DoctorTherapiesTab user={user} showNotification={showNotification} socketRef={socketRef} />}
                        {activeTab === 'tracking' && <DoctorTherapyTrackingTab user={user} showNotification={showNotification} socketRef={socketRef} />}
                        { activeTab === 'schedule' && <ScheduleTab user={user} showNotification={showNotification} socketRef={socketRef} /> }
                        {activeTab === 'availability' && <AvailabilityTab user={user} showNotification={showNotification} />}
                        {activeTab === 'timemgmt'    && <TimeManagementTab user={user} showNotification={showNotification} />}
                        {activeTab === 'notifications' && <DoctorNotificationsTab user={user} showNotification={showNotification} />}
                        {activeTab === 'analytics' && <AnalyticsTab user={user} />}
                        {activeTab === 'feedback' && <DoctorFeedbackTab user={user} showNotification={showNotification} />}
                        {activeTab === 'diet' && <DietTableTab user={user} showNotification={showNotification} />}
                        {activeTab === 'prescriptions' && <PrescriptionsTab user={user} showNotification={showNotification} />}
                    </main>
                </div>
            </div>
        </div>
    );
}

