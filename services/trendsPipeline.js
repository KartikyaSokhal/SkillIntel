const Skill = require('../models/Skill');
const SkillTrend = require('../models/SkillTrend');
const fetchJobs = require('./jobFetcher');
const extractSkills = require('./skillExtractor');
const fetchGitHubTrends = require('./githubTrends');
const fetchGoogleTrends = require('./googleTrends');
const fetchStackOverflowTrends = require('./stackoverflowTrends');
const { scoreSkill } = require('./trendScorer');
const SEED_SKILLS = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Rust',
    'React', 'Node.js', 'Angular', 'Vue.js',
    'Django', 'Flask', 'Spring',
    'AWS', 'Docker', 'Kubernetes', 'Terraform',
    'PostgreSQL', 'MongoDB', 'Redis',
    'Machine Learning', 'PyTorch', 'TensorFlow', 'LangChain',
    'GraphQL', 'Kafka', 'Snowflake'
];
let isRunning = false;
let lastRunAt = null;
let lastError = null;
async function loadSkillUniverse() {
    const docs = await Skill.find({}, { name: 1 }).lean();
    if (docs && docs.length) return docs.map((d) => d.name).filter(Boolean);
    return SEED_SKILLS;
}
async function loadPreviousSnapshots(skillNames) {
    const out = Object.create(null);
    if (!skillNames.length) return out;
    const docs = await SkillTrend.aggregate([
        { $match: { skill: { $in: skillNames } } },
        { $sort: { skill: 1, timestamp: -1 } },
        {
            $group: {
                _id: '$skill',
                latest: { $first: '$$ROOT' }
            }
        }
    ]);
    for (const row of docs) {
        out[row._id] = row.latest;
    }
    return out;
}
function maxValue(map) {
    let max = 0;
    for (const v of Object.values(map)) {
        if (typeof v === 'number' && v > max) max = v;
    }
    return max;
}
async function runTrendsPipeline() {
    if (isRunning) {
        return { status: 'skipped', reason: 'already-running', lastRunAt };
    }
    isRunning = true;
    lastError = null;
    const startedAt = new Date();
    console.log("\n=== [trendsPipeline] starting @ " + startedAt.toISOString() + " ===");
    try {
        const skillNames = await loadSkillUniverse();
        console.log(`[trendsPipeline] tracking ${skillNames.length} skills.`);
        const jobs = await fetchJobs().catch((err) => {
            console.warn('[trendsPipeline] job fetch failed:', err.message);
            return [];
        });
        const jobCounts = jobs.length ? extractSkills(jobs) : {};
        console.log(`[trendsPipeline] extracted ${Object.keys(jobCounts).length} skill mentions across ${jobs.length} jobs.`);
        const [githubCounts, stackoverflowCounts, googleScores] = await Promise.all([
            fetchGitHubTrends(skillNames, { pages: 1, daysAgo: 14 }),
            fetchStackOverflowTrends(skillNames),
            fetchGoogleTrends(skillNames)
        ]);
        const sourcesAvailable = {
            job: jobs.length > 0,
            github: Object.keys(githubCounts).length > 0,
            stackoverflow: Object.keys(stackoverflowCounts).length > 0,
            google: Object.keys(googleScores).length > 0
        };
        console.log('[trendsPipeline] sources available:', sourcesAvailable);
        const githubMax = maxValue(githubCounts);
        const stackoverflowMax = maxValue(stackoverflowCounts);
        const previous = await loadPreviousSnapshots(skillNames);
        const now = new Date();
        const trendDocs = [];
        const skillBulk = [];
        for (const name of skillNames) {
            const prev = previous[name] || null;
            const jobCountCurrent = jobCounts[name] || 0;
            const jobCountPrevious = prev ? (prev.jobCountCurrent || 0) : 0;
            const githubCount = githubCounts[name] || 0;
            const stackoverflowCount = stackoverflowCounts[name] || 0;
            const googleScore = googleScores[name] || 0;
            const scored = scoreSkill({
                jobCountCurrent,
                jobCountPrevious,
                githubCount,
                githubMax,
                stackoverflowCount,
                stackoverflowMax,
                googleScore,
                sourcesAvailable,
                previousTrendScore: prev ? prev.trendScore : null
            });
            trendDocs.push({
                skill: name,
                jobCountCurrent,
                jobCountPrevious,
                githubScore: scored.components.github,
                stackoverflowScore: scored.components.stackoverflow,
                googleTrendScore: scored.components.google,
                trendScore: scored.trendScore,
                direction: scored.direction,
                percentChange: scored.percentChange,
                timestamp: now
            });
            skillBulk.push({
                updateOne: {
                    filter: { name },
                    update: {
                        $set: {
                            trendScore: scored.trendScore,
                            direction: scored.direction,
                            percentChange: scored.percentChange,
                            jobCountCurrent,
                            jobCountPrevious,
                            githubScore: scored.components.github,
                            stackoverflowScore: scored.components.stackoverflow,
                            googleTrendScore: scored.components.google,
                            lastTrendComputedAt: now
                        }
                    },
                    upsert: false
                }
            });
        }
        if (trendDocs.length) {
            await SkillTrend.insertMany(trendDocs, { ordered: false });
            console.log(`[trendsPipeline] inserted ${trendDocs.length} skill_trends docs.`);
        }
        if (skillBulk.length) {
            const bulkRes = await Skill.bulkWrite(skillBulk, { ordered: false });
            const matched = bulkRes.matchedCount || (bulkRes.result && bulkRes.result.nMatched) || 0;
            const modified = bulkRes.modifiedCount || (bulkRes.result && bulkRes.result.nModified) || 0;
            console.log(`[trendsPipeline] Skill bulk update: matched=${matched} modified=${modified}.`);
        }
        lastRunAt = new Date();
        const elapsedMs = lastRunAt.getTime() - startedAt.getTime();
        console.log("=== [trendsPipeline] done in " + elapsedMs + "ms ===\n");
        return {
            status: 'ok',
            startedAt,
            finishedAt: lastRunAt,
            elapsedMs,
            skillsScored: skillNames.length,
            sourcesAvailable
        };
    } catch (err) {
        lastError = err;
        console.error('[trendsPipeline] FAILED:', err.message);
        console.error(err.stack);
        return { status: 'error', message: err.message };
    } finally {
        isRunning = false;
    }
}
function getStatus() {
    return { isRunning, lastRunAt, lastError: lastError ? lastError.message : null };
}
module.exports = { runTrendsPipeline, getStatus };
