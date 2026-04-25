import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Spinner from '../components/Spinner';
import { formatSalaryLPA } from '../utils/currency';

function ExplorerCard({ skill, index }) {
    const navigate = useNavigate();
    const growthColor = skill.growth >= 20 ? 'green' : skill.growth >= 10 ? 'blue' : 'text-muted';
    const growthSign = skill.growth > 0 ? '+' : '';
    const demandPct = (skill.demandIndex / 10) * 100;

    return (
        <div
            className="skill-card fade-in"
            style={{ animationDelay: `${Math.min(index, 8) * 0.06}s` }}
            onClick={() => navigate(`/skill/${encodeURIComponent(skill.name)}`)}
        >
            <div className="skill-card-header">
                <div className="skill-icon">{skill.icon || '🔧'}</div>
                <div style={{ flex: 1 }}>
                    <div className="skill-name">{skill.name}</div>
                    <div className="skill-category">{skill.category}</div>
                </div>
            </div>

            <div className="demand-bar-wrapper">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Demand</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-blue)' }}>{skill.demandIndex}/10</span>
                </div>
                <div className="demand-bar-track">
                    <div className="demand-bar-fill" style={{ width: `${demandPct}%` }} />
                </div>
            </div>

            <div className="skill-metrics">
                <div className="metric-item">
                    <div className="metric-label">Avg Salary (India)</div>
                    <div className="metric-value">{formatSalaryLPA(skill.salary)}</div>
                </div>
                <div className="metric-item">
                    <div className="metric-label">Growth YoY</div>
                    <div className={`metric-value ${growthColor}`}>{growthSign}{skill.growth}%</div>
                </div>
            </div>

            <div className="skill-card-footer">
                <div className="skill-tags" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{skill.description || ''}</div>
                <span style={{ color: 'var(--accent-blue)', fontSize: '0.82rem', fontWeight: 600 }}>Details →</span>
            </div>
        </div>
    );
}

export default function Explorer() {
    const [allSkills, setAllSkills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeCat, setActiveCat] = useState('All');
    const [filterText, setFilterText] = useState('');
    const [error, setError] = useState(false);

    useEffect(() => {
        fetch('/api/skills')
            .then(r => r.json())
            .then(json => { setAllSkills(json.data || []); setLoading(false); })
            .catch(() => { setError(true); setLoading(false); });
    }, []);

    const categories = useMemo(() => ['All', ...new Set(allSkills.map(s => s.category))], [allSkills]);

    const filtered = useMemo(() => {
        let result = allSkills;
        if (activeCat !== 'All') result = result.filter(s => s.category === activeCat);
        if (filterText) {
            const q = filterText.toLowerCase();
            result = result.filter(s =>
                s.name.toLowerCase().includes(q) ||
                s.category.toLowerCase().includes(q) ||
                (s.tags || []).some(t => t.toLowerCase().includes(q))
            );
        }
        return result;
    }, [allSkills, activeCat, filterText]);

    return (
        <>
            <Navbar action={<Link to="/compare" className="btn btn-secondary btn-sm">Compare Skills</Link>} />

            {/* Page Header */}
            <div className="page-header">
                <div className="page-header-inner">
                    <div>
                        <div className="breadcrumb">
                            <Link to="/">Home</Link><span>›</span><span>Skills</span>
                        </div>
                        <h1 className="page-title">Skills Explorer</h1>
                        <p className="page-subtitle">Browse all <strong>{allSkills.length}</strong> tracked skills with live market intelligence.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <div className="search-wrapper" style={{ maxWidth: '280px' }}>
                            <span className="search-icon">🔍</span>
                            <input
                                type="text"
                                placeholder="Filter skills…"
                                value={filterText}
                                onChange={e => setFilterText(e.target.value)}
                                autoComplete="off"
                            />
                        </div>
                        <Link to="/compare" className="btn btn-primary">⚖️ Compare</Link>
                    </div>
                </div>
            </div>

            {/* Category Filters */}
            <div style={{ background: 'white', borderBottom: '1px solid var(--border-color)', padding: '0.75rem 2rem' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div className="filters-bar">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                className={`filter-btn${activeCat === cat ? ' active' : ''}`}
                                onClick={() => setActiveCat(cat)}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="section">
                {loading ? (
                    <Spinner message="Fetching skill intelligence…" />
                ) : error ? (
                    <div className="error-state" style={{ gridColumn: '1/-1' }}>
                        <h2>⚠️ Server Unreachable</h2>
                        <p>Ensure the server is running: <code>node server.js</code></p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>No skills matched your search.</p>
                        <p>Try a different keyword or clear the filter.</p>
                    </div>
                ) : (
                    <div className="skills-grid">
                        {filtered.map((skill, i) => <ExplorerCard key={skill.name} skill={skill} index={i} />)}
                    </div>
                )}
            </div>

            <Footer />
        </>
    );
}
