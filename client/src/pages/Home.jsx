import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SkillCard from '../components/SkillCard';
import Spinner from '../components/Spinner';
import { formatSalaryLPA } from '../utils/currency';

export default function Home() {
    const [trending, setTrending] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchVal, setSearchVal] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetch('/api/skills/trending')
            .then(r => r.json())
            .then(json => { setTrending(json.data || []); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const handleSearch = () => {
        if (searchVal.trim()) navigate(`/skill/${encodeURIComponent(searchVal.trim())}`);
    };

    const top6 = trending.slice(0, 6);
    const top5pills = trending.slice(0, 5);
    const highestPay = trending.length ? Math.max(...trending.map(s => s.salary)) : 0;
    const topDemand = trending.length
        ? [...trending].sort((a, b) => b.demandIndex - a.demandIndex)[0]
        : null;

    return (
        <>
            <Navbar action={<Link to="/explorer" className="btn btn-primary">Explore Skills</Link>} />

            {/* Hero */}
            <section className="hero">
                <div className="hero-badge">
                    <span className="hero-badge-dot" />
                    LIVE MARKET INTELLIGENCE
                </div>
                <h1 className="hero-title">
                    Understand the Real Market<br />
                    <span>Value of Skills</span>
                </h1>
                <p className="hero-subtitle">
                    Analyze labor market data for skill demand, salary benchmarks, and long-term growth trajectories.
                    Make data-driven career and hiring decisions.
                </p>

                <div className="hero-search-area">
                    <div className="search-wrapper">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Search a skill (e.g. React, Python, AWS)"
                            value={searchVal}
                            onChange={e => setSearchVal(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                            autoComplete="off"
                        />
                        <button className="btn btn-primary" onClick={handleSearch}>Analyze</button>
                    </div>
                    <div className="hero-trending">
                        <span className="trending-label">Trending:</span>
                        {top5pills.map(s => (
                            <span
                                key={s.name}
                                className="trending-pill"
                                onClick={() => navigate(`/skill/${encodeURIComponent(s.name)}`)}
                            >
                                {s.name}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="hero-cta">
                    <Link to="/explorer" className="btn btn-primary">Explore the Skill Market</Link>
                    <Link to="/explorer" className="btn btn-secondary">View All Skills →</Link>
                </div>
            </section>

            {/* Stats Strip */}
            <div className="stats-strip">
                <div className="stats-strip-inner">
                    <div className="stat-item">
                        <span className="stat-icon">📈</span>
                        <span className="stat-badge green">+248%</span>
                        <span className="stat-label">Fastest Growing</span>
                        <span className="stat-value">Generative AI</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-icon">💰</span>
                        <span className="stat-badge blue">Top Tier</span>
                        <span className="stat-label">Highest Paying</span>
                        <span className="stat-value">
                            {highestPay ? `${formatSalaryLPA(highestPay)} Avg.` : '₹19 LPA Avg.'}
                        </span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-icon">⭐</span>
                        <span className="stat-badge purple">High Volume</span>
                        <span className="stat-label">Most In-Demand</span>
                        <span className="stat-value">{topDemand ? topDemand.name : 'Python'}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-icon">🚀</span>
                        <span className="stat-badge orange">Emerging</span>
                        <span className="stat-label">Emerging Tech</span>
                        <span className="stat-value">Rust</span>
                    </div>
                </div>
            </div>

            {/* Trending Dashboard */}
            <div style={{ background: 'white', borderBottom: '1px solid var(--border-color)', padding: '3rem 2rem' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div className="section-header">
                        <div className="section-label">🔥 TRENDING NOW</div>
                        <h2 className="section-title">Skill Intelligence Dashboard</h2>
                        <p className="section-subtitle">Top skills ranked by current market momentum and growth trajectories.</p>
                    </div>
                    {loading ? (
                        <Spinner message="Loading trending skills…" />
                    ) : top6.length > 0 ? (
                        <div className="skills-grid">
                            {top6.map((skill, i) => <SkillCard key={skill.name} skill={skill} index={i} />)}
                        </div>
                    ) : (
                        <div className="error-state">
                            <h2>⚠️ Could not load data</h2>
                            <p>Make sure the server is running on port 3000.</p>
                        </div>
                    )}
                    <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                        <Link to="/explorer" className="btn btn-secondary">View All Skills →</Link>
                    </div>
                </div>
            </div>

            <Footer />
        </>
    );
}
