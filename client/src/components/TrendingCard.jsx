import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

/**
 * TrendingCard — compact trending skill card for the dashboard.
 * @param {{ skill: object, rank: number, delay?: number }} props
 */
export default function TrendingCard({ skill, rank, delay = 0 }) {
    const displayChange = (typeof skill.percentChange === 'number')
        ? skill.percentChange
        : (typeof skill.growth === 'number' ? skill.growth : 0);

    const sign = displayChange > 0 ? '+' : '';
    const growthClass = displayChange > 0 ? 'up' : displayChange < 0 ? 'down' : 'stable';

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay, ease: 'easeOut' }}
        >
            <Link
                to={`/skill/${encodeURIComponent(skill.name)}`}
                className="dashboard-trending-card"
            >
                <div className="dashboard-trend-rank">#{rank}</div>
                <div className="dashboard-trend-info">
                    <div className="dashboard-trend-name">
                        {skill.icon || '🔧'} {skill.name}
                    </div>
                    <div className={`dashboard-trend-growth ${growthClass}`}>
                        {sign}{displayChange}% change
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}
