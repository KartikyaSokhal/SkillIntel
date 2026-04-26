import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import DashboardStatCard from '../components/DashboardStatCard';
import TrendingCard from '../components/TrendingCard';
import LiveFeed from '../components/LiveFeed';
import { apiFetch, isAuthenticated } from '../utils/api';
import { formatSalaryLPA } from '../utils/currency';

/**
 * Dashboard Page (React SPA — Protected)
 * ────────────────────────────────────────
 * This page is protected: if no JWT is in localStorage,
 * the user is redirected to /login.
 *
 * SOCKET.IO CLIENT LIFECYCLE:
 * ───────────────────────────
 * 1. On component mount: connect to the WebSocket server
 * 2. Emit 'requestTrending' to ask for latest trending data
 * 3. Listen for 'trendingUpdate' event — update state when received
 * 4. On component unmount (cleanup): disconnect the socket
 *
 * This ensures we don't leak connections when navigating away.
 *
 * ALL STYLING uses CSS classes from index.css for full theme consistency.
 */
export default function Dashboard() {
    const [skills, setSkills] = useState([]);
    const [trending, setTrending] = useState([]);
    const [loading, setLoading] = useState(true);
    const [socketStatus, setSocketStatus] = useState('disconnected');
    const [insight, setInsight] = useState(null);
    const [userSkills, setUserSkills] = useState([]);
    const [recommendedSkills, setRecommendedSkills] = useState([]);
    const [profileResume, setProfileResume] = useState({ hasFile: false });
    const navigate = useNavigate();

    // ── Auth guard ────────────────────────────────────────────
    useEffect(() => {
        if (!isAuthenticated()) {
            navigate('/login');
        }
    }, [navigate]);

    // ── Fetch latest weekly insight ───────────────────────────
    useEffect(() => {
        fetch('/api/insights/latest')
            .then(r => r.json())
            .then(json => {
                if (json.success && json.data) {
                    setInsight(json.data);
                }
            })
            .catch(() => {});
    }, []);

    // ── Fetch all skills (REST API) ───────────────────────────
    useEffect(() => {
        fetch('/api/skills')
            .then(r => r.json())
            .then(json => {
                setSkills(json.data || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!isAuthenticated()) return;
        let mounted = true;
        apiFetch('/auth/profile')
            .then(async (response) => {
                if (!mounted) return;
                const detailed = response?.user?.profile?.skillsDetailed;
                const fallback = response?.user?.profile?.skills;
                const names = Array.isArray(detailed) && detailed.length
                    ? detailed.map((s) => s?.name).filter(Boolean)
                    : (Array.isArray(fallback) ? fallback : []);
                setUserSkills(names);
                setProfileResume(response?.user?.profile?.resume || { hasFile: false });

                const top = names.slice(0, 3);
                const recResults = await Promise.all(top.map(async (skill) => {
                    try {
                        const rec = await fetch(`/api/recommended/${encodeURIComponent(skill)}`).then((r) => r.json());
                        return Array.isArray(rec?.data) ? rec.data : [];
                    } catch {
                        return [];
                    }
                }));
                const merged = recResults.flat()
                    .map((item) => (typeof item === 'string' ? item : item?.name))
                    .filter(Boolean)
                    .filter((name, idx, arr) => arr.indexOf(name) === idx)
                    .filter((name) => !names.some((u) => String(u).toLowerCase() === String(name).toLowerCase()))
                    .slice(0, 8);
                setRecommendedSkills(merged);
            })
            .catch(() => {});
        return () => { mounted = false; };
    }, []);

    // ── Socket.io connection for real-time trending updates ───
    useEffect(() => {
        let socket;
        async function connectSocket() {
            try {
                const { io } = await import('socket.io-client');
                // Use window.location.origin to work through Vite proxy and in production
                socket = io(window.location.origin);

                socket.on('connect', () => {
                    setSocketStatus('connected');
                    // Request trending data immediately on connection
                    socket.emit('requestTrending');
                });

                socket.on('trendingUpdate', (payload) => {
                    setTrending(payload.data || []);
                });

                socket.on('new-insight', (payload) => {
                    setInsight(payload);
                });

                socket.on('welcome', (data) => {
                    console.log('🔌 WebSocket:', data.message);
                });

                socket.on('disconnect', () => {
                    setSocketStatus('disconnected');
                });
            } catch {
                // socket.io-client not available — fall back to REST
                console.log('Socket.io client not available, using REST fallback');
                fetch('/api/trending?limit=5')
                    .then(r => r.json())
                    .then(json => setTrending((json.data || []).slice(0, 5)))
                    .catch(() => {});
            }
        }
        connectSocket();

        // Cleanup: disconnect socket when component unmounts
        return () => {
            if (socket) socket.disconnect();
        };
    }, []);

    const user = JSON.parse(localStorage.getItem('skillintel_user') || '{}');

    // Use real trending data; fallback to growth-sorted skills only when trending is empty
    const trendingToRender = trending.length > 0
        ? trending.slice(0, 5)
        : [...skills].sort((a, b) => (b.growth || 0) - (a.growth || 0)).slice(0, 5);

    const growthBuckets = useMemo(() => ({
        high: skills.filter((s) => Number(s.growth) >= 20).length,
        moderate: skills.filter((s) => Number(s.growth) >= 10 && Number(s.growth) < 20).length,
        low: skills.filter((s) => Number(s.growth) < 10).length
    }), [skills]);

    const profileCompletion = useMemo(() => {
        const hasSkills = userSkills.length > 0;
        const hasResume = !!profileResume?.hasFile;
        const hasName = !!user?.name;
        const score = [hasName, hasSkills, hasResume].filter(Boolean).length;
        return Math.round((score / 3) * 100);
    }, [userSkills.length, profileResume?.hasFile, user?.name]);

    const skillsCompletion = Math.min(100, Math.round((userSkills.length / 8) * 100));

    const today = new Date().toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <>
            <Navbar />

            {/* ─── Dashboard Header ──────────────────────────────── */}
            <div className="dashboard-header">
                <div className="dashboard-header-inner">
                    <div>
                        <h1 className="dashboard-title">
                            📊 Dashboard
                        </h1>
                        <p className="dashboard-subtitle">
                            Welcome back, <strong>{user.name || 'User'}</strong>
                            <span className={`dashboard-socket-badge ${socketStatus}`}>
                                {socketStatus === 'connected' ? '🟢 Live' : '⚪ Offline'}
                            </span>
                        </p>
                    </div>
                    <div className="dashboard-date">{today}</div>
                </div>
            </div>

            {/* ─── Live AI Insight Feed ──────────────────────────── */}
            <div style={{ maxWidth: '1200px', margin: '2rem auto 0 auto', padding: '0 2rem' }}>
                <LiveFeed insight={insight} />
            </div>

            {/* ─── Stats Row ─────────────────────────────────────── */}
            <div className="dashboard-stats-row">
                <DashboardStatCard icon="📦" value={skills.length} label="Skills Tracked" delay={0} />
                <DashboardStatCard icon="🚀" value={growthBuckets.high} label="High Growth (≥20% YoY)" accent="green" delay={0.05} />
                <DashboardStatCard icon="📈" value={growthBuckets.moderate} label="Moderate Growth (10–19%)" accent="cyan" delay={0.1} />
                <DashboardStatCard icon="📊" value={`${profileCompletion}%`} label="Profile Completion" delay={0.15} />
                <DashboardStatCard icon="🎯" value={`${skillsCompletion}%`} label="Skills Progress" accent="cyan" delay={0.2} />
                <DashboardStatCard icon="📄" value={profileResume?.hasFile ? '✓ Yes' : '✗ No'} label="Resume Uploaded" accent={profileResume?.hasFile ? 'green' : 'muted'} delay={0.25} />
            </div>

            <div className="dashboard-content">
                {/* ─── Trending Section (Real-time via Socket.io) ── */}
                <motion.div
                    className="dashboard-section"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.15 }}
                >
                    <h2 className="dashboard-section-title">
                        🔥 Trending Skills
                        <span className="dashboard-live-tag">LIVE</span>
                    </h2>
                    <div className="dashboard-trending-grid">
                        {trendingToRender.map((skill, i) => (
                            <TrendingCard key={skill.name} skill={skill} rank={i + 1} delay={i * 0.04} />
                        ))}
                    </div>
                </motion.div>

                {/* ─── Personalized Skills ────────────────────────── */}
                <motion.div
                    className="dashboard-section"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.25 }}
                >
                    <h2 className="dashboard-section-title">🎯 Personalized Skills</h2>
                    <div className="dashboard-personal-grid">
                        <div className="dashboard-skills-card">
                            <div className="dashboard-skills-card-title">Your Skills</div>
                            <div className="dashboard-skills-tags">
                                {userSkills.length
                                    ? userSkills.map((s) => <span key={s} className="tag tag-blue">{s}</span>)
                                    : <span className="text-muted">Add skills in your <Link to="/profile" style={{ color: 'var(--accent-cyan)' }}>profile</Link>.</span>
                                }
                            </div>
                        </div>
                        <div className="dashboard-skills-card">
                            <div className="dashboard-skills-card-title">Recommended Skills</div>
                            <div className="dashboard-skills-tags">
                                {recommendedSkills.length
                                    ? recommendedSkills.map((s) => <span key={s} className="tag tag-green">{s}</span>)
                                    : <span className="text-muted">Recommendations appear from your skills.</span>
                                }
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* ─── All Skills Grid ────────────────────────────── */}
                <motion.div
                    className="dashboard-section"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.35 }}
                >
                    <h2 className="dashboard-section-title">📦 All Skills</h2>
                    {loading ? (
                        <p className="text-muted">Loading skills…</p>
                    ) : (
                        <div className="dashboard-all-skills-grid">
                            {skills.map(skill => (
                                <Link
                                    to={`/skill/${encodeURIComponent(skill.name)}`}
                                    key={skill.name}
                                    className="dashboard-mini-card"
                                >
                                    <div className="dashboard-mini-top">
                                        <span className="dashboard-mini-icon">{skill.icon || '🔧'}</span>
                                        <span className="dashboard-mini-name">{skill.name}</span>
                                    </div>
                                    <div className="dashboard-mini-meta">
                                        <div>
                                            <div className="dashboard-meta-label">Demand</div>
                                            <div className="dashboard-meta-value">{skill.demandIndex}/10</div>
                                        </div>
                                        <div>
                                            <div className="dashboard-meta-label">Growth</div>
                                            <div className="dashboard-meta-value cyan">
                                                +{skill.growth}%
                                            </div>
                                        </div>
                                        <div>
                                            <div className="dashboard-meta-label">Salary</div>
                                            <div className="dashboard-meta-value">
                                                {formatSalaryLPA(skill.salary)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="dashboard-demand-track">
                                        <div
                                            className="dashboard-demand-fill"
                                            style={{ width: `${(skill.demandIndex / 10) * 100}%` }}
                                        />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>

            <Footer />
        </>
    );
}
