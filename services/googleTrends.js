const axios = require('axios');
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
