import { NavLink, Link, useNavigate } from 'react-router-dom';
import { getStoredUser, clearAuth, isAuthenticated } from '../utils/api';

/**
 * Navbar Component
 * ────────────────
 * - Shows "SkillIntel" branding on the left
 * - Navigation links in the center
 * - If logged in: shows user name + Logout button
 * - If not logged in: shows Login and Register links
 */
export default function Navbar({ action }) {
    const navigate = useNavigate();
    const loggedIn = isAuthenticated();
    const user = getStoredUser();

    const handleLogout = () => {
        // Clear all authentication data from localStorage
        clearAuth();

        // Also call server logout to destroy session
        fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});

        // Redirect to login
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <div className="nav-inner">
                <Link to="/" className="nav-logo">
                    <div className="nav-logo-icon">⚡</div>
                    SkillIntel
                </Link>
                <div className="nav-links">
                    <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
                        Market Data
                    </NavLink>
                    <NavLink to="/explorer" className={({ isActive }) => isActive ? 'active' : ''}>
                        Skills
                    </NavLink>
                    <NavLink to="/compare" className={({ isActive }) => isActive ? 'active' : ''}>
                        Comparisons
                    </NavLink>
                    {loggedIn && (
                        <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'active' : ''}>
                            Dashboard
                        </NavLink>
                    )}
                </div>
                <div className="nav-actions">
                    {loggedIn ? (
                        <>
                            <span style={{ color: '#94a3b8', fontSize: '0.85rem', marginRight: '0.75rem' }}>
                                👤 {user?.name || 'User'}
                            </span>
                            <button
                                onClick={handleLogout}
                                className="btn btn-secondary btn-sm"
                                style={{ cursor: 'pointer' }}
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="btn btn-secondary btn-sm">Login</Link>
                            <Link to="/register" className="btn btn-primary btn-sm" style={{ marginLeft: '0.5rem' }}>
                                Register
                            </Link>
                        </>
                    )}
                    {action}
                </div>
            </div>
        </nav>
    );
}
