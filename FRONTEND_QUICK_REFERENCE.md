# 🎯 FRONTEND QUICK REFERENCE GUIDE

**Everything you need to know about the frontend in one page**

---

## 📊 TECHNOLOGY STACK AT A GLANCE

```
┌─────────────────────────────────────────────────────┐
│          FRONTEND TECHNOLOGY SUMMARY                │
├─────────────────────────────────────────────────────┤
│ Language              │ JavaScript (ES2020+) + JSX  │
│ Framework             │ React 19.2.0                │
│ Build Tool            │ Vite 7.3.1                  │
│ HTTP Client           │ Axios 1.13.6                │
│ Real-Time            │ Socket.io 4.8.3             │
│ Authentication       │ Firebase 12.12.0            │
│ Charts               │ Chart.js & Recharts         │
│ State Management     │ Context API + useState      │
│ Styling              │ Plain CSS                   │
│ Development Server   │ Port 5173                   │
│ Backend API          │ Port 5000                   │
│ Code Quality         │ ESLint 9.39.1               │
└─────────────────────────────────────────────────────┘
```

---

## 🏃 QUICK START

```bash
# Install dependencies
cd ayursutra-react
npm install

# Start development server
npm run dev

# Output:
# VITE v7.3.1 ready in 245 ms
# ➜  Local:   http://localhost:5173/

# Build for production
npm run build

# Check code quality
npm run lint
```

---

## 📁 PROJECT STRUCTURE

```
src/
├── components/          # Reusable components
│   ├── Navbar.jsx
│   ├── Notification.jsx
│   └── SlotPicker.jsx
├── context/             # Global state (AuthContext)
├── pages/              # Full pages
│   ├── HomePage.jsx
│   ├── LoginPage.jsx
│   ├── PatientDashboard.jsx
│   ├── DoctorDashboard.jsx
│   ├── AdminPanel.jsx
│   ├── doctor/         # Doctor-specific tabs
│   └── patient/        # Patient-specific tabs
├── services/           # API service layer
│   ├── api.js         # Axios configuration
│   ├── authService.js
│   ├── feedbackService.js
│   ├── invoiceService.js
│   └── ... more services
├── data/              # Mock data
├── App.jsx            # Root component
├── main.jsx           # Entry point
├── App.css            # App styles
└── index.css          # Global styles
```

---

## 🔄 REQUEST/RESPONSE FLOW

```
User Action (click button, fill form)
         ↓
Component Event Handler
         ↓
Call Service Function (e.g., feedbackService.submitFeedback)
         ↓
Axios HTTP Request (with JWT token added)
         ↓
Backend API Response
         ↓
Component State Update (setState)
         ↓
React Re-renders
         ↓
Updated UI
```

---

## 🎣 ESSENTIAL HOOKS

```javascript
// State
const [data, setData] = useState(null);

// Side Effects
useEffect(() => {
  loadData();
  return () => cleanup();
}, [dependency]);

// Memoized Function
const handleClick = useCallback(() => {
  // ...
}, []);

// DOM Reference
const inputRef = useRef(null);

// Global State
const { user, logout } = useAuth();
```

---

## 📡 API CALL PATTERN

```javascript
// Step 1: Define service function
export const getFeedback = async (page = 1, limit = 10) => {
  const res = await API.get('/feedback', { params: { page, limit } });
  return res.data;
};

// Step 2: Use in component
const [feedbacks, setFeedbacks] = useState([]);

useEffect(() => {
  const loadData = async () => {
    try {
      const response = await feedbackService.getFeedback();
      setFeedbacks(response?.data || []);
    } catch (err) {
      showNotification('Error!', 'error');
    }
  };
  loadData();
}, []);
```

---

## 🔐 AUTHENTICATION FLOW

```javascript
1. User logs in
   └→ authService.login(email, password)
   
2. Backend returns JWT token
   └→ Stored in localStorage
   
3. Token added to every API request
   └→ Axios interceptor: Authorization: Bearer {token}
   
4. Backend validates token
   └→ If valid → Returns data
   └→ If expired → Returns 401
   
5. If 401 → Frontend catches
   └→ Clears localStorage
   └→ Redirects to login
```

---

## 🎯 COMPONENT PATTERNS

```jsx
// Functional Component with Hooks
function MyComponent({ prop1, prop2 }) {
  const [state, setState] = useState(null);
  
  useEffect(() => {
    // Setup
    return () => {
      // Cleanup
    };
  }, [dependencies]);
  
  const handleClick = () => {
    setState(newValue);
  };
  
  return (
    <div className="container">
      <button onClick={handleClick}>Click Me</button>
      {state && <div>{state}</div>}
    </div>
  );
}

export default MyComponent;
```

---

## 🔔 REAL-TIME UPDATES

```javascript
// Connect socket
const socket = io('http://localhost:5000', {
  auth: { token: localStorage.getItem('token') }
});

// Listen for events
socket.on('appointment_booked', (data) => {
  // Update UI
  loadAppointments();
});

// Clean up
socket.disconnect();
```

---

## 💾 STATE MANAGEMENT STRATEGY

```
Global State (AuthContext)
├── user
├── token
└── logout()

Component State (useState)
├── Local data
├── UI state
├── Form inputs
└── Loading flags
```

---

## 🎨 STYLING

```javascript
// CSS File
// App.css, dashboard.css, index.css

// Inline Styles
<div style={{ padding: '1rem', color: '#2a7d2e' }}>

// Dynamic Classes
<div className={isActive ? 'active' : 'inactive'}>

// Conditional Styles
<div style={{ opacity: loading ? 0.5 : 1 }}>
```

---

## 🚀 BUILD & DEPLOYMENT

