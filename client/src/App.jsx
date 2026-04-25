import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';

// ── Existing Pages (preserved) ────────────────────────────────
import Home from './pages/Home';
import Explorer from './pages/Explorer';
import SkillDetail from './pages/SkillDetail';
import Compare from './pages/Compare';

// ── New Auth & Dashboard Pages ────────────────────────────────
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';

// ── Footer / Static content pages ─────────────────────────────
import About from './pages/About';
import Methodology from './pages/Methodology';
import Contact from './pages/Contact';

import { isAuthenticated } from './utils/api';

/**
 * PrivateRoute Component
 * ──────────────────────
 * Wraps protected routes to check for authentication.
 * If the user has a valid JWT in localStorage, render the child.
 * If not, redirect to /login.
 *
 * This is a CLIENT-SIDE guard only — the actual API routes are
 * also protected server-side by authMiddleware.js (double protection).
 */
function PrivateRoute({ children }) {
    return isAuthenticated() ? children : <Navigate to="/login" replace />;
}

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* ── Public Routes (existing, preserved) ──────── */}
                <Route path="/" element={<Home />} />
                <Route path="/explorer" element={<Explorer />} />
                <Route path="/skill/:name" element={<SkillDetail />} />
                <Route path="/compare" element={<Compare />} />

                {/* ── Auth Routes (new) ────────────────────────── */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* ── Footer content pages ────────────────────── */}
                <Route path="/about" element={<About />} />
                <Route path="/methodology" element={<Methodology />} />
                <Route path="/contact" element={<Contact />} />

                {/* ── Protected Routes (new) ───────────────────── */}
                <Route
                    path="/dashboard"
                    element={
                        <PrivateRoute>
                            <Dashboard />
                        </PrivateRoute>
                    }
                />
                <Route
                    path="/profile"
                    element={
                        <PrivateRoute>
                            <Profile />
                        </PrivateRoute>
                    }
                />

                {/* ── Catch-all: redirect to home ──────────────── */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}
