/**
 * ═══════════════════════════════════════════════════════════════
 * Trends Scheduler — SkillIntel
 * ═══════════════════════════════════════════════════════════════
 *
 * Arms the trends pipeline:
 *   - Every 6 hours via node-cron ('0 *​/6 * * *').
 *   - Once at startup IF no SkillTrend doc exists in the last 24h
 *     (so dev restarts don't hammer external APIs).
 *
 * Imported from server.js after the Mongo connection resolves.
 * Idempotent — re-importing won't double-arm because the cron task
 * is module-scoped.
 * ═══════════════════════════════════════════════════════════════
 */

const cron = require('node-cron');
const SkillTrend = require('../models/SkillTrend');
const { runTrendsPipeline } = require('../services/trendsPipeline');

const CRON_EXPR = process.env.TRENDS_CRON || '0 */6 * * *';
const STARTUP_FRESHNESS_HOURS = 24;

let armed = false;

async function maybeRunOnStartup() {
    try {
        const cutoff = new Date(Date.now() - STARTUP_FRESHNESS_HOURS * 60 * 60 * 1000);
        const recent = await SkillTrend.findOne({ timestamp: { $gte: cutoff } }).lean();
        if (recent) {
            console.log('[scheduler] recent skill_trends doc exists — skipping startup run.');
            return;
        }
        console.log('[scheduler] no recent skill_trends — running pipeline once on startup.');
        runTrendsPipeline().catch((err) => {
            console.error('[scheduler] startup run failed:', err.message);
        });
    } catch (err) {
        console.warn('[scheduler] startup-freshness check failed:', err.message);
    }
}

function arm() {
    if (armed) return;
    armed = true;

    if (!cron.validate(CRON_EXPR)) {
        console.warn(`[scheduler] invalid TRENDS_CRON "${CRON_EXPR}", not scheduling.`);
        return;
    }

    cron.schedule(CRON_EXPR, () => {
        console.log(`[scheduler] cron tick — running trends pipeline (${CRON_EXPR}).`);
        runTrendsPipeline().catch((err) => {
            console.error('[scheduler] cron run failed:', err.message);
        });
    });

    console.log(`[scheduler] trends pipeline armed (cron: ${CRON_EXPR}).`);
    maybeRunOnStartup();
}

module.exports = { arm };
