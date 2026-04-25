/**
 * ═══════════════════════════════════════════════════════════════
 * Google Trends Service — SkillIntel
 * ═══════════════════════════════════════════════════════════════
 *
 * Thin axios wrapper over the FastAPI `trend-service` (see
 * `trend-service/main.py`). The service itself wraps `pytrends`.
 *
 * Contract: ALWAYS return an object — `{ [skill]: 0–100 }`. Never
 * throw. If TREND_SERVICE_URL is missing or the service is down,
 * we log a warning and return `{}` so `trendScorer` can redistribute
 * Google Trends' weight across the remaining sources.
 * ═══════════════════════════════════════════════════════════════
 */

const axios = require('axios');

/**
 * @param {string[]} skillNames
 * @param {object}  [options]
 * @param {string}  [options.timeframe='today 3-m']
 * @param {string}  [options.geo='']
 * @returns {Promise<{ [skill: string]: number }>}
 */
async function fetchGoogleTrends(skillNames, { timeframe = 'today 3-m', geo = '' } = {}) {
    if (!Array.isArray(skillNames) || skillNames.length === 0) return {};

    const baseUrl = process.env.TREND_SERVICE_URL && process.env.TREND_SERVICE_URL.trim();
    if (!baseUrl) {
        console.warn('[googleTrends] TREND_SERVICE_URL is not set — Google Trends source disabled.');
        return {};
    }

    const url = `${baseUrl.replace(/\/$/, '')}/interest`;

    try {
        const res = await axios.get(url, {
            params: {
                keywords: skillNames.join(','),
                timeframe,
                geo
            },
            timeout: 60000
        });

        const scores = res.data && res.data.scores;
        if (!scores || typeof scores !== 'object') return {};

        const failed = Array.isArray(res.data && res.data.failedKeywords) ? res.data.failedKeywords : [];
        if (failed.length) {
            console.warn(`[googleTrends] partial result — ${failed.length} keyword(s) failed at upstream.`);
        }

        return scores;
    } catch (err) {
        const status = err.response && err.response.status;
        const reason = status ? `HTTP ${status}` : err.code || err.message;
        console.warn(`[googleTrends] unreachable (${reason}) — falling back to empty scores.`);
        return {};
    }
}

module.exports = fetchGoogleTrends;
