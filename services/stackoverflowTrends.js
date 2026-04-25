/**
 * ═══════════════════════════════════════════════════════════════
 * Stack Overflow Trends Service — SkillIntel
 * ═══════════════════════════════════════════════════════════════
 *
 * Hits the unauthenticated Stack Exchange API to count tagged
 * questions in the last 7 days for each skill. The raw count is
 * the StackOverflow component of trend_score.
 *
 * - No API key required (public endpoint, ~300 req/day quota).
 * - One sequenced call per skill, throttled to stay polite.
 * - Fail-soft: any error returns whatever scores we collected so far.
 * ═══════════════════════════════════════════════════════════════
 */

const axios = require('axios');

const SO_BASE = 'https://api.stackexchange.com/2.3/search';

/**
 * Stack Overflow tags are slugified: lowercase, dots removed, spaces
 * become hyphens. e.g. "Node.js" → "node.js" (kept as-is for tag),
 * "Machine Learning" → "machine-learning".
 */
function toTag(skill) {
    return skill
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9.\-+#]/g, '');
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @param {string[]} skillNames
 * @returns {Promise<{ [skill: string]: number }>}
 */
async function fetchStackOverflowTrends(skillNames) {
    if (!Array.isArray(skillNames) || skillNames.length === 0) return {};

    const fromDateUnix = Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000);
    const counts = Object.create(null);

    for (const skill of skillNames) {
        const tag = toTag(skill);
        if (!tag) continue;

        try {
            const res = await axios.get(SO_BASE, {
                params: {
                    site: 'stackoverflow',
                    tagged: tag,
                    fromdate: fromDateUnix,
                    pagesize: 1,
                    filter: 'total'
                },
                timeout: 10000
            });

            const total = (res.data && typeof res.data.total === 'number') ? res.data.total : 0;
            counts[skill] = total;

            if (res.data && res.data.backoff) {
                await sleep(res.data.backoff * 1000);
            } else {
                await sleep(120);
            }
        } catch (err) {
            const status = err.response && err.response.status;
            const reason = status ? `HTTP ${status}` : err.code || err.message;
            console.warn(`[stackoverflowTrends] ${skill} failed (${reason}); skipping.`);
            if (status === 429 || status === 502 || status === 503) break;
        }
    }

    return counts;
}

module.exports = fetchStackOverflowTrends;
