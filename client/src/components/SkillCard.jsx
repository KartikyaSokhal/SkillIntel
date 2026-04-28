import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatSalaryLPA } from '../utils/currency';
const directionGlyph = { UP: '↑', DOWN: '↓', STABLE: '→' };
const directionClass = { UP: 'trend-up', DOWN: 'trend-down', STABLE: 'trend-stable' };
export default function SkillCard({ skill, index = 0 }) {
    const navigate = useNavigate();
    const growthColor = skill.growth >= 20 ? 'green' : skill.growth >= 10 ? 'blue' : 'text-muted';
    const growthSign = skill.growth > 0 ? '+' : '';
    const demandPct = (skill.demandIndex / 10) * 100;
    const hasTrend = typeof skill.trendScore === 'number' && skill.direction;
    const pctChange = typeof skill.percentChange === 'number' ? skill.percentChange : null;
    const pctSign = pctChange !== null && pctChange > 0 ? '+' : '';
    return (
        <motion.div
            className="skill-card"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: Math.min(index, 8) * 0.05, ease: 'easeOut' }}
            whileHover={{ y: -4, boxShadow: '0 12px 28px rgba(8, 15, 24, 0.45)' }}
            onClick={() => navigate(`/skill/${encodeURIComponent(skill.name)}`)}
        >
            <div className="skill-card-header">
                <div>
                    <div className="skill-icon">{skill.icon || '🔧'}</div>
                </div>
                <div style={{ flex: 1 }}>
                    <div className="skill-name">{skill.name}</div>
                    <div className="skill-category">{skill.category}</div>
                </div>
                {hasTrend && (
                    <div className={`trend-badge ${directionClass[skill.direction] || 'trend-stable'}`} title={`Trend score ${skill.trendScore}`}>
                        <span className="trend-arrow">{directionGlyph[skill.direction] || '→'}</span>
                        {pctChange !== null && (
                            <span className="trend-pct">{pctSign}{pctChange.toFixed(1)}%</span>
                        )}
                    </div>
                )}
            </div>
            <div className="skill-tags">
                {(skill.tags || []).map(t => (
                    <span key={t} className="tag tag-gray">{t}</span>
                ))}
            </div>
            <div className="skill-metrics">
                <div className="metric-item">
                    <div className="metric-label">Demand Index</div>
                    <div className="metric-value blue">
                        {skill.demandIndex}
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/10</span>
                    </div>
                </div>
                <div className="metric-item">
                    <div className="metric-label">Avg Salary (India)</div>
                    <div className="metric-value">{formatSalaryLPA(skill.salary)}</div>
                </div>
                <div className="metric-item">
                    <div className="metric-label">Growth YoY</div>
                    <div className={`metric-value ${growthColor}`}>{growthSign}{skill.growth}%</div>
                </div>
                <div className="metric-item">
                    <div className="metric-label">Experience</div>
                    <div className="metric-value" style={{ fontSize: '0.85rem' }}>{skill.experienceBarrier}</div>
                </div>
            </div>
            <div>
                <div className="demand-bar-wrapper">
                    <div className="demand-bar-track">
                        <div className="demand-bar-fill" style={{ width: `${demandPct}%` }} />
                    </div>
                </div>
            </div>
            <div className="skill-card-footer">
                <span className="text-muted" style={{ fontSize: '0.8rem' }}>View Details →</span>
            </div>
        </motion.div>
    );
}
