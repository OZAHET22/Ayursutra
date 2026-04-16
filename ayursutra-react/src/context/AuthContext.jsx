import { createContext, useContext, useState, useEffect } from 'react';
import * as authService from '../services/authService';

export const AuthContext = createContext(null);

export const CENTRES = [
    { id: 'delhi',       name: 'Delhi Ayurvedic Centre' },
    { id: 'mumbai',      name: 'Mumbai Panchakarma Clinic' },
    { id: 'bangalore',   name: 'Bangalore Wellness Hub' },
    { id: 'pune',        name: 'Pune Healing Centre' },
    { id: 'mehsana',     name: 'Mehsana Healing Centre' },
    { id: 'ahmadabad',   name: 'Ahmadabad Healing Centre' },
    { id: 'gandhinagar', name: 'Gandhinagar Healing Centre' },
];

export function AuthProvider({ children }) {
    const [user, setUser]     = useState(null);
    const [loading, setLoading] = useState(true);

    // On app start: restore session from localStorage
    useEffect(() => {
        const storedUser  = authService.getStoredUser();
        const storedToken = authService.getStoredToken();
        if (storedUser && storedToken) {
            setUser(storedUser);
        }
        setLoading(false);
    }, []);

    // ── Full login (demo / admin) — stores session immediately ──────────────
    const login = async (email, password) => {
        try {
            const data = await authService.login(email, password);
            if (data.success) {
                setUser(data.user);
                return { success: true, role: data.user.role, user: data.user, token: data.token };
            }
            return { success: false };
        } catch (err) {
            const msg = err.response?.data?.message || 'Login failed';
            return { success: false, message: msg };
        }
    };

    // ── Step 1: verify credentials only — does NOT log user in yet ──────────
    // Returns { success, user, token } WITHOUT changing React state or localStorage.
    // OTP screen is shown after this returns success.
    const verifyCredentials = async (email, password) => {
        try {
            const data = await authService.verifyCredentials(email, password);
            if (data.success) {
                return { success: true, role: data.user.role, user: data.user, token: data.token };
            }
            return { success: false, message: data.message };
        } catch (err) {
            const msg = err.response?.data?.message || 'Login failed';
            return { success: false, message: msg };
        }
    };

    // ── Step 2: complete login after OTP is verified ─────────────────────────
    // userData and token come from the verifyCredentials() result stored in LoginPage state.
    const completeLogin = (userData, token) => {
        authService.persistSession(userData, token);
        setUser(userData); // ← NOW renders dashboard
    };

    // ── Logout ────────────────────────────────────────────────────────────────
    const logout = () => {
        authService.logout();
        setUser(null);
    };

    // ── Register ──────────────────────────────────────────────────────────────
    const register = async (data) => {
        try {
            const result = await authService.register(data);
            if (result.success) {
                // Doctors need admin approval — do NOT auto-login them
                if (result.user?.role === 'doctor') {
                    return { success: true, role: 'doctor', needsApproval: true };
                }
                // Patients & others: auto-login after successful registration
                authService.persistSession(result.user, result.token);
                setUser(result.user);
                return { success: true, role: result.user.role };
            }
            return { success: false, message: result.message || 'Registration failed.' };
        } catch (err) {
            const msg = err.response?.data?.message || 'Registration failed';
            return { success: false, message: msg };
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#2a7d2e', fontSize: '1.2rem' }}>
                🌿 Loading Ayursutra...
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, register, verifyCredentials, completeLogin }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
