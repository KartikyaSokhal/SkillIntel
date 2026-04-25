/**
 * ═══════════════════════════════════════════════════════════════
 * Trend Scorer — SkillIntel
 * ═══════════════════════════════════════════════════════════════
 *
 * Pure (no I/O, no DB) function that turns raw per-source signals
 * into a unified `trendScore` plus `direction` and `percentChange`.
 *
 * Formula (from spec):
 *   trend_score = (job_growth        * 0.5)
 *               + (github_growth     * 0.2)
 *               + (stackoverflow_growth * 0.2)
 *               + (google_trend_growth  * 0.1)
 *
 * Robustness:
 *   - If a source returns nothing (`{}` or 0 across the board), its
 *     weight is redistributed proportionally to the remaining
 *     sources so the score stays in 0–100.
 *   - Each component is independently normalized to a 0–100 "growth"
 *     value before weighting.
 * ═══════════════════════════════════════════════════════════════
 */

const BASE_WEIGHTS = {
    job: 0.5,
    github: 0.2,
    stackoverflow: 0.2,
    google: 0.1
};

const STABLE_DELTA = 5; // |percentChange| under this stays STABLE

function clamp(n, min = 0, max = 100) {
    if (!Number.isFinite(n)) return min;
    return Math.max(min, Math.min(max, n));
}

function percentDelta(current, previous) {
    if (!previous || previous === 0) {
        if (!current) return 0;
        return 100;
    }
    return ((current - previous) / previous) * 100;
}

/**
 * Maps a percent change in [-∞, +∞] onto a 0–100 growth signal:
 *   −100% → 0, 0% → 50, +100% → 100, capped at the ends.
 */
function growthFromPercent(pct) {
    return clamp(50 + pct / 2);
}

/**
 * Normalizes a raw count against the max raw count seen across the
 * batch into a 0–100 score. Used for sources where we don't have a
 * "previous" snapshot (first run) or where the source is intrinsically
 * a snapshot (Google Trends already returns 0–100).
 */
function normalizeAgainstMax(value, max) {
    if (!max || max <= 0) return 0;
    return clamp((value / max) * 100);
}

/**
 * Picks the active weight set, redistributing weight from disabled
 * sources (those flagged false) proportionally to the active ones.
 */
function activeWeights(activeFlags) {
    const total = Object.entries(BASE_WEIGHTS).reduce((sum, [k, w]) => sum + (activeFlags[k] ? w : 0), 0);
    if (total === 0) return { ...BASE_WEIGHTS };
    const out = {};
    for (const [k, w] of Object.entries(BASE_WEIGHTS)) {
        out[k] = activeFlags[k] ? w / total : 0;
    }
    return out;
}

/**
 * Compute the trend score for one skill.
 *
 * @param {object} input
 * @param {number} input.jobCountCurrent
 * @param {number} input.jobCountPrevious
 * @param {number} input.githubCount
 * @param {number} input.githubMax — max githubCount across the current batch
 * @param {number} input.stackoverflowCount
 * @param {number} input.stackoverflowMax
 * @param {number} input.googleScore — already 0–100 from pytrends
 * @param {object} [input.sourcesAvailable] — flags { job, github, stackoverflow, google }
 * @param {number} [input.previousTrendScore] — last persisted trendScore (for direction)
 */
function scoreSkill(input) {
    const {
        jobCountCurrent = 0,
        jobCountPrevious = 0,
        githubCount = 0,
        githubMax = 0,
        stackoverflowCount = 0,
        stackoverflowMax = 0,
        googleScore = 0,
        sourcesAvailable = { job: true, github: true, stackoverflow: true, google: true },
        previousTrendScore = null
    } = input;

    const flags = {
        job: !!sourcesAvailable.job,
        github: !!sourcesAvailable.github && githubMax > 0,
        stackoverflow: !!sourcesAvailable.stackoverflow && stackoverflowMax > 0,
        google: !!sourcesAvailable.google
    };

    // For the very first run (no previousTrendScore in the system) we still
    // want a meaningful score, so fall back to job *snapshot* if we have no
    // previous job count.
    const jobGrowth = jobCountPrevious > 0
        ? growthFromPercent(percentDelta(jobCountCurrent, jobCountPrevious))
        : normalizeAgainstMax(jobCountCurrent, Math.max(jobCountCurrent, 1));

    const githubGrowth = normalizeAgainstMax(githubCount, githubMax);
    const stackoverflowGrowth = normalizeAgainstMax(stackoverflowCount, stackoverflowMax);
    const googleGrowth = clamp(googleScore);

    const w = activeWeights(flags);
    const trendScore = clamp(
        jobGrowth * w.job +
        githubGrowth * w.github +
        stackoverflowGrowth * w.stackoverflow +
        googleGrowth * w.google
    );

    // direction + percentChange are computed against the previous trendScore
    // when available, otherwise against the previous job count snapshot.
    let percentChange;
    if (previousTrendScore !== null && previousTrendScore !== undefined) {
        percentChange = percentDelta(trendScore, previousTrendScore);
    } else {
        percentChange = percentDelta(jobCountCurrent, jobCountPrevious);
    }

    let direction = 'STABLE';
    if (percentChange > STABLE_DELTA) direction = 'UP';
    else if (percentChange < -STABLE_DELTA) direction = 'DOWN';

    return {
        trendScore: Number(trendScore.toFixed(2)),
        direction,
        percentChange: Number(percentChange.toFixed(2)),
        components: {
            job: Number(jobGrowth.toFixed(2)),
            github: Number(githubGrowth.toFixed(2)),
            stackoverflow: Number(stackoverflowGrowth.toFixed(2)),
            google: Number(googleGrowth.toFixed(2))
        },
        weightsApplied: w
    };
}

module.exports = {
    scoreSkill,
    BASE_WEIGHTS,
    STABLE_DELTA,
    // exported for unit tests / debugging
    _internal: { clamp, percentDelta, growthFromPercent, normalizeAgainstMax, activeWeights }
};
