/**
 * ═══════════════════════════════════════════════════════════════
 * GitHub Trends Service — SkillIntel
 * ═══════════════════════════════════════════════════════════════
 *
 * Pulls trending repositories from the GitHub Search API and counts
 * how often each tracked skill appears across repo names, descriptions,
 * and topics. The resulting `{ [skill]: count }` map is consumed by
 * `trendsPipeline` to compute the GitHub component of trend_score.
 *
 * - Authenticated requests use GITHUB_TOKEN (5,000 req/h budget).
 * - One search call per pipeline run keeps us safely under the limit.
 * - Fail-soft: any error returns {} so the pipeline never crashes.
 * ═══════════════════════════════════════════════════════════════
 */

const axios = require('axios');
const normalize = require('./skillNormalizer');

const GITHUB_API = 'https://api.github.com/search/repositories';

/**
 * Builds the YYYY-MM-DD lookback date for the GitHub `created:>` filter.
 */
function lookbackDate(daysAgo = 14) {
    const d = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 10);
}

/**
 * Builds a regex that matches the skill as a whole word, case-insensitive.
 * Handles dotted names like "Node.js" by escaping regex metacharacters.
 */
function skillPattern(skill) {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i');
}

/**
 * Fetches up to `pages` × 100 trending repos created in the last `daysAgo` days
 * and counts mentions of each skill in `skillNames`.
 *
 * @param {string[]} skillNames — list of skill names to score
 * @param {object} [options]
 * @param {number} [options.pages=1] — pagination depth (max 10)
 * @param {number} [options.daysAgo=14] — lookback window
 * @returns {Promise<{ [skill: string]: number }>}
 */
async function fetchGitHubTrends(skillNames, { pages = 1, daysAgo = 14 } = {}) {
    if (!Array.isArray(skillNames) || skillNames.length === 0) return {};

    const token = process.env.GITHUB_TOKEN && process.env.GITHUB_TOKEN.trim();
    if (!token) {
        console.warn('[githubTrends] GITHUB_TOKEN is not set — skipping GitHub source.');
        return {};
    }

    const headers = {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'SkillIntel-TrendEngine'
    };

    const since = lookbackDate(daysAgo);
    const counts = Object.create(null);
    const patterns = skillNames.map((name) => ({ name, normalized: normalize(name), regex: skillPattern(name) }));

    for (let page = 1; page <= Math.min(pages, 10); page += 1) {
        try {
            const res = await axios.get(GITHUB_API, {
                headers,
                params: {
                    q: `created:>${since} stars:>10`,
                    sort: 'stars',
                    order: 'desc',
                    per_page: 100,
                    page
                },
                timeout: 15000
            });

            const items = Array.isArray(res.data && res.data.items) ? res.data.items : [];
            if (items.length === 0) break;

            for (const repo of items) {
                const haystack = [
                    repo.name || '',
                    repo.full_name || '',
                    repo.description || '',
                    Array.isArray(repo.topics) ? repo.topics.join(' ') : ''
                ].join(' ');

                for (const { normalized, regex } of patterns) {
                    if (regex.test(haystack)) {
                        counts[normalized] = (counts[normalized] || 0) + 1;
                    }
                }
            }
        } catch (err) {
            const status = err.response && err.response.status;
            const reason = status ? `HTTP ${status}` : err.message;
            console.warn(`[githubTrends] page ${page} failed (${reason}) — returning partial counts.`);
            break;
        }
    }

    return counts;
}

module.exports = fetchGitHubTrends;
