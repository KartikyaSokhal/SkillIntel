import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Spinner from '../components/Spinner';
import { apiFetch, isAuthenticated } from '../utils/api';

/**
 * Roadmap Page — Personalized Learning Timeline
 * ──────────────────────────────────────────────
 * Builds a career roadmap based on:
 *   1. User's current skills (from profile)
 *   2. Recommended companion skills (from DB graph)
 *   3. High-growth skills the user doesn't yet have (from trending)
 */
export default function Roadmap() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [currentSkills, setCurrentSkills] = useState([]);
    const [recommendedSkills, setRecommendedSkills] = useState([]);
    const [growthOpportunities, setGrowthOpportunities] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!isAuthenticated()) {
            navigate('/login');
            return;
        }

        async function fetchRoadmap() {
            try {
                // 1. Get user's profile and skills
                const profileRes = await apiFetch('/auth/profile');
                const detailed = profileRes?.user?.profile?.skillsDetailed || [];
                const skillNames = detailed.map(s => s?.name).filter(Boolean);
                setCurrentSkills(detailed.length ? detailed : skillNames.map(n => ({ name: n, level: 'Intermediate' })));

                // 2. Get recommended skills for user's top skills
                const top = skillNames.slice(0, 5);
                const recResults = await Promise.all(
                    top.map(async (skill) => {
                        try {
                            const rec = await fetch(`/api/recommended/${encodeURIComponent(skill)}`).then(r => r.json());
                            return (rec?.data || []).map(item => ({
                                ...(typeof item === 'object' ? item : {}),
                                name: typeof item === 'string' ? item : item?.name,
                                basedOn: skill
                            }));
                        } catch {
                            return [];
                        }
                    })
                );
                const merged = recResults.flat()
                    .filter(item => item?.name)
                    .filter((item, idx, arr) => arr.findIndex(a => a.name?.toLowerCase() === item.name?.toLowerCase()) === idx)
                    .filter(item => !skillNames.some(u => String(u).toLowerCase() === String(item.name).toLowerCase()))
                    .slice(0, 6);
                setRecommendedSkills(merged);

                // 3. Get growth opportunities from trending
                const trendRes = await fetch('/api/trending?limit=15').then(r => r.json());
                const trendData = Array.isArray(trendRes?.data) ? trendRes.data : [];
                const growth = trendData
                    .filter(s => !skillNames.some(u => String(u).toLowerCase() === String(s.name).toLowerCase()))
                    .filter(s => !merged.some(r => String(r.name).toLowerCase() === String(s.name).toLowerCase()))
                    .filter(s => (s.growth || 0) >= 15)
                    .slice(0, 5);
                setGrowthOpportunities(growth);
            } catch (err) {
                setError(err?.message || 'Failed to load roadmap data');
            } finally {
                setLoading(false);
            }
        }

        fetchRoadmap();
    }, [navigate]);

    return (
        <>
            <Navbar />

            <div className="roadmap-shell">
                <motion.div
                    className="roadmap-header"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <h1>🗺️ Your Learning Roadmap</h1>
                    <p>A personalized path based on your skills, market trends, and recommended growth areas.</p>
                </motion.div>

                {loading ? (
                    <Spinner message="Building your personalized roadmap…" />
                ) : error ? (
                    <div className="roadmap-empty">
                        <h2>⚠️ {error}</h2>
                        <p>Ensure the backend is running and try again.</p>
                    </div>
                ) : currentSkills.length === 0 ? (
                    <div className="roadmap-empty">
                        <h2>🚧 No Skills Found</h2>
                        <p>Add skills to your <Link to="/profile" style={{ color: 'var(--accent-cyan)' }}>profile</Link> to generate a personalized roadmap.</p>
                    </div>
                ) : (
                    <>
                        {/* ─── Current Skills ────────────────────── */}
                        <motion.div
                            className="roadmap-section"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                        >
                            <div className="roadmap-section-title">✅ Your Current Skills</div>
                            <div className="roadmap-timeline">
                                {currentSkills.map((skill, idx) => (
                                    <div key={skill.name || idx} className="roadmap-item current">
                                        <div className="roadmap-item-header">
                                            <div className="roadmap-item-name">{skill.name}</div>
                                            <span className="roadmap-item-badge current">{skill.level || 'Intermediate'}</span>
                                        </div>
                                        <div className="roadmap-item-meta">
                                            <span>Level: <strong>{skill.level || 'Intermediate'}</strong></span>
                                            {skill.score && <span>Proficiency: <strong>{skill.score}%</strong></span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* ─── Recommended Next ───────────────────── */}
                        {recommendedSkills.length > 0 && (
                            <motion.div
                                className="roadmap-section"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: 0.2 }}
                            >
                                <div className="roadmap-section-title">🎯 Recommended Next</div>
                                <div className="roadmap-timeline">
                                    {recommendedSkills.map((skill, idx) => (
                                        <Link
                                            key={skill.name || idx}
                                            to={`/skill/${encodeURIComponent(skill.name)}`}
                                            style={{ textDecoration: 'none', color: 'inherit' }}
                                        >
                                            <div className="roadmap-item recommended">
                                                <div className="roadmap-item-header">
                                                    <div className="roadmap-item-name">{skill.name}</div>
                                                    <span className="roadmap-item-badge next">Suggested</span>
                                                </div>
                                                <div className="roadmap-item-desc">
                                                    Recommended because you know <strong>{skill.basedOn}</strong>.
                                                    {skill.description ? ` ${skill.description}` : ''}
                                                </div>
                                                {(skill.demandIndex || skill.growth) && (
                                                    <div className="roadmap-item-meta">
                                                        {skill.demandIndex && <span>Demand: <strong>{skill.demandIndex}/10</strong></span>}
                                                        {skill.growth && <span>Growth: <strong>+{skill.growth}%</strong></span>}
                                                    </div>
                                                )}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* ─── Growth Opportunities ──────────────── */}
                        {growthOpportunities.length > 0 && (
                            <motion.div
                                className="roadmap-section"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: 0.3 }}
                            >
                                <div className="roadmap-section-title">🚀 Growth Opportunities</div>
                                <div className="roadmap-timeline">
                                    {growthOpportunities.map((skill, idx) => (
                                        <Link
                                            key={skill.name || idx}
                                            to={`/skill/${encodeURIComponent(skill.name)}`}
                                            style={{ textDecoration: 'none', color: 'inherit' }}
                                        >
                                            <div className="roadmap-item">
                                                <div className="roadmap-item-header">
                                                    <div className="roadmap-item-name">{skill.icon || '🔧'} {skill.name}</div>
                                                    <span className="roadmap-item-badge growth">+{skill.growth}%</span>
                                                </div>
                                                <div className="roadmap-item-desc">
                                                    High-growth skill in <strong>{skill.category || 'tech'}</strong>
                                                    {skill.description ? ` — ${skill.description}` : ''}.
                                                    You don't have this yet!
                                                </div>
                                                <div className="roadmap-item-meta">
                                                    <span>Demand: <strong>{skill.demandIndex}/10</strong></span>
                                                    <span>Growth: <strong>+{skill.growth}%</strong></span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </>
                )}
            </div>

            <Footer />
        </>
    );
}
