import { motion, AnimatePresence } from 'framer-motion';

export default function LiveFeed({ insight }) {
    if (!insight) return null;

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={insight._id || insight.title}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5, type: 'spring', bounce: 0.4 }}
                className="dashboard-section"
                style={{
                    background: 'linear-gradient(135deg, rgba(6,182,212,0.1) 0%, rgba(59,130,246,0.05) 100%)',
                    borderLeft: '4px solid var(--accent-cyan)',
                    padding: '1.5rem',
                    marginBottom: '2rem'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>⚡</span>
                    <h3 style={{ margin: 0, color: 'var(--accent-cyan)', fontSize: '1.1rem' }}>
                        Live Weekly Insight
                    </h3>
                    <span className="dashboard-live-tag" style={{ marginLeft: 'auto' }}>NEW</span>
                </div>
                <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '1.2rem' }}>
                    {insight.title}
                </h4>
                <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '0.95rem' }}>
                    {insight.content}
                </p>
                {insight.topSkills && insight.topSkills.length > 0 && (
                    <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                        {insight.topSkills.map(skill => (
                            <span key={skill} className="tag tag-cyan" style={{ fontSize: '0.75rem' }}>
                                #{skill}
                            </span>
                        ))}
                    </div>
                )}
            </motion.div>
        </AnimatePresence>
    );
}
