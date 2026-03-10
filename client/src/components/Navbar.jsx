import { NavLink, Link } from 'react-router-dom';

export default function Navbar({ action }) {
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
                    <NavLink to="/explorer" className={({ isActive }) => isActive ? '' : ''}>
                        Trends
                    </NavLink>
                </div>
                <div className="nav-actions">
                    {action}
                </div>
            </div>
        </nav>
    );
}
