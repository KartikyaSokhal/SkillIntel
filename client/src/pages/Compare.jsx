import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Spinner from '../components/Spinner';

const SKILL_COLORS = ['#2563eb', '#ef4444', '#10b981', '#8b5cf6'];
const INDUSTRIES = ['FinTech & Banking', 'E-Commerce', 'Healthcare', 'AI & Startups'];

export default function Compare() {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    const [inputs, setInputs] = useState(['', '', '']);
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const industryRandRef = useRef(null);

    // Pre-fill from URL
    useEffect(() => {
        const urlSkills = searchParams.get('skills');
        if (urlSkills) {
            const parts = urlSkills.split(',');
            const newInputs = ['', '', ''];
            parts.forEach((p, i) => { if (i < 3) newInputs[i] = p; });
            setInputs(newInputs);
            if (parts.length >= 2) doCompare(newInputs);
        }
    }, []); // eslint-disable-line

    const setInput = (i, val) => setInputs(prev => { const n = [...prev]; n[i] = val; return n; });

    async function doCompare(overrideInputs) {
        const chosen = (overrideInputs || inputs).filter(Boolean);
        if (chosen.length < 2) { alert('Please enter at least 2 skills to compare.'); return; }

        setLoading(true);
        setResults(null);
        setError(null);
        // stable random seed for industry bars
        industryRandRef.current = chosen.map(() => INDUSTRIES.map(() => Math.floor(Math.random() * 40 + 15)));

        try {
            const res = await fetch(`/api/skills/compare?skills=${encodeURIComponent(chosen.join(','))}`);
            const json = await res.json();
            if (json.error) throw new Error(json.error);
            const valid = json.data.filter(s => !s.error);
            if (valid.length === 0) throw new Error('None of the provided skills were found.');
            setResults(valid);
            setSearchParams({ skills: chosen.join(',') });
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    function quickCompare(s1, s2, s3) {
        const newInputs = [s1, s2, s3 || ''];
        setInputs(newInputs);
        doCompare(newInputs);
    }

    const expertVerdict = results ? (() => {
        const sorted = [...results].sort((a, b) => b.demandIndex - a.demandIndex);
        const top = sorted[0];
        const bottom = sorted[sorted.length - 1];
        const runner = sorted[1];
        return { top, bottom, runner };
    })() : null;

    return (
        <>
            <Navbar action={
                <button className="btn btn-secondary btn-sm" onClick={() => { if (navigator.clipboard) navigator.clipboard.writeText(window.location.href); alert('URL copied!'); }}>
                    ⬆ Share Report
                </button>
            } />

            {/* Page Header */}
            <div className="page-header">
                <div className="page-header-inner">
                    <div>
                        <div className="breadcrumb">
                            <Link to="/">Home</Link><span>›</span>
                            <Link to="/explorer">Skills</Link><span>›</span>
                            <span>Comparison</span>
                        </div>
                        <h1 className="page-title">Compare Skills</h1>
                        <p className="page-subtitle">Benchmarking performance metrics across technologies</p>
                    </div>
                </div>
            </div>

            {/* Selector */}
            <div style={{ background: 'white', borderBottom: '1px solid var(--border-color)', padding: '1.5rem 2rem' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
                        <input
                            type="text"
                            className="compare-skill-input"
                            placeholder="Skill 1 (e.g. React)"
                            value={inputs[0]}
                            onChange={e => setInput(0, e.target.value)}
                            style={{ maxWidth: '220px' }}
                        />
                        <div className="vs-badge">VS</div>
                        <input
                            type="text"
                            className="compare-skill-input"
                            placeholder="Skill 2 (e.g. Angular)"
                            value={inputs[1]}
                            onChange={e => setInput(1, e.target.value)}
                            style={{ maxWidth: '220px' }}
                        />
                        <div className="vs-badge">VS</div>
                        <input
                            type="text"
                            className="compare-skill-input"
                            placeholder="Skill 3 (optional)"
                            value={inputs[2]}
                            onChange={e => setInput(2, e.target.value)}
                            style={{ maxWidth: '220px' }}
                        />
                        <button className="btn btn-primary" onClick={() => doCompare()}>⚖️ Compare</button>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>Quick compare:</span>
                        <button className="filter-btn" onClick={() => quickCompare('React', 'Angular', 'Vue.js')}>React vs Angular vs Vue</button>
                        <button className="filter-btn" onClick={() => quickCompare('Python', 'JavaScript', 'Go')}>Python vs JS vs Go</button>
                        <button className="filter-btn" onClick={() => quickCompare('AWS', 'Docker', 'Kubernetes')}>Cloud &amp; DevOps</button>
                        <button className="filter-btn" onClick={() => quickCompare('Node.js', 'Java', 'Python')}>Backend Languages</button>
                    </div>
                </div>
            </div>

            {/* Loading */}
            {loading && <Spinner message="Fetching comparison data from /api/compare…" />}

            {/* Error */}
            {error && (
                <div className="error-state" style={{ padding: '3rem' }}>
                    <h2>⚠️ {error}</h2>
                    <p>Try different skill names.</p>
                </div>
            )}

            {/* Empty State */}
            {!loading && !results && !error && (
                <div style={{ textAlign: 'center', padding: '5rem 2rem', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚖️</div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem' }}>Select Skills to Compare</h2>
                    <p>Enter 2-3 skills above and click <strong>Compare</strong>, or use a quick compare preset.</p>
                </div>
            )}

            {/* Results */}
            {results && !loading && (
                <>
                    {/* Cards header */}
                    <div style={{ background: 'white', borderBottom: '1px solid var(--border-color)', padding: '1.5rem 2rem' }}>
                        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${results.length}, 1fr)`, gap: '1rem' }}>
                                {results.map((s, i) => (
                                    <div key={s.name} className="compare-slot" style={{ borderTop: `3px solid ${SKILL_COLORS[i]}` }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                            <div style={{ width: 42, height: 42, background: 'var(--bg-primary)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', border: '1px solid var(--border-color)' }}>
                                                {s.icon || '🔧'}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 800, fontSize: '1rem' }}>{s.name}</div>
                                                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{s.description || s.category}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                            {(s.tags || []).map(t => <span key={t} className="tag tag-gray">{t}</span>)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="section">
                        {/* Metrics Table */}
                        <div className="card mb-3" style={{ padding: 0, overflow: 'hidden' }}>
                            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                                <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>📊 Performance Metrics Matrix</h3>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table className="compare-table">
                                    <thead>
                                        <tr>
                                            <th className="metric-col">Metric</th>
                                            {results.map((s, i) => (
                                                <th key={s.name}><span style={{ color: SKILL_COLORS[i], fontWeight: 700 }}>{s.name}</span></th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="metric-col">Demand Index</td>
                                            {results.map((s, i) => (
                                                <td key={s.name}><span style={{ color: SKILL_COLORS[i], fontWeight: 700 }}>{s.demandIndex}/10</span></td>
                                            ))}
                                        </tr>
                                        <tr>
                                            <td className="metric-col">Avg Salary (USD)</td>
                                            {results.map(s => <td key={s.name}><strong>${s.salary.toLocaleString()}</strong></td>)}
                                        </tr>
                                        <tr>
                                            <td className="metric-col">Growth Momentum (YoY)</td>
                                            {results.map(s => (
                                                <td key={s.name}>
                                                    <span style={{ color: s.growth >= 20 ? 'var(--accent-green)' : s.growth >= 10 ? 'var(--accent-blue)' : 'var(--accent-red)', fontWeight: 700 }}>
                                                        +{s.growth}%
                                                    </span>
                                                </td>
                                            ))}
                                        </tr>
                                        <tr>
                                            <td className="metric-col">Experience Barrier</td>
                                            {results.map(s => (
                                                <td key={s.name}>
                                                    <span className={`tag ${s.experienceBarrier === 'Low' ? 'tag-green' : s.experienceBarrier === 'Moderate' ? 'tag-orange' : 'tag-red'}`}>
                                                        {s.experienceBarrier}
                                                    </span>
                                                </td>
                                            ))}
                                        </tr>
                                        <tr>
                                            <td className="metric-col">Saturation Risk</td>
                                            {results.map(s => <td key={s.name}><span style={{ color: 'var(--text-secondary)' }}>{s.saturationRisk}</span></td>)}
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Growth + Industry */}
                        <div className="two-col-grid" style={{ marginTop: '1.5rem' }}>
                            <div className="card">
                                <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.25rem' }}>📈 Growth Momentum (YoY)</h3>
                                {results.map((s, i) => {
                                    const maxGrowth = Math.max(...results.map(x => x.growth));
                                    const pct = maxGrowth > 0 ? Math.round((s.growth / maxGrowth) * 100) : 0;
                                    return (
                                        <div key={s.name} style={{ marginBottom: '1rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{s.name}</span>
                                                <span style={{ color: SKILL_COLORS[i], fontWeight: 700, fontSize: '0.88rem' }}>+{s.growth}%</span>
                                            </div>
                                            <div className="progress-bar">
                                                <div className="progress-fill" style={{ width: `${pct}%`, background: SKILL_COLORS[i] }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="card">
                                <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '1.25rem' }}>🏭 Market Share by Industry</h3>
                                {INDUSTRIES.map((ind, ii) => {
                                    const randWidths = (industryRandRef.current || results.map(() => INDUSTRIES.map(() => 20)))[0];
                                    const best = results[ii % results.length];
                                    return (
                                        <div key={ind} style={{ marginBottom: '1rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>{ind}</span>
                                                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>High: {best.name}</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '3px' }}>
                                                {results.map((s, i) => {
                                                    const seed = industryRandRef.current?.[i]?.[ii] ?? 20;
                                                    return <div key={s.name} style={{ height: '6px', borderRadius: '2px', background: SKILL_COLORS[i], flex: seed }} />;
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                                    {results.map((s, i) => (
                                        <span key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', fontWeight: 500 }}>
                                            <span style={{ width: 10, height: 10, borderRadius: 2, background: SKILL_COLORS[i], display: 'inline-block' }} />
                                            {s.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Expert Verdict */}
                        {expertVerdict && (
                            <div style={{ marginTop: '1.5rem', background: 'var(--bg-dark)', borderRadius: 'var(--border-radius)', padding: '1.75rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                                <div style={{ width: 48, height: 48, background: 'rgba(255,255,255,0.1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
                                    💡
                                </div>
                                <div style={{ flex: 1, minWidth: 200 }}>
                                    <div style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.05em', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem' }}>
                                        EXPERT VERDICT
                                    </div>
                                    <p style={{ color: 'white', fontSize: '0.95rem', lineHeight: 1.6 }}>
                                        Based on current market trends,{' '}
                                        <span style={{ color: '#60a5fa', fontWeight: 700 }}>{expertVerdict.top.name}</span> leads with the highest demand index of {expertVerdict.top.demandIndex}/10.{' '}
                                        {expertVerdict.runner && expertVerdict.runner.growth > expertVerdict.top.growth
                                            ? <><span style={{ color: '#34d399', fontWeight: 700 }}>{expertVerdict.runner.name}</span> is outpacing with {expertVerdict.runner.growth}% YoY growth.</>
                                            : <>{expertVerdict.top.name} continues to dominate placement rates across sectors.</>
                                        }
                                    </p>
                                </div>
                                <Link to="/explorer" className="btn btn-secondary btn-sm" style={{ flexShrink: 0 }}>View Detailed Roadmap</Link>
                            </div>
                        )}
                    </div>
                </>
            )}

            <Footer />
        </>
    );
}
