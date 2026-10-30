# 🚀 FRONTEND TECHNOLOGY STACK - DETAILED GUIDE

**Project Name:** Ayursutra Healthcare Platform  
**Frontend:** React Application  
**Date:** April 17, 2026

---

## 📋 TABLE OF CONTENTS

1. [Primary Languages](#primary-languages)
2. [Framework & Build Tool](#framework--build-tool)
3. [Dependencies & Versions](#dependencies--versions)
4. [Project Structure](#project-structure)
5. [How It Works](#how-it-works)
6. [Architecture](#architecture)
7. [Data Flow](#data-flow)

---

## 🎯 PRIMARY LANGUAGES

### **1. JavaScript (ECMAScript 2020+)**

**Version:** ES2020+ (ESNext)

```javascript
// Modern JavaScript features used:
const name = 'Ayursutra';              // const/let (ES6)
const getData = async () => { }         // async/await (ES2017)
const [state, setState] = useState();   // Hooks (React)
const array = [...data];                // Spread operator (ES6)
const { name, age } = user;             // Destructuring (ES6)
const greet = `Hello ${name}`;          // Template literals (ES6)
```

**JavaScript Features Used in Project:**
- ✅ ES6 const/let
- ✅ Arrow functions `() => {}`
- ✅ Async/await for API calls
- ✅ Spread operator `...`
- ✅ Destructuring assignment
- ✅ Template literals with backticks
- ✅ Array methods: `map()`, `filter()`, `reduce()`
- ✅ Promise chains and async operations

---

### **2. JSX (JavaScript XML)**

**What is JSX?**
JSX allows you to write HTML-like syntax in JavaScript

**Example from Project:**
```jsx
// File: src/components/Navbar.jsx
function Navbar({ showPage }) {
  const [scrolled, setScrolled] = useState(false);
  
  return (
    <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
      <div className="nav-container">
        <div className="logo" onClick={() => showPage('home')}>
          <div className="logo-icon">🌿</div>
          <span className="logo-text">Ayursutra</span>
        </div>
      </div>
    </nav>
  );
}
```

**JSX Features Used:**
- ✅ HTML-like syntax in JavaScript
- ✅ Dynamic attributes: `className={}`
- ✅ Event handlers: `onClick={}`
- ✅ Embedded expressions: `{variable}`
- ✅ Conditional rendering: `{condition ? true : false}`
- ✅ Lists with `map()`: `{array.map(item => <div>{item}</div>)}`
- ✅ Component composition

---

### **3. CSS (Cascading Style Sheets)**

**Files:**
- `App.css` - Main application styles
- `dashboard.css` - Dashboard specific styles
- `index.css` - Global styles

**Type:** Plain CSS (No preprocessor like SASS/LESS)

```css
/* Example from App.css */
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: linear-gradient(135deg, #2a7d2e, #4caf50);
  padding: 1rem 2rem;
  z-index: 100;
}

.navbar.scrolled {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
```

---

## ⚛️ FRAMEWORK & BUILD TOOL

### **React - UI Framework**

**Version:** ^19.2.0 (Latest)

**What is React?**
React is a JavaScript library for building user interfaces with reusable components

**React Concepts Used:**

#### **1. Components**
```jsx
// Functional Component
function LoginPage({ showPage, showNotification }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const handleLogin = async () => {
    // Login logic
  };
  
  return (
    <div className="login-container">
      <input value={email} onChange={e => setEmail(e.target.value)} />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}
```

#### **2. Hooks**
```jsx
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

// useState - State management
const [count, setCount] = useState(0);

// useEffect - Side effects
useEffect(() => {
  console.log('Component mounted');
  return () => console.log('Component unmounted');
}, []);

// useCallback - Memoized functions
const handleClick = useCallback(() => {
  setCount(prev => prev + 1);
}, []);

// useRef - Reference to DOM element
const inputRef = useRef(null);

// useMemo - Memoized values
const expensiveValue = useMemo(() => {
  return complexCalculation();
}, [dependency]);
```

#### **3. Props & State**
```jsx
// Props - Pass data to components
<PatientDashboard 
  user={user} 
  showNotification={showNotification} 
/>

// State - Component data
const [user, setUser] = useState(null);
const [loading, setLoading] = useState(false);
```

#### **4. Context API**
```jsx
// src/context/AuthContext.jsx
import { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  
  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
```

---

### **Vite - Build Tool**

**Version:** ^7.3.1

**What is Vite?**
Vite is a modern build tool that provides fast development and optimized production builds

**Vite Configuration:**
```javascript
// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Vite will automatically handle:
  // - Hot Module Replacement (HMR)
  // - Module bundling
  // - Code splitting
  // - Tree shaking (dead code removal)
  // - CSS processing
})
```

**How Vite Works:**
1. **Development:** Serves unprocessed modules via ES modules (instant)
2. **Build:** Bundles and minifies code for production
3. **Hot Reload:** Automatically refreshes when you save files

---

## 📦 DEPENDENCIES & VERSIONS

### **Production Dependencies**

```json
{
  "react": "^19.2.0",                    // Core React library
  "react-dom": "^19.2.0",                // React DOM rendering
  "axios": "^1.13.6",                   // HTTP client for API calls
  "socket.io-client": "^4.8.3",         // Real-time WebSocket communication
  "firebase": "^12.12.0",               // Firebase (authentication, storage)
  "chart.js": "^4.5.1",                 // Chart library
  "react-chartjs-2": "^5.3.1",          // React wrapper for Chart.js
  "recharts": "^3.8.1"                  // React charts library
}
```

### **Development Dependencies**

```json
{
  "vite": "^7.3.1",                     // Build tool
  "@vitejs/plugin-react": "^5.1.1",     // React plugin for Vite
  "eslint": "^9.39.1",                  // Code quality tool
  "@eslint/js": "^9.39.1",              // ESLint JavaScript config
  "eslint-plugin-react-hooks": "^7.0.1", // React Hooks linting
  "eslint-plugin-react-refresh": "^0.4.24", // React Refresh linting
  "@types/react": "^19.2.7",            // Type definitions for React
  "@types/react-dom": "^19.2.3"         // Type definitions for React DOM
}
```

---

## 📁 PROJECT STRUCTURE

```
ayursutra-react/
├── src/
│   ├── assets/                    # Images, icons, static files
│   ├── components/                # Reusable React components
│   │   ├── Navbar.jsx            # Navigation bar
│   │   ├── Notification.jsx       # Toast notifications
│   │   ├── NotificationBell.jsx   # Bell icon for notifications
│   │   ├── OtpVerificationScreen.jsx
│   │   ├── SlotPicker.jsx         # Time slot picker
│   │   └── ChangeDoctorModal.jsx  # Modal for changing doctor
│   ├── context/
│   │   └── AuthContext.jsx        # Authentication context (global state)
│   ├── pages/                     # Full page components
│   │   ├── HomePage.jsx           # Landing page
│   │   ├── LoginPage.jsx          # Patient login
│   │   ├── SignupPage.jsx         # Patient registration
│   │   ├── AdminLoginPage.jsx     # Admin login
│   │   ├── PatientDashboard.jsx   # Patient main dashboard
│   │   ├── DoctorDashboard.jsx    # Doctor main dashboard
│   │   ├── AdminPanel.jsx         # Admin panel
│   │   ├── doctor/                # Doctor-specific pages
│   │   │   ├── AppointmentsTab.jsx
│   │   │   ├── InvoicesTab.jsx
│   │   │   ├── FeedbackTab.jsx
│   │   │   ├── TherapiesTab.jsx
│   │   │   ├── AnalyticsTab.jsx
│   │   │   └── ... more tabs
│   │   └── patient/               # Patient-specific pages
│   │       ├── AppointmentsTab.jsx
│   │       ├── FeedbackTab.jsx
│   │       ├── DocumentsTab.jsx
│   │       └── ... more tabs
│   ├── services/                  # API service layer
│   │   ├── api.js                 # Axios configuration & interceptors
│   │   ├── authService.js         # Authentication APIs
│   │   ├── appointmentService.js  # Appointment APIs
│   │   ├── feedbackService.js     # Feedback APIs
│   │   ├── invoiceService.js      # Invoice APIs
│   │   ├── userService.js         # User APIs
│   │   └── ... more services
│   ├── data/
│   │   └── mockData.js            # Mock data for development
│   ├── App.jsx                    # Root app component
│   ├── main.jsx                   # Entry point
│   ├── App.css                    # App styles
│   ├── dashboard.css              # Dashboard styles
│   └── index.css                  # Global styles
├── index.html                     # HTML template
├── vite.config.js                 # Vite configuration
├── eslint.config.js               # ESLint configuration
└── package.json                   # Project dependencies
```

---

## 🔄 HOW IT WORKS

### **Startup Process**

```
1. User opens browser → loads index.html
2. index.html loads main.jsx
3. main.jsx:
   - Imports React and creates root
   - Renders App component
   
4. App.jsx:
   - Wraps app with AuthProvider (Context)
   - Checks if user is logged in
   - Shows appropriate page (home, login, dashboard)

5. Page Component (e.g., PatientDashboard):
   - Loads with useState hooks for state
   - useEffect fetches initial data from backend
   - Renders UI based on state
```

### **Code Example: How Login Works**

```jsx
// Step 1: User enters email/password in LoginPage
function LoginPage({ showPage, showNotification }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const handleLogin = async () => {
    try {
      // Step 2: Call backend API using authService
      const response = await authService.login(email, password);
      
      // Step 3: Backend returns JWT token
      // Step 4: authService stores token in localStorage
      // Step 5: AuthContext updates with user data
      
      showNotification('Login successful!', 'success');
      // Step 6: App automatically shows dashboard
    } catch (err) {
      showNotification('Login failed!', 'error');
    }
  };
  
  return (
    <div>
      <input value={email} onChange={e => setEmail(e.target.value)} />
      <input value={password} onChange={e => setPassword(e.target.value)} />
      <button onClick={handleLogin}>Login</button>
    </div>
  );
}
```

### **How API Calls Work**

```jsx
// File: src/services/feedbackService.js
import API from './api';

export const getFeedback = async (page = 1, limit = 10) => {
  // Step 1: API automatically adds JWT token from localStorage
  const res = await API.get('/feedback', { params: { page, limit } });
  // Step 2: Returns data from backend
  return res.data;
};

// File: src/services/api.js
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api'
});

// Interceptor - adds token to every request
API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor - handles token expiration
API.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Token expired - logout user
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;
```

---

## 🏗️ ARCHITECTURE

### **Component Hierarchy**

```
App.jsx (Root)
├── AuthProvider (Context)
├── Navbar (Navigation)
├── Notification (Toast messages)
└── Page Components
    ├── HomePage
    ├── LoginPage
    ├── SignupPage
    ├── PatientDashboard
    │   ├── AppointmentsTab
    │   ├── FeedbackTab
    │   ├── DocumentsTab
    │   └── ... more tabs
    ├── DoctorDashboard
    │   ├── AppointmentsTab
    │   ├── FeedbackTab
    │   ├── InvoicesTab
    │   └── ... more tabs
    └── AdminPanel
```

### **Data Flow**

```
User Interaction
    ↓
Component State Update (useState)
    ↓
Event Handler (onClick, onChange, etc)
    ↓
API Call (via service layer)
    ↓
Backend Response
    ↓
Update Component State
    ↓
Re-render UI
```

### **Example: Feedback Submission**

```
1. User types feedback in textarea
   → onChange updates state: setContent(e.target.value)

2. User clicks "Submit Feedback" button
   → onClick calls submitFeedback()

3. submitFeedback() function:
   → Validates input
   → Calls feedbackService.submitFeedback(data)
   → feedbackService sends POST to /api/feedback
   → API adds JWT token automatically
   
4. Backend processes and returns response
   → setFeedbacks(newData) updates state
   
5. Component re-renders with updated feedback list
   → User sees their new feedback in the list
```

---

## 📡 DATA FLOW

### **Real-Time Updates with Socket.io**

```javascript
// File: src/services/api.js or main context
import io from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: { token: localStorage.getItem('token') }
});

// Listen for real-time updates
socket.on('appointment_booked', (data) => {
  // Refresh appointments list
  loadAppointments();
});

socket.on('feedback_replied', (data) => {
  // Update specific feedback
  setFeedbacks(prev => prev.map(f => 
    f._id === data.feedbackId ? { ...f, reply: data.reply } : f
  ));
});
```

### **State Management Flow**

```
Global State (AuthContext)
├── user (logged-in user data)
├── token (JWT token)
└── logout (function to logout)

Component State (useState)
├── feedbacks (array of feedback items)
├── appointments (array of appointments)
├── loading (boolean for loading state)
└── ... other local state
```

---

## 🎨 STYLING APPROACH

### **CSS Organization**

```css
/* Global styles - index.css */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: #f5f5f5;
}

/* App-wide styles - App.css */
.navbar { }
.container { }
.button { }

/* Dashboard styles - dashboard.css */
.dashboard { }
.tab-content { }
.card { }

/* Inline styles in JSX - for dynamic styles */
<div style={{ 
  padding: '1rem', 
  background: '#f0f7f0',
  borderRadius: '8px'
}}>
  Dynamic content
</div>
```

---

## 🚀 BUILD & RUN PROCESS

### **Development Mode**

```bash
cd ayursutra-react
npm install      # Install dependencies
npm run dev      # Start development server

# Output:
# VITE v7.3.1 ready in 245 ms
# ➜  Local:   http://localhost:5173/
# ➜  Press h to show help
```

**What Vite Does in Dev Mode:**
1. Starts a local dev server on port 5173
2. Watches for file changes
3. Hot Module Replacement (HMR) - updates without full reload
4. Serves unprocessed modules for instant updates
5. Provides detailed error messages

### **Production Build**

```bash
npm run build    # Creates optimized build

# Output:
# dist/
# ├── index.html
# ├── assets/
# │   ├── index-xxxxx.js   (minified JavaScript)
# │   └── index-xxxxx.css  (minified CSS)
```

**What Build Does:**
1. Bundles all JavaScript files
2. Minifies code (removes whitespace/comments)
3. Tree-shaking (removes unused code)
4. Asset optimization (images, fonts)
5. Code splitting for faster loading
6. Creates `dist/` folder for deployment

---

## 📊 VERSION SPECIFICATIONS

| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | ^19.2.0 | UI Framework (Latest) |
| **React DOM** | ^19.2.0 | React rendering |
| **Vite** | ^7.3.1 | Build tool |
| **Axios** | ^1.13.6 | HTTP requests |
| **Socket.io Client** | ^4.8.3 | Real-time communication |
| **Firebase** | ^12.12.0 | Authentication/Storage |
| **Chart.js** | ^4.5.1 | Charts/Graphs |
| **ESLint** | ^9.39.1 | Code quality |
| **Node.js** | 18.x+ | Runtime (recommended) |
| **npm** | 8.x+ | Package manager |

---

## ✨ KEY FEATURES & HOW THEY WORK

### **1. Authentication**
- **How:** JWT token stored in localStorage
- **Files:** `context/AuthContext.jsx`, `services/authService.js`
- **Process:** User login → Backend returns token → Token sent with every API call

### **2. Real-Time Updates**
- **How:** WebSocket via Socket.io
- **Files:** Configured in services
- **Process:** Backend emits event → Client listens → UI updates instantly

### **3. API Communication**
- **How:** Axios HTTP client with interceptors
- **Files:** `services/api.js` + individual service files
- **Process:** Components → Service layer → Axios → Backend API

### **4. State Management**
- **How:** React Context API + useState hooks
- **Files:** `context/AuthContext.jsx`
- **Process:** Global state in Context → Components read/update state

### **5. Dashboard Navigation**
- **How:** Conditional rendering based on user role
- **Files:** `App.jsx` checks user.role
- **Process:** Patient/Doctor/Admin → Different UI rendered

---

## 🎯 TYPICAL USER FLOW

```
1. User visits localhost:5173
   ↓
2. Loads index.html → main.jsx → App.jsx
   ↓
3. App checks if user is logged in (AuthContext)
   ↓
4. If NOT logged in:
   - Shows HomePage/LoginPage
   ↓
5. If logged in:
   - Shows appropriate dashboard
   - useEffect fetches data from backend
   - Renders components with data
   ↓
6. User interacts (clicks buttons, fills forms)
   ↓
7. Component updates state → Re-renders
   ↓
8. If API call needed:
   - Calls service function
   - Service uses axios (with token)
   - Backend processes request
   - Updates component state
   - UI re-renders with new data
```

---

## 💡 SUMMARY

**Frontend Stack:**
- 🎯 **Language:** JavaScript (ES2020+) + JSX
- ⚛️ **Framework:** React 19.2.0
- 🚀 **Build Tool:** Vite 7.3.1
- 📡 **API Client:** Axios
- 🔌 **Real-time:** Socket.io
- 🎨 **Styling:** Plain CSS
- 🔐 **Auth:** JWT tokens + Context API
- 📦 **Bundler:** Vite (ES modules)

**How It Works:**
1. User opens browser → Loads React app via Vite
2. App checks authentication via Context API
3. Shows appropriate UI based on user role
4. Components make API calls via Axios service layer
5. Real-time updates via Socket.io
6. State updates trigger re-renders
7. Fully functional SPA (Single Page Application)

---
