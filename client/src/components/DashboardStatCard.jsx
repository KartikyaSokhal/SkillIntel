import { motion } from 'framer-motion';

/**
 * DashboardStatCard — reusable stat card for the dashboard.
 * @param {{ icon: string, value: string|number, label: string, accent?: string, delay?: number }} props
 */
export default function DashboardStatCard({ icon, value, label, accent = '', delay = 0 }) {
    return (
        <motion.div
            className="dashboard-stat-card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay, ease: 'easeOut' }}
        >
            <div className="dashboard-stat-icon">{icon}</div>
            <div className={`dashboard-stat-value ${accent}`}>{value}</div>
            <div className="dashboard-stat-label">{label}</div>
        </motion.div>
    );
}