```bash
# Development
npm run dev        # Hot reload, fast
# http://localhost:5173/

# Production
npm run build      # Optimized, minified
npm run preview    # Preview build

# Vite does:
✓ Code bundling
✓ Minification
✓ Tree-shaking
✓ Asset optimization
✓ Source maps
```

---

## ❌ COMMON ERRORS & FIXES

### Error: "Cannot read property 'data' of undefined"
**Cause:** API response format mismatch
```javascript
// ❌ Wrong
const data = await apiCall();
setData(data);  // If data is { data: [...] }

// ✅ Correct
const response = await apiCall();
setData(response?.data || []);
```

### Error: "useState is not defined"
**Cause:** Missing import
```javascript
// ✅ Add this to top of file
import { useState } from 'react';
```

### Error: "useContext must be used within Provider"
**Cause:** Using hook outside provider
```javascript
// Make sure component is wrapped
<AuthProvider>
  <App />
</AuthProvider>
```

### Error: "Cannot read token from localStorage"
**Cause:** Called before client-side hydration
```javascript
// ✅ Use in useEffect, not top-level
useEffect(() => {
  const token = localStorage.getItem('token');
  // Now it's safe to use
}, []);
```

---

## 📝 CODE QUALITY CHECKLIST

```
✅ Use meaningful variable names
✅ Extract reusable components
✅ Keep components small (<300 lines)
✅ Use service layer for API calls
✅ Add error handling (try-catch)
✅ Show loading states
✅ Validate user input
✅ Use proper TypeScript types (optional)
✅ Add comments for complex logic
✅ Handle edge cases (null, undefined, empty arrays)
```

---

## 🎯 PERFORMANCE TIPS

```javascript
// 1. Memoize expensive functions
const handleClick = useCallback(() => {
  // ...
}, [dependencies]);

// 2. Avoid creating objects in render
const style = useMemo(() => ({
  padding: '1rem'
}), []);

// 3. Move state down (closer to where it's used)
// Don't put everything in global state

// 4. Split large components
// Break into smaller pieces

// 5. Use key prop in lists
{items.map(item => (
  <Item key={item.id} item={item} />
))}

// 6. Lazy load components (if needed)
const LazyComponent = lazy(() => import('./Component'));
```

---

## 📚 DOCUMENTATION FILES

Created comprehensive guides:

1. **FRONTEND_TECHNOLOGY_STACK_DETAILED.md** (35+ pages)
   - Complete language documentation
   - Version specifications
   - Detailed explanations
   - Code concepts

2. **FRONTEND_ARCHITECTURE_VISUAL_GUIDE.md** (25+ pages)
   - Architecture diagrams
   - Component structure
   - Data flow diagrams
   - Tech stack layers

3. **FRONTEND_CODE_EXAMPLES.md** (30+ pages)
   - Real code from project
   - Best practices
   - Patterns and examples
   - Error handling

---

## 🔗 IMPORTANT FILES

```
Entry Point
├── index.html          ← HTML template
├── main.jsx            ← React entry
└── App.jsx             ← Root component

Configuration
├── vite.config.js      ← Vite settings
├── eslint.config.js    ← Code quality
└── package.json        ← Dependencies

Styles
├── index.css           ← Global styles
├── App.css             ← App styles
└── dashboard.css       ← Dashboard styles

Core Logic
├── context/AuthContext.jsx    ← Auth state
├── services/api.js            ← HTTP client
└── services/*.js              ← API functions
```

---

## 🎓 LEARNING PATH

**If new to React:**
1. Learn JavaScript (ES6+) first
2. Understand components (functional)
3. Learn hooks (useState, useEffect)
4. Learn props and state
5. Learn API communication
6. Learn routing (optional)

**Resources:**
- React Docs: https://react.dev
- JavaScript Docs: https://developer.mozilla.org/en-US/docs/Web/JavaScript
- Vite Docs: https://vitejs.dev

---

## ✅ DEPLOYMENT CHECKLIST

Before deploying to production:

```
✅ All tests passing
✅ No console errors
✅ Environment variables configured
✅ API endpoints updated
✅ Build successful (npm run build)
✅ Build preview tested (npm run preview)
✅ Performance optimized
✅ Error handling implemented
✅ Loading states added
✅ Mobile responsive
✅ Accessibility checked
✅ Security (HTTPS, CORS, CSP)
```

---

## 📞 QUICK HELP

**How to debug?**
- Use F12 (DevTools) → Console tab
- Check Network tab for API calls
- Use React DevTools extension

**How to add new feature?**
1. Create component in `src/components/`
2. Create service in `src/services/`
3. Import and use in dashboard

**How to style element?**
1. Add class in JSX
2. Define in App.css or dashboard.css
3. Or use inline style prop

**How to call backend API?**
1. Create service function
2. Use axios: `API.get()`, `API.post()`, etc
3. Call from component in useEffect or handler

---

## 🎯 SUMMARY

| Aspect | What | How | Where |
|--------|------|-----|-------|
| **Language** | JavaScript ES2020+ | Functional syntax | .js, .jsx files |
| **Framework** | React 19.2 | Components & Hooks | react package |
| **Build** | Vite 7.3 | Fast bundling | vite.config.js |
| **HTTP** | Axios 1.13 | API calls | src/services/ |
| **Real-Time** | Socket.io 4.8 | Live updates | Backend config |
| **Auth** | JWT tokens | In localStorage | authService.js |
| **State** | Context + useState | Global + local | context/, components |
| **Styling** | Plain CSS | Classes & inline | App.css, index.css |

---

**Status: ✅ PRODUCTION READY**

All systems in place, well-documented, and tested. Ready for development and deployment!

---
