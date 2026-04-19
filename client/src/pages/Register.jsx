import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../utils/api';

/**
 * Register Page
 * ─────────────
 * Creates a new user account via POST /api/auth/register.
 * Includes client-side validation before sending to the API.
 * On success: redirects to /login.
 */
export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // ── Client-side validation ────────────────────────────
        if (!name || !email || !password || !confirmPassword) {
            return setError('All fields are required');
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return setError('Please enter a valid email address');
        }

        if (password.length < 6) {
            return setError('Password must be at least 6 characters');
        }

        if (password !== confirmPassword) {
            return setError('Passwords do not match');
        }

        setLoading(true);

        try {
            const data = await apiFetch('/auth/register', {
                method: 'POST',
                body: JSON.stringify({ name, email, password }),
            });

            setSuccess(data.message || 'Account created! Redirecting to login…');

            // Redirect to login after a brief delay
            setTimeout(() => navigate('/login'), 1500);
        } catch (err) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.wrapper}>
            <div style={styles.card}>
                <div style={styles.logo}>⚡ SkillIntel</div>
                <p style={styles.subtitle}>Create your account</p>

                {error && <div style={styles.errorBox}>{error}</div>}
                {success && <div style={styles.successBox}>{success}</div>}

                <form onSubmit={handleSubmit}>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Full Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="John Doe"
                            style={styles.input}
                            required
                        />
                    </div>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
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
                            placeholder="Min. 6 characters"
                            style={styles.input}
                            required
                        />
                    </div>
                    <div style={styles.formGroup}>
                        <label style={styles.label}>Confirm Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Re-enter password"
                            style={styles.input}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        style={styles.submitBtn}
                        disabled={loading}
                    >
                        {loading ? 'Creating account…' : 'Create Account'}
                    </button>
                </form>

                <p style={styles.linkText}>
                    Already have an account?{' '}
                    <Link to="/login" style={styles.link}>Login</Link>
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
    successBox: {
        background: '#052e16',
        border: '1px solid #166534',
        color: '#86efac',
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
