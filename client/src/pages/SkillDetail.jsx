import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Spinner from '../components/Spinner';

const CAREER_ICONS = {
    'Data Science': '🧪',
    'Backend Engineering': '</>',
    'AI & Machine Learning': '🤖',
    'Frontend Engineering': '🎨',
    'Full-Stack Development': '⚡',
    'DevOps Engineering': '☸️',
    'Cloud Engineering': '☁️',
    'Systems Engineering': '🔩',
    'Enterprise Software': '🏢',
    'Fintech': '💹',
};

const CAREER_OUTLOOKS = {
    'Data Science': { label: 'BULLISH OUTLOOK', color: 'var(--accent-green)' },
    'Backend Engineering': { label: 'STABLE OUTLOOK', color: 'var(--accent-blue)' },
    'AI & Machine Learning': { label: 'HYPER-GROWTH', color: 'var(--accent-green)' },
    'Frontend Engineering': { label: 'BULLISH OUTLOOK', color: 'var(--accent-green)' },
    'Full-Stack Development': { label: 'STABLE OUTLOOK', color: 'var(--accent-blue)' },
};

function demandLevelClass(level) {
    if (!level) return '';
    const l = level.toLowerCase();
    if (l === 'critical') return 'critical';
    if (l === 'high') return 'high';
    return 'rising';
}

