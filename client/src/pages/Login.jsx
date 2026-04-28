import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';
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
            localStorage.setItem('skillintel_token', data.token);
            localStorage.setItem('skillintel_user', JSON.stringify(data.user));
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
        background: 'var(--bg-primary)',
        padding: '2rem',
    },
    card: {
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        padding: '2.5rem',
        width: '100%',
        maxWidth: '420px',
        boxShadow: 'var(--shadow-lg)',
    },
    logo: {
        textAlign: 'center',
        fontSize: '1.6rem',
        fontWeight: 700,
        background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        marginBottom: '0.4rem',
    },
    subtitle: {
        textAlign: 'center',
        color: 'var(--text-secondary)',
        fontSize: '0.9rem',
        marginBottom: '1.8rem',
    },
    formGroup: {
        marginBottom: '1.2rem',
    },
    label: {
        display: 'block',
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
        marginBottom: '0.4rem',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        fontWeight: 600,
    },
    input: {
        width: '100%',
        padding: '0.75rem 1rem',
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        color: 'var(--text-primary)',
        fontSize: '0.95rem',
        outline: 'none',
    },
    submitBtn: {
        width: '100%',
        padding: '0.85rem',
        background: 'linear-gradient(135deg, #2E86DE 0%, #2678CC 100%)',
        border: 'none',
        borderRadius: '8px',
        color: 'white',
        fontSize: '1rem',
        fontWeight: 600,
        cursor: 'pointer',
        marginTop: '0.5rem',
    },
    errorBox: {
        background: 'rgba(239, 68, 68, 0.12)',
        border: '1px solid rgba(239, 68, 68, 0.30)',
        color: 'var(--accent-red)',
        padding: '0.75rem 1rem',
        borderRadius: '8px',
        fontSize: '0.85rem',
        marginBottom: '1rem',
    },
    linkText: {
        textAlign: 'center',
        marginTop: '1.5rem',
        fontSize: '0.85rem',
        color: 'var(--text-secondary)',
    },
    link: {
        color: '#4CAFD6',
        textDecoration: 'none',
        fontWeight: 600,
    },
};
