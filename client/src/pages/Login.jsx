import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';

/**
 * Login Page
 * ──────────
 * Authenticates the user via POST /api/auth/login.
 * On success: stores JWT + user info in localStorage, redirects to dashboard.
 * On failure: shows inline error message.
 */
export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data = await apiFetch('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            });

            // Store JWT token and user info in localStorage
            localStorage.setItem('skillintel_token', data.token);
            localStorage.setItem('skillintel_user', JSON.stringify(data.user));

            // Redirect to home/dashboard
            navigate('/');
        } catch (err) {
            setError(err.message || 'Invalid credentials. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-shell">
            <div className="auth-hero">
                <div className="auth-hero-badge">AI Powered Intelligence</div>
                <h1>Map your skills to real market demand.</h1>
                <p>Track growth, compare technologies, and get personalized career guidance in one dashboard.</p>
            </div>
            <div className="auth-card">
                <div className="auth-logo">⚡ SkillIntel</div>
                <p className="auth-subtitle">Sign in to your account</p>

                {error && <div className="auth-error">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div>
                        <label className="auth-label">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@skillintel.com"
                            className="auth-input"
                            required
                        />
                    </div>
                    <div>
                        <label className="auth-label">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="auth-input"
                            required
                        />
                    </div>
                    <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
                        {loading ? 'Signing in…' : 'Sign In'}
                    </button>
                </form>

                <p className="auth-link-text">
                    Don't have an account? <Link to="/register" className="auth-link">Register</Link>
                </p>
            </div>
        </div>
    );
}
