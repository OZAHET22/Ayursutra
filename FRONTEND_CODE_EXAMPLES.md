# 💻 FRONTEND CODE EXAMPLES - REAL PROJECT CODE

This document shows actual code from the Ayursutra project to demonstrate how everything works together.

---

## 📚 TABLE OF CONTENTS

1. [Component Structure](#component-structure)
2. [State Management](#state-management)
3. [API Communication](#api-communication)
4. [Real-Time Updates](#real-time-updates)
5. [Hooks Usage](#hooks-usage)
6. [Event Handling](#event-handling)

---

## 🏗️ COMPONENT STRUCTURE

### **Root Component (App.jsx)**

```jsx
// src/App.jsx
import { useState, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Notification from './components/Notification';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import AdminPanel from './pages/AdminPanel';
import './App.css';

function AppContent() {
  const { user, logout } = useAuth();  // Get user from Context
  const [currentPage, setCurrentPage] = useState('home');
  const [notification, setNotification] = useState(null);

  const showPage = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);  // Auto-hide after 3 seconds
  }, []);

  const handleLogout = () => {
    logout();
    setCurrentPage('home');
    showNotification('You have been logged out successfully.', 'info');
  };

  // If user is logged in, show their dashboard directly
  if (user) {
    if (user.role === 'patient') {
      return (
        <PatientDashboard 
          user={user} 
          onLogout={handleLogout} 
          showNotification={showNotification} 
          notification={notification} 
        />
      );
    }
    if (user.role === 'doctor') {
      return (
        <DoctorDashboard 
          user={user} 
          onLogout={handleLogout} 
          showNotification={showNotification} 
          notification={notification} 
        />
      );
    }
    if (user.role === 'admin') {
      return (
        <AdminPanel 
          user={user} 
          onLogout={handleLogout} 
          showNotification={showNotification} 
          notification={notification} 
        />
      );
    }
  }

  // Public pages
  return (
    <>
      <Navbar showPage={showPage} />
      <Notification notification={notification} />
      
      {currentPage === 'home' && <HomePage showPage={showPage} />}
      {currentPage === 'login' && <LoginPage showPage={showPage} showNotification={showNotification} />}
      {currentPage === 'signup' && <SignupPage showPage={showPage} showNotification={showNotification} />}
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
```

**Key Concepts:**
- ✅ Uses Context API for global state (user)
- ✅ Conditional rendering based on user role
- ✅ useCallback for memoized functions
- ✅ Props drilling: Pass functions and state down to children

---

## 🔐 STATE MANAGEMENT

### **AuthContext (Global State)**

```jsx
// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in (on app load)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token is still valid
      authService.getCurrentUser()
        .then(userData => setUser(userData))
        .catch(() => {
          localStorage.removeItem('token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const userData = await authService.login(email, password);
      setUser(userData);
      return userData;
    } catch (err) {
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = { user, loading, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

**How It Works:**
1. Wraps entire app with `<AuthProvider>`
2. On app load, checks localStorage for token
3. If token exists, verifies it's valid
4. Stores user data globally
5. Any component can access via `useAuth()` hook
6. Automatically redirects to login if token expires

---

### **Component Local State (FeedbackTab.jsx)**

```jsx
// src/pages/patient/FeedbackTab.jsx
import { useState, useEffect, useCallback } from 'react';
import * as feedbackService from '../../services/feedbackService';

export default function FeedbackTab({ user, showNotification }) {
  // Local State
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [selectedRating, setSelectedRating] = useState(0);
  
  // Edit States (NEW FEATURES)
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editRating, setEditRating] = useState(0);

  // Fetch feedback on component mount
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await feedbackService.getFeedback(1, 100);
      setFeedbacks(response?.data || []);
    } catch (err) {
      console.error('Failed to load feedback:', err);
      showNotification('Failed to load feedback. Please refresh.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  // Set up auto-refresh
  useEffect(() => {
    loadData();
    const interval = setInterval(async () => {
      try {
        const response = await feedbackService.getFeedback(1, 100);
        setFeedbacks(response?.data || []);
      } catch (err) {
        console.error('Auto-refresh failed:', err);
      }
    }, 15000);  // Refresh every 15 seconds
    return () => clearInterval(interval);
  }, [loadData]);

  // Submit new feedback
  const submitFeedback = async (e) => {
    e.preventDefault();
    if (selectedRating === 0) {
      showNotification('Please select a rating.', 'error');
      return;
    }
    try {
      await feedbackService.submitFeedback({
        content,
        rating: selectedRating,
        doctorId: user.preferredDoctor
      });
      setContent('');
      setSelectedRating(0);
      showNotification('Feedback submitted successfully!', 'success');
      loadData();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to submit feedback.', 'error');
    }
  };

  // Edit feedback
  const startEdit = (fb) => {
    if (fb.replied) {
      showNotification('Cannot edit feedback after doctor has replied.', 'error');
      return;
    }
    setEditingId(fb._id);
    setEditContent(fb.content);
    setEditRating(fb.rating);
  };

  const saveFeedbackEdit = async (id) => {
    if (editRating === 0) {
      showNotification('Please select a rating.', 'error');
      return;
    }
    try {
      await feedbackService.updateFeedback(id, {
        content: editContent.trim(),
        rating: editRating
      });
      showNotification('Feedback updated successfully!', 'success');
      setEditingId(null);
      loadData();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to update feedback.', 'error');
    }
  };

  // Delete feedback
  const deleteFeedback = async (id) => {
    if (!confirm('Are you sure you want to delete this feedback?')) return;
    try {
      await feedbackService.deleteFeedback(id);
      showNotification('Feedback deleted successfully!', 'success');
      loadData();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to delete feedback.', 'error');
    }
  };

  // Sort feedback
  const [sortBy, setSortBy] = useState('date-desc');
  const sorted = feedbacks
    .sort((a, b) => {
      if (sortBy === 'date-desc') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'rating-desc') return b.rating - a.rating;
      if (sortBy === 'rating-asc') return a.rating - b.rating;
      return new Date(a.createdAt) - new Date(b.createdAt);
    });

  // Loading state UI
  if (loading) return <div>Loading feedback...</div>;

  // Render feedback list
  return (
    <div className="feedback-tab">
      {/* Submit Form */}
      <form onSubmit={submitFeedback}>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Share your experience..."
        />
        <div>
          {[1, 2, 3, 4, 5].map(i => (
            <span
              key={i}
              onClick={() => setSelectedRating(i)}
              style={{ cursor: 'pointer' }}
            >
              {i <= selectedRating ? '⭐' : '☆'}
            </span>
          ))}
        </div>
        <button type="submit">Submit Feedback</button>
      </form>

      {/* Feedback List */}
      {sorted.map(fb => (
        <div key={fb._id} className="feedback-item">
          {editingId === fb._id ? (
            // Edit mode
            <div>
              <textarea value={editContent} onChange={e => setEditContent(e.target.value)} />
              <button onClick={() => saveFeedbackEdit(fb._id)}>Save</button>
              <button onClick={() => setEditingId(null)}>Cancel</button>
            </div>
          ) : (
            // Display mode
            <div>
              <div>{'⭐'.repeat(fb.rating)}</div>
              <div>{fb.content}</div>
              <button onClick={() => startEdit(fb)}>✏️ Edit</button>
              <button onClick={() => deleteFeedback(fb._id)}>🗑️ Delete</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

**State Management Concepts:**
- ✅ Multiple useState hooks for different data
- ✅ useCallback for memoized functions
- ✅ useEffect for side effects (data fetching)
- ✅ Proper error handling with try-catch
- ✅ Loading states for better UX
- ✅ Sorting/filtering data before rendering

---

## 📡 API COMMUNICATION

### **Axios Configuration (api.js)**

```jsx
// src/services/api.js
import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
});

// REQUEST INTERCEPTOR - Add JWT token to every request
API.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// RESPONSE INTERCEPTOR - Handle errors globally
API.interceptors.response.use(
  response => response,
  error => {
    // Handle 401 Unauthorized (token expired)
    if (error.response?.status === 401) {
      // Clear auth data
      localStorage.removeItem('token');
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;
```

**What This Does:**
1. Every request automatically includes JWT token
2. If token expires (401 error), logs out user
3. Centralizes error handling
4. No need to manually add token to each request

---

### **Service Layer (feedbackService.js)**

```jsx
// src/services/feedbackService.js
import API from './api';

// Get all feedback
export const getFeedback = async (page = 1, limit = 10) => {
  const res = await API.get('/feedback', { params: { page, limit } });
  return res.data;  // Returns { data: [...], pagination: {...} }
};

// Get single feedback
export const getFeedbackById = async (id) => {
  const res = await API.get(`/feedback/${id}`);
  return res.data.data;
};

// Submit new feedback
export const submitFeedback = async (data) => {
  const res = await API.post('/feedback', data);
  return res.data.data;
};

// Update feedback (patient can edit)
export const updateFeedback = async (id, data) => {
  const res = await API.put(`/feedback/${id}`, data);
  return res.data.data;
};

// Add reply to feedback (doctor)
export const replyFeedback = async (id, reply) => {
  const res = await API.put(`/feedback/${id}/reply`, { reply });
  return res.data.data;
};

// Update reply (doctor can edit)
export const updateReply = async (id, reply) => {
  const res = await API.patch(`/feedback/${id}/reply`, { reply });
  return res.data.data;
};

// Delete feedback (patient)
export const deleteFeedback = async (id) => {
  const res = await API.delete(`/feedback/${id}`);
  return res.data;
};

// Validation
export const validateFeedbackData = (feedback) => {
  const errors = [];
  if (!feedback.content || feedback.content.length < 10) {
    errors.push('Feedback must be at least 10 characters');
  }
  if (feedback.content?.length > 2000) {
    errors.push('Feedback cannot exceed 2000 characters');
  }
  if (!feedback.rating || feedback.rating < 1 || feedback.rating > 5) {
    errors.push('Rating must be between 1 and 5');
  }
  return errors;
};
```

**How It's Used:**
```jsx
// In a component
try {
  // Call service function - axios is hidden
  const feedback = await feedbackService.submitFeedback({
    content: 'Great service!',
    rating: 5,
    doctorId: 'doc123'
  });
  console.log('Submitted:', feedback);
} catch (err) {
  console.error('API error:', err);
}
```

**Benefits of Service Layer:**
- ✅ Centralized API logic
- ✅ Consistent error handling
- ✅ Easy to test
- ✅ Components don't know about HTTP details
- ✅ Easy to change API endpoints

---

## 🔌 REAL-TIME UPDATES

### **Socket.io Integration**

```jsx
// In Dashboard component
import { useEffect, useRef } from 'react';
import io from 'socket.io-client';

function PatientDashboard({ user }) {
  const socketRef = useRef(null);

  // Connect to WebSocket on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    socketRef.current = io('http://localhost:5000', {
      auth: { token }
    });

    // Listen for appointment booked event
    socketRef.current.on('appointment_booked', (data) => {
      console.log('New appointment from doctor:', data);
      // Refresh appointments
      loadAppointments();
    });

    // Listen for feedback reply
    socketRef.current.on('feedback_replied', (data) => {
      console.log('Doctor replied to feedback:', data);
      // Update feedback in real-time
      setFeedbacks(prev =>
        prev.map(f =>
          f._id === data.feedbackId
            ? { ...f, reply: data.reply, replied: true }
            : f
        )
      );
    });

    // Cleanup on unmount
    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  // Pass socket to child components via props
  return (
    <div>
      <AppointmentsTab socketRef={socketRef} />
      <FeedbackTab socketRef={socketRef} />
    </div>
  );
}
```

**Real-Time Event Flow:**
1. Doctor creates appointment
2. Backend emits `appointment_booked` event
3. Patient's browser receives event via WebSocket
4. React component updates state automatically
5. UI re-renders without page refresh

---

## 🎣 HOOKS USAGE

### **Common Hooks in Project**

```jsx
// useState - State management
const [feedbacks, setFeedbacks] = useState([]);
const [loading, setLoading] = useState(false);
const [editingId, setEditingId] = useState(null);

// useEffect - Side effects
useEffect(() => {
  // Run on mount
  loadData();
  
  // Auto-refresh interval
  const interval = setInterval(loadData, 15000);
  
  // Cleanup
  return () => clearInterval(interval);
}, [loadData]);  // Dependencies

// useCallback - Memoized function
const loadData = useCallback(async () => {
  try {
    const data = await feedbackService.getFeedback();
    setFeedbacks(data);
  } catch (err) {
    console.error(err);
  }
}, []);

// useRef - Reference to DOM element
const inputRef = useRef(null);
const handleFocus = () => inputRef.current.focus();

// useMemo - Memoized value
const sortedFeedbacks = useMemo(() => {
  return feedbacks.sort((a, b) =>
    new Date(b.createdAt) - new Date(a.createdAt)
  );
}, [feedbacks]);

// useContext - Access global state
const { user, logout } = useAuth();
```

### **Complex Hook Pattern: Auto-Refresh with Cleanup**

```jsx
useEffect(() => {
  // Initial load
  loadData();

  // Auto-refresh interval
  const interval = setInterval(() => {
    loadData();
  }, 15000);  // Every 15 seconds

  // Clean up interval on unmount or dependency change
  // This prevents multiple intervals from running
  return () => clearInterval(interval);
}, [loadData]);  // Re-run if loadData changes
```

---

## 🖱️ EVENT HANDLING

### **Different Types of Event Handlers**

```jsx
// 1. Click event
<button onClick={() => setEditingId(fb._id)}>
  Edit
</button>

// 2. Form submit
<form onSubmit={async (e) => {
  e.preventDefault();  // Prevent page reload
  await submitFeedback();
}}>
  <input required />
  <button type="submit">Submit</button>
</form>

// 3. Input change
<textarea
  value={content}
  onChange={(e) => setContent(e.target.value)}
  placeholder="Type here..."
/>

// 4. Select/dropdown
<select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
  <option value="date-desc">Newest First</option>
  <option value="rating-high">High Rating</option>
</select>

// 5. Mouse events
<div
  onMouseEnter={() => setHovered(true)}
  onMouseLeave={() => setHovered(false)}
>
  Hover me
</div>

// 6. Keyboard events
<input
  onKeyPress={(e) => {
    if (e.key === 'Enter') {
      submitFeedback();
    }
  }}
/>

// 7. Focus events
<input
  onFocus={() => setFocused(true)}
  onBlur={() => setFocused(false)}
/>
```

### **Event Handler Best Practice**

```jsx
// ❌ BAD - Creates new function on every render
<button onClick={() => console.log('clicked')}>Click</button>

// ✅ GOOD - Use useCallback for performance
const handleClick = useCallback(() => {
  console.log('clicked');
}, []);

<button onClick={handleClick}>Click</button>

// ✅ GOOD - For simple functions, inline is fine
<input onChange={(e) => setName(e.target.value)} />
```

---

## 📝 FORM HANDLING EXAMPLE

```jsx
// Complete form example from PatientDashboard

const [formData, setFormData] = useState({
  name: '',
  email: '',
  phone: '',
  age: '',
});
const [submitting, setSubmitting] = useState(false);

// Handle input changes - update specific field
const handleChange = (e) => {
  const { name, value } = e.target;
  setFormData(prev => ({
    ...prev,
    [name]: value
  }));
};

// Handle form submission
const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Validate
  if (!formData.name || !formData.email) {
    showNotification('Please fill all fields', 'error');
    return;
  }

  setSubmitting(true);
  try {
    // Call API
    const response = await userService.updateProfile(formData);
    showNotification('Profile updated!', 'success');
  } catch (err) {
    showNotification(err.response?.data?.message || 'Error!', 'error');
  } finally {
    setSubmitting(false);
  }
};

return (
  <form onSubmit={handleSubmit}>
    <input
      type="text"
      name="name"
      value={formData.name}
      onChange={handleChange}
      placeholder="Name"
    />
    <input
      type="email"
      name="email"
      value={formData.email}
      onChange={handleChange}
      placeholder="Email"
    />
    <button type="submit" disabled={submitting}>
      {submitting ? 'Saving...' : 'Update Profile'}
    </button>
  </form>
);
```

---

## 📊 CONDITIONAL RENDERING

```jsx
// 1. Simple if/else
if (loading) {
  return <div>Loading...</div>;
}

// 2. Ternary operator
return (
  <div>
    {user ? <Dashboard /> : <LoginPage />}
  </div>
);

// 3. Logical AND operator
return (
  <div>
    {feedbacks.length > 0 && (
      <FeedbackList feedbacks={feedbacks} />
    )}
  </div>
);

// 4. Switch statement
const renderContent = () => {
  switch(currentTab) {
    case 'appointments':
      return <AppointmentsTab />;
    case 'feedback':
      return <FeedbackTab />;
    case 'profile':
      return <ProfileTab />;
    default:
      return <div>Select a tab</div>;
  }
};

return renderContent();

// 5. Map/filter for lists
return (
  <ul>
    {feedbacks
      .filter(f => f.rating >= 4)  // Filter
      .map(f => (                    // Map
        <li key={f._id}>{f.content}</li>
      ))
    }
  </ul>
);
```

---

## 🎨 STYLING EXAMPLES

```jsx
// 1. Inline styles
<div style={{ 
  padding: '1rem', 
  background: '#f0f7f0',
  borderRadius: '8px'
}}>
  Content
</div>

// 2. Dynamic classes
<div className={`feedback-item ${editingId === fb._id ? 'editing' : ''}`}>
  Content
</div>

// 3. Template literals for classes
<div className={`
  feedback-item
  ${fb.replied ? 'replied' : 'pending'}
  ${fb.isEdited ? 'edited' : ''}
`}>
  Content
</div>

// 4. CSS classes from file
<div className="feedback-container">
  {/* Styles from App.css */}
</div>

// 5. Conditional styling
<div style={{
  opacity: isLoading ? 0.6 : 1,
  pointerEvents: isLoading ? 'none' : 'auto',
  cursor: fb.replied ? 'default' : 'pointer'
}}>
  {fb.content}
</div>
```

---

## 🔍 ERROR HANDLING PATTERNS

```jsx
// Pattern 1: try-catch-finally
const loadFeedback = async () => {
  try {
    setLoading(true);
    const data = await feedbackService.getFeedback();
    setFeedbacks(data);
  } catch (err) {
    console.error('Error:', err);
    showNotification('Failed to load feedback', 'error');
  } finally {
    setLoading(false);  // Always run
  }
};

// Pattern 2: Promise.then().catch()
feedbackService.getFeedback()
  .then(data => setFeedbacks(data))
  .catch(err => showNotification('Error!', 'error'))
  .finally(() => setLoading(false));

// Pattern 3: Async error in event handler
const handleDelete = async () => {
  try {
    await feedbackService.deleteFeedback(id);
    showNotification('Deleted!', 'success');
    loadData();  // Refresh
  } catch (err) {
    // Access backend error message
    showNotification(
      err.response?.data?.message || 'Delete failed',
      'error'
    );
  }
};

// Pattern 4: Validation before API call
const handleSubmit = (e) => {
  e.preventDefault();
  
  // Validate
  const errors = validateFeedbackData(formData);
  if (errors.length > 0) {
    showNotification(errors[0], 'error');
    return;  // Don't make API call
  }
  
  // If valid, make API call
  submitFeedback();
};
```

---

## 📚 SUMMARY

**Core Patterns Used:**
- ✅ Functional components with hooks
- ✅ useEffect for data fetching
- ✅ useState for local state
- ✅ useCallback for performance
- ✅ Context API for global state
- ✅ Service layer for API calls
- ✅ Error handling with try-catch
- ✅ Conditional rendering
- ✅ Event handling
- ✅ Real-time updates with Socket.io

**Languages & Technologies:**
- JavaScript (ES2020+)
- JSX (HTML in JavaScript)
- React 19.2.0
- Axios for HTTP
- Socket.io for real-time

This is a modern, professional React application following best practices!

---
