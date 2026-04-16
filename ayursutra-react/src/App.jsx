import { useState, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Notification from './components/Notification';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import AdminPanel from './pages/AdminPanel';
import AdminLoginPage from './pages/AdminLoginPage';
import './App.css';
import './dashboard.css';

function AppContent() {
  const { user, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState('home');
  const [notification, setNotification] = useState(null);

  const showPage = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const handleLogout = () => {
    logout();
    setCurrentPage('home');
    showNotification('You have been logged out successfully.', 'info');
  };

  // If user is logged in, show their dashboard directly
  if (user) {
    if (user.role === 'patient') {
      return <PatientDashboard user={user} onLogout={handleLogout} showNotification={showNotification} notification={notification} />;
    }
    if (user.role === 'doctor') {
      return <DoctorDashboard user={user} onLogout={handleLogout} showNotification={showNotification} notification={notification} />;
    }
    if (user.role === 'admin') {
      return <AdminPanel user={user} onLogout={handleLogout} showNotification={showNotification} notification={notification} />;
    }
  }

  // Public pages
  return (
    <>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      {currentPage !== 'login' && currentPage !== 'signup' && currentPage !== 'admin-login' && (
        <Navbar showPage={showPage} />
      )}
      {currentPage === 'home' && <HomePage showPage={showPage} />}
      {currentPage === 'login' && (
        <LoginPage
          showPage={showPage}
          showNotification={showNotification}
        />
      )}
      {currentPage === 'admin-login' && (
        <AdminLoginPage
          showPage={showPage}
          showNotification={showNotification}
        />
      )}
      {currentPage === 'signup' && (
        <SignupPage
          showPage={showPage}
          showNotification={showNotification}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
