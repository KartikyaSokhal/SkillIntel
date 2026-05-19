import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { isAuthenticated, apiFetch, getSocketUrl } from '../utils/api';
import { formatSalaryLPA } from '../utils/currency';
export default function Dashboard() {
    const [skills, setSkills] = useState([]);
    const [trending, setTrending] = useState([]);
    const [loading, setLoading] = useState(true);
    const [socketStatus, setSocketStatus] = useState('disconnected');
    const navigate = useNavigate();
    useEffect(() => {
        if (!isAuthenticated()) {
            navigate('/login');
        }
    }, [navigate]);
    useEffect(() => {
        apiFetch('/skills')
            .then(json => {
                setSkills(json.data || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);
    useEffect(() => {
        let socket;
        async function connectSocket() {
            try {
                const { io } = await import('socket.io-client');
                socket = io(getSocketUrl());
                socket.on('connect', () => {
                    setSocketStatus('connected');
                    socket.emit('requestTrending');
                });
                socket.on('trendingUpdate', (payload) => {
                    setTrending(payload.data || []);
                });
                socket.on('welcome', (data) => {
                    console.log('🔌 WebSocket:', data.message);
                });
                socket.on('disconnect', () => {
                    setSocketStatus('disconnected');
                });
            } catch {
                console.log('Socket.io client not available, using REST fallback');
                apiFetch('/trending')
                    .then(json => setTrending((json.data || []).slice(0, 5)))
                    .catch(() => {});
            }
        }
        connectSocket();
        return () => {
            if (socket) socket.disconnect();
        };
    }, []);
    const user = JSON.parse(localStorage.getItem('skillintel_user') || '{}');
    return (
        <>
            <Navbar />
            {}
            <div style={styles.header}>
                <div style={styles.headerInner}>
                    <div>
                        <h1 style={styles.title}>📊 Dashboard</h1>
                        <p style={styles.subtitle}>
                            Welcome back, <strong>{user.name || 'User'}</strong>
                            <span style={styles.socketBadge}>
                                {socketStatus === 'connected' ? '🟢 Live' : '⚪ Offline'}
                            </span>
                        </p>
                    </div>
                </div>
            </div>
            {}
            <div style={styles.statsRow}>
                <div style={styles.statCard}>
                    <div style={styles.statNumber}>{skills.length}</div>
                    <div style={styles.statLabel}>Skills Tracked</div>
                </div>
                <div style={styles.statCard}>
                    <div style={styles.statNumber}>
                        {skills.filter(s => s.growth > 20).length}
                    </div>
                    <div style={styles.statLabel}>High Growth</div>
                </div>
                <div style={styles.statCard}>
                    <div style={styles.statNumber}>
                        {[...new Set(skills.map(s => s.category))].length}
                    </div>
                    <div style={styles.statLabel}>Categories</div>
                </div>
            </div>
            <div style={styles.content}>
                {}
                <div style={styles.section}>
                    <h2 style={styles.sectionTitle}>
                        🔥 Trending Skills
                        <span style={styles.liveTag}>LIVE</span>
                    </h2>
                    <div style={styles.trendingGrid}>
                        {(trending.length > 0 ? trending : skills.slice(0, 5)).map((skill, i) => (
                            <Link
                                to={`/skill/${encodeURIComponent(skill.name)}`}
                                key={skill.name}
                                style={styles.trendingCard}
                            >
                                <div style={styles.trendRank}>#{i + 1}</div>
                                <div>
                                    <div style={styles.trendName}>{skill.icon || '🔧'} {skill.name}</div>
                                    <div style={styles.trendGrowth}>+{skill.growth}% growth</div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
                {}
                <div style={styles.section}>
                    <h2 style={styles.sectionTitle}>📦 All Skills</h2>
                    {loading ? (
                        <p style={{ color: 'var(--text-muted)' }}>Loading skills…</p>
                    ) : (
                        <div style={styles.skillsGrid}>
                            {skills.map(skill => (
                                <Link
                                    to={`/skill/${encodeURIComponent(skill.name)}`}
                                    key={skill.name}
                                    style={styles.skillCard}
                                >
                                    <div style={styles.skillTop}>
                                        <span style={styles.skillIcon}>{skill.icon || '🔧'}</span>
                                        <span style={styles.skillName}>{skill.name}</span>
                                    </div>
                                    <div style={styles.skillMeta}>
                                        <div>
                                            <div style={styles.metaLabel}>Demand</div>
                                            <div style={styles.metaValue}>{skill.demandIndex}/10</div>
                                        </div>
                                        <div>
                                            <div style={styles.metaLabel}>Growth</div>
                                            <div style={{ ...styles.metaValue, color: '#4CAFD6' }}>
                                                +{skill.growth}%
                                            </div>
                                        </div>
                                        <div>
                                            <div style={styles.metaLabel}>Salary</div>
                                            <div style={styles.metaValue}>
                                                {formatSalaryLPA(skill.salary)}
                                            </div>
                                        </div>
                                    </div>
                                    {}
                                    <div style={styles.demandTrack}>
                                        <div style={{
                                            ...styles.demandFill,
                                            width: `${(skill.demandIndex / 10) * 100}%`
                                        }} />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </>
    );
}
const styles = {
    header: {
        background: 'radial-gradient(ellipse 60% 70% at 10% 0%, #0A1E3C, transparent 65%), #050C14',
        borderBottom: '1px solid var(--border-color)',
        padding: '2rem',
    },
    headerInner: { maxWidth: '1200px', margin: '0 auto' },
    title: { fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)' },
    subtitle: { color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.3rem' },
    socketBadge: {
        marginLeft: '1rem',
        fontSize: '0.75rem',
        padding: '0.15rem 0.5rem',
        borderRadius: '20px',
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
    },
    statsRow: {
        display: 'flex',
        gap: '1rem',
        maxWidth: '1200px',
        margin: '1.5rem auto',
        padding: '0 2rem',
    },
    statCard: {
        flex: 1,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '1.2rem',
        textAlign: 'center',
    },
    statNumber: { fontSize: '2rem', fontWeight: 700, color: 'var(--accent-blue)' },
    statLabel: { fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' },
    content: { maxWidth: '1200px', margin: '0 auto', padding: '0 2rem 3rem' },
    section: { marginTop: '2rem' },
    sectionTitle: { fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' },
    liveTag: {
        fontSize: '0.65rem',
        marginLeft: '0.5rem',
        padding: '0.15rem 0.5rem',
        borderRadius: '20px',
        background: 'var(--accent-green-light)',
        color: 'var(--accent-green)',
        verticalAlign: 'middle',
    },
    trendingGrid: { display: 'flex', gap: '0.75rem', flexWrap: 'wrap' },
    trendingCard: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '10px',
        padding: '0.75rem 1.2rem',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'border-color 0.2s',
        flex: '1 1 180px',
    },
    trendRank: { fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-blue)' },
    trendName: { fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' },
    trendGrowth: { fontSize: '0.8rem', color: 'var(--accent-green)' },
    skillsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '1rem',
    },
    skillCard: {
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '1.2rem',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'border-color 0.2s, transform 0.2s',
    },
    skillTop: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' },
    skillIcon: { fontSize: '1.3rem' },
    skillName: { fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' },
    skillMeta: { display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' },
    metaLabel: { fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' },
    metaValue: { fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' },
    demandTrack: {
        height: '4px',
        background: 'rgba(30, 70, 110, 0.35)',
        borderRadius: '2px',
        overflow: 'hidden',
    },
    demandFill: {
        height: '100%',
        background: 'linear-gradient(90deg, #3BA8D0 0%, #2A7A9A 100%)',
        borderRadius: '2px',
    },
};
