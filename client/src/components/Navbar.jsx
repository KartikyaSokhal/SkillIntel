import { NavLink, Link, useNavigate } from 'react-router-dom';
import { getStoredUser, clearAuth, isAuthenticated } from '../utils/api';
import Avatar from './Avatar';
import ThemeToggle from './ThemeToggle';
export default function Navbar({ action }) {
    const navigate = useNavigate();
    const loggedIn = isAuthenticated();
    const user = getStoredUser();
    const handleLogout = () => {
        clearAuth();
        fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
        navigate('/login');
    };
    return (
        <nav className="navbar">
            <div className="nav-inner">
                <Link to="/" className="nav-logo">
                    <div className="nav-logo-icon">⚡</div>
                    <span className="nav-logo-text">Skill Intel</span>
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
                <div className="nav-actions" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}>
                    <ThemeToggle />
                    {loggedIn ? (
                        <>
                            <Link
                                to="/profile"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'var(--text-secondary)' }}
                                aria-label="Profile"
                            >
                                <Avatar size="sm" name={user?.name} />
                                <span style={{ fontSize: '0.85rem', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {user?.name || 'User'}
                                </span>
                            </Link>
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
                            <Link to="/register" className="btn btn-primary btn-sm">
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