export default function SkillDetail() {
    const { name } = useParams();
    const navigate = useNavigate();
    const [skill, setSkill] = useState(null);
    const [recommended, setRecommended] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!name) { setError('No skill name provided.'); setLoading(false); return; }

        fetch(`/api/skills/${encodeURIComponent(name)}`)
            .then(async r => {
                if (!r.ok) { const e = await r.json(); throw new Error(e.error || 'Not found'); }
                return r.json();
            })
            .then(json => {
                setSkill(json.data);
                setLoading(false);
                // fetch recommended
                return fetch(`/api/recommended/${encodeURIComponent(json.data.name)}`);
            })
            .then(r => r.json())
            .then(json => setRecommended(json.data || []))
            .catch(e => { setError(e.message || 'Skill not found.'); setLoading(false); });
    }, [name]);

    const usagePcts = [84, 62, 78, 55, 70, 45];

    if (loading) {
        return (
            <>
                <Navbar action={<button className="btn btn-primary">+ Add to Compare</button>} />
                <Spinner message="Loading skill intelligence…" />
                <Footer />
            </>
        );
    }

    if (error) {
        return (
            <>
                <Navbar action={<button className="btn btn-primary">+ Add to Compare</button>} />
                <div className="error-state" style={{ minHeight: '60vh', padding: '4rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
                    <h2>Skill Not Found</h2>
                    <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 1.5rem' }}>{error}</p>
                    <Link to="/explorer" className="btn btn-primary">Browse All Skills</Link>
                </div>
                <Footer />
            </>
        );
    }

    const expSub = skill.experienceBarrier === 'Low' ? '< 1 year' :
        skill.experienceBarrier === 'Moderate' ? '1-3 years' : '3+ years';

    return (
        <>
            <Navbar action={
                <button className="btn btn-primary" onClick={() => navigate(`/compare?skills=${encodeURIComponent(skill.name)}`)}>
                    + Add to Compare
                </button>
            } />

            {/* Detail Hero */}
            <div className="detail-hero">
                <div className="detail-hero-inner">
                    <div className="breadcrumb" style={{ marginBottom: '1rem' }}>
                        <Link to="/">Home</Link><span>›</span>
                        <Link to="/explorer">Skills</Link><span>›</span>
                        <span>{skill.name}</span>
                    </div>

                    <div className="detail-hero-top">
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                            <div className="detail-skill-icon">{skill.icon || '🔧'}</div>
                            <div>
                                <h1 className="detail-skill-name">{skill.name}</h1>
                                <div className="detail-skill-desc">{skill.category} · {skill.description || ''}</div>
                                <div style={{ display: 'flex', gap: '8px', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                                    {(skill.tags || []).map(t => <span key={t} className="tag tag-gray">{t}</span>)}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <button className="btn btn-secondary" onClick={() => { if (navigator.clipboard) navigator.clipboard.writeText(window.location.href); alert('Link copied!'); }}>
                                ⬆ Share
                            </button>
                            <Link to={`/compare?skills=${encodeURIComponent(skill.name)}`} className="btn btn-primary">⚖️ Compare</Link>
                        </div>
                    </div>

                    {/* Metrics strip */}
                    <div className="detail-metrics-strip">
                        <div className="metric-cell">
                            <div className="metric-cell-label">Demand Index</div>
                            <div className="metric-cell-value green">{skill.demandIndex}/10</div>
                            <div className="metric-cell-sub">Score out of 10</div>
                        </div>
                        <div className="metric-cell">
                            <div className="metric-cell-label">Avg Salary</div>
                            <div className="metric-cell-value">${skill.salary.toLocaleString()}</div>
                            <div className="metric-cell-sub">Yearly USD</div>
                        </div>
                        <div className="metric-cell">
                            <div className="metric-cell-label">Growth Momentum</div>
                            <div className="metric-cell-value green">+{skill.growth}%</div>
                            <div className="metric-cell-sub">Year-over-Year</div>
                        </div>
                        <div className="metric-cell">
                            <div className="metric-cell-label">Experience Barrier</div>
                            <div className="metric-cell-value">{skill.experienceBarrier}</div>
                            <div className="metric-cell-sub">{expSub} typical</div>
                        </div>
                        <div className="metric-cell">
                            <div className="metric-cell-label">Saturation Risk</div>
                            <div className="metric-cell-value">{skill.saturationRisk}</div>
                            <div className="metric-cell-sub">Market Saturation</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="section">
                <div className="two-col-grid">
                    {/* Regional Demand */}
                    <div className="card">
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>📍 Regional Demand</h3>
                        {(skill.regionalDemand || []).map(r => (
                            <div key={r.city} className="demand-row">
                                <span className="demand-city">{r.city}</span>
                                <span className={`demand-level ${demandLevelClass(r.level)}`}>{r.level}</span>
                            </div>
                        ))}
                    </div>

                    {/* Related Skills */}
                    <div className="card">
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>🔗 Related Skills &amp; Ecosystem</h3>
                        <div className="related-skills-grid">
                            {(skill.recommended || []).slice(0, 6).map((relName, i) => (
                                <div
                                    key={relName}
                                    className="related-skill-card"
                                    onClick={() => navigate(`/skill/${encodeURIComponent(relName)}`)}
                                >
                                    <div className="related-usage-pct">{usagePcts[i] || 50}%</div>
                                    <div className="related-skill-name">{relName}</div>
                                    <div className="related-usage">Usage in {skill.name} Jobs</div>
                                    <div className="progress-bar" style={{ marginTop: '8px' }}>
                                        <div className="progress-fill blue" style={{ width: `${usagePcts[i] || 50}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Career Paths */}
                <div style={{ marginTop: '1.5rem' }}>
                    <div className="card">
                        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem' }}>🚀 Career Paths</h3>
                        <div className="stats-grid">
                            {(skill.careerPaths || []).map(path => {
                                const outlook = CAREER_OUTLOOKS[path] || { label: 'STABLE OUTLOOK', color: 'var(--accent-blue)' };
                                return (
                                    <div key={path} className="card" style={{ cursor: 'default', padding: '1.25rem' }}>
                                        <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>{CAREER_ICONS[path] || '🎯'}</div>
                                        <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.4rem' }}>{path}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                                            High demand across tech companies and enterprises.
                                        </div>
                                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: outlook.color, letterSpacing: '0.05em' }}>
                                            {outlook.label}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Recommended Skills */}
                <div style={{ marginTop: '1.5rem' }}>
                    <div className="card">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>✨ Recommended Skills</h3>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Fetched from /api/recommended</span>
                        </div>
                        {recommended.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)' }}>No recommendations found.</p>
                        ) : (
                            <div className="skills-grid">
                                {recommended.map((s, i) => !s.demandIndex ? (
                                    <div key={s.name} className="skill-card fade-in" style={{ animationDelay: `${i * 0.07}s` }}>
                                        <div className="skill-name">{s.name}</div>
                                        <div className="skill-category" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ecosystem skill</div>
                                    </div>
                                ) : (
                                    <div
                                        key={s.name}
                                        className="skill-card fade-in"
                                        style={{ animationDelay: `${i * 0.07}s` }}
                                        onClick={() => navigate(`/skill/${encodeURIComponent(s.name)}`)}
                                    >
                                        <div className="skill-card-header">
                                            <div className="skill-icon">{s.icon || '🔧'}</div>
                                            <div style={{ flex: 1 }}>
                                                <div className="skill-name">{s.name}</div>
                                                <div className="skill-category">{s.category}</div>
                                            </div>
                                        </div>
                                        <div className="skill-metrics">
                                            <div className="metric-item">
                                                <div className="metric-label">Demand</div>
                                                <div className="metric-value blue">{s.demandIndex}/10</div>
                                            </div>
                                            <div className="metric-item">
                                                <div className="metric-label">Salary</div>
                                                <div className="metric-value">${(s.salary / 1000).toFixed(0)}k</div>
                                            </div>
                                        </div>
                                        <div className="skill-card-footer">
                                            <span style={{ color: 'var(--accent-blue)', fontSize: '0.82rem', fontWeight: 600 }}>View Details →</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Footer />
        </>
    );
}
