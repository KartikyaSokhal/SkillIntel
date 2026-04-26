import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import LiveFeed from '../components/LiveFeed';
import SkillCard from '../components/SkillCard';
import Spinner from '../components/Spinner';

export default function Trends() {
    const [trending, setTrending] = useState([]);
    const [insight, setInsight] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/trending?limit=24')
            .then(r => r.json())
            .then(json => { if (json.success) setTrending(json.data || []); })
            .catch(() => {})
            .finally(() => setLoading(false));

        fetch('/api/insights/latest')
            .then(r => r.json())
            .then(json => { if (json.success && json.data) setInsight(json.data); })
            .catch(() => {});
    }, []);

    return (
        <>
            <Navbar />
            <div className="page-header" style={{ background: 'var(--bg-dark)' }}>
                <div className="page-header-inner">
                    <h1 className="page-title">Market Trends</h1>
                    <p className="page-subtitle">Live AI insights and top surging skills across the tech market.</p>
                </div>
            </div>
            
            <div className="section" style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
                <div style={{ marginBottom: '3rem' }}>
                    <LiveFeed insight={insight} />
                </div>
                
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>🔥 Trending Skills</h2>
                {loading ? (
                    <Spinner message="Loading trends..." />
                ) : trending.length > 0 ? (
                    <div className="trending-grid">
                        {trending.map((skill, i) => <SkillCard key={skill.name} skill={skill} index={i} />)}
                    </div>
                ) : (
                    <div className="empty-state">No trends available right now.</div>
                )}
            </div>
            <Footer />
        </>
    );
}
