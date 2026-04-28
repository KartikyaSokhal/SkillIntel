const BASE_WEIGHTS = {
    job: 0.5,
    github: 0.2,
    stackoverflow: 0.2,
    google: 0.1
};
const STABLE_DELTA = 5; 
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
function growthFromPercent(pct) {
    return clamp(50 + pct / 2);
}
function normalizeAgainstMax(value, max) {
    if (!max || max <= 0) return 0;
    return clamp((value / max) * 100);
}
function activeWeights(activeFlags) {
    const total = Object.entries(BASE_WEIGHTS).reduce((sum, [k, w]) => sum + (activeFlags[k] ? w : 0), 0);
    if (total === 0) return { ...BASE_WEIGHTS };
    const out = {};
    for (const [k, w] of Object.entries(BASE_WEIGHTS)) {
        out[k] = activeFlags[k] ? w / total : 0;
    }
    return out;
}
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
    _internal: { clamp, percentDelta, growthFromPercent, normalizeAgainstMax, activeWeights }
};
