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
        <div style={styles.wrapper}>
            <div style={styles.card}>
                <div style={styles.logo}>⚡ SkillIntel</div>
                <p style={styles.subtitle}>Sign in to your account</p>

                {error && <div style={styles.errorBox}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@skillintel.com"
                            style={styles.input}
                            required
                        />
                    </div>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            style={styles.input}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        style={styles.submitBtn}
                        disabled={loading}
                    >
                        {loading ? 'Signing in…' : 'Sign In'}
                    </button>
                </form>

                <p style={styles.linkText}>
                    Don't have an account?{' '}
                    <Link to="/register" style={styles.link}>Register</Link>
                </p>
            </div>
        </div>
    );
}

const styles = {
    wrapper: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0f1e',
        padding: '2rem',
    },
    card: {
        background: '#151c2f',
        border: '1px solid #2a3450',
        borderRadius: '16px',
        padding: '2.5rem',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
    },
    logo: {
        textAlign: 'center',
        fontSize: '1.6rem',
        fontWeight: 700,
        background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        marginBottom: '0.4rem',
    },
    subtitle: {
        textAlign: 'center',
        color: '#94a3b8',
        fontSize: '0.9rem',
        marginBottom: '1.8rem',
    },
    formGroup: {
        marginBottom: '1.2rem',
    },
    label: {
        display: 'block',
        fontSize: '0.8rem',
        color: '#94a3b8',
        marginBottom: '0.4rem',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        fontWeight: 600,
    },
    input: {
        width: '100%',
        padding: '0.75rem 1rem',
        background: '#0a0f1e',
        border: '1px solid #2a3450',
        borderRadius: '8px',
        color: '#e2e8f0',
        fontSize: '0.95rem',
        outline: 'none',
    },
    submitBtn: {
        width: '100%',
        padding: '0.85rem',
        background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
        border: 'none',
        borderRadius: '8px',
        color: 'white',
        fontSize: '1rem',
        fontWeight: 600,
        cursor: 'pointer',
        marginTop: '0.5rem',
    },
    errorBox: {
        background: '#451a1a',
        border: '1px solid #7f1d1d',
        color: '#fca5a5',
        padding: '0.75rem 1rem',
        borderRadius: '8px',
        fontSize: '0.85rem',
        marginBottom: '1rem',
    },
    linkText: {
        textAlign: 'center',
        marginTop: '1.5rem',
        fontSize: '0.85rem',
        color: '#94a3b8',
    },
    link: {
        color: '#38bdf8',
        textDecoration: 'none',
        fontWeight: 600,
    },
};
