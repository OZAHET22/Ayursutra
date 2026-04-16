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
import AnalyticsTab from './doctor/AnalyticsTab';
import DoctorFeedbackTab from './doctor/FeedbackTab';
import InvoicesTab from './doctor/InvoicesTab';
import DoctorTherapyTrackingTab from './doctor/TherapyTrackingTab';
import DoctorNotificationsTab from './doctor/NotificationsTab';

const TABS = [
    { id: 'appointments', label: 'Appointments', icon: '📅' },
    { id: 'schedule', label: 'Schedule', icon: '🗓️' },
    { id: 'patients', label: 'Patients', icon: '👥' },
    { id: 'patientFiles', label: 'Patient Files', icon: '📁' },
    { id: 'therapies', label: 'Therapies', icon: '💆' },
    { id: 'tracking', label: 'Live Tracking', icon: '🔴' },
    { id: 'diet', label: 'Diet Table', icon: '🥗' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'feedback', label: 'Feedback', icon: '⭐' },
    { id: 'invoices', label: 'Invoices', icon: '💰' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
];

export default function DoctorDashboard({ user, onLogout, showNotification, notification }) {
    const [activeTab, setActiveTab] = useState('appointments');
    const socketRef = useRef(null);

    useEffect(() => {
        // Connect Socket.io and join user room
        const socket = io('http://localhost:5000', { transports: ['websocket', 'polling'] });
        socketRef.current = socket;
        const userId = user.id || user._id;
        if (userId) socket.emit('join_user_room', userId);
        return () => socket.disconnect();
    }, [user]);

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
                        <div className="user-info">
                            <div className="user-avatar">👨‍⚕️</div>
                            <div className="user-details">
                                <span className="user-name">{user.name}</span>
                                <span className="user-role">Doctor · {user.speciality || 'Ayurvedic Physician'}</span>
                            </div>
                        </div>
                        <button className="logout-btn" onClick={onLogout}>Logout</button>
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
                        {activeTab === 'patientFiles' && <PatientFilesTab user={user} />}
                        {activeTab === 'therapies' && <DoctorTherapiesTab user={user} showNotification={showNotification} />}
                        {activeTab === 'tracking' && <DoctorTherapyTrackingTab user={user} showNotification={showNotification} socketRef={socketRef} />}
                        { activeTab === 'schedule' && <ScheduleTab user={user} showNotification={showNotification} socketRef={socketRef} /> }
                        {activeTab === 'notifications' && <DoctorNotificationsTab user={user} showNotification={showNotification} />}
                        {activeTab === 'analytics' && <AnalyticsTab />}
                        {activeTab === 'feedback' && <DoctorFeedbackTab user={user} showNotification={showNotification} />}
                        {activeTab === 'invoices' && <InvoicesTab user={user} showNotification={showNotification} />}
                        {activeTab === 'diet' && <DietTableTab />}
                    </main>
                </div>
            </div>
        </div>
    );
}
