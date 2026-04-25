/**
 * ═══════════════════════════════════════════════════════════════
 * Skill Controller — SkillIntel
 * ═══════════════════════════════════════════════════════════════
 *
 * Handles all CRUD and query operations for the Skills collection.
 * All data is fetched from MongoDB using Mongoose (async/await).
 *
 * ─────────────────────────────────────────────────────────────
 * BLOCKING vs NON-BLOCKING — Why This Matters in Node.js
 * ─────────────────────────────────────────────────────────────
 *
 * BLOCKING (synchronous — freezes the entire thread):
 *   const data = fs.readFileSync('skills.json');
 *   // While this reads the file, NO other requests can be processed.
 *   // If 100 users hit the server, they ALL wait for this one read.
 *
 * NON-BLOCKING (asynchronous — does not block the event loop):
 *   const data = await Skill.find({});
 *   // While MongoDB is querying, Node.js can process OTHER requests.
 *   // The event loop remains free to accept new connections.
 *
 * WHY THIS MATTERS:
 *   Node.js runs on a SINGLE THREAD with an EVENT LOOP.
 *   If you use blocking/synchronous code, you freeze that one thread
 *   and the entire server stops responding until the operation completes.
 *   Async/await with Mongoose uses non-blocking I/O, allowing the
 *   event loop to handle thousands of concurrent requests efficiently.
 *
 * RULE: NEVER use fs.readFileSync() in production route handlers.
 *       Always use async/await or callbacks for I/O operations.
 * ═══════════════════════════════════════════════════════════════
 */

const Skill = require('../models/Skill');

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * GET ALL SKILLS
 * Route: GET /api/skills
 * Returns all skills from MongoDB
 */
const getAllSkills = async (req, res, next) => {
    try {
        const skills = await Skill.find();
        res.json({ success: true, count: skills.length, data: skills });
    } catch (err) {
        next(err);
    }
};

/**
 * GET SKILL BY NAME
 * Route: GET /api/skills/:name
 * Case-insensitive search using RegExp
 */
const getSkillByName = async (req, res, next) => {
    try {
        const { name } = req.params;
        // RegExp with ^ and $ ensures exact match, 'i' flag = case-insensitive
        const normalizedName = escapeRegex((name || '').trim());
        const skill = await Skill.findOne({ name: new RegExp(`^${normalizedName}$`, 'i') });

        if (!skill) {
            return res.status(404).json({ success: false, message: 'Skill not found' });
        }
        res.json({ success: true, data: skill });
    } catch (err) {
        next(err);
    }
};

/**
 * GET TRENDING SKILLS
 * Route: GET /api/trending
 *
 * Sorts by the unified `trendScore` (populated by trendsPipeline) and falls
 * back to legacy `growth` for skills that haven't been scored yet. The
 * response is additive: the original Skill fields are preserved AND the new
 * trend fields (trendScore, direction, percentChange, ...) are included
 * when available.
 */
const getTrendingSkills = async (req, res, next) => {
    try {
        const limit = Math.min(parseInt(req.query.limit, 10) || 0, 100);
        const cursor = Skill.find().sort({ trendScore: -1, growth: -1, demandIndex: -1 });
        if (limit > 0) cursor.limit(limit);
        const trending = await cursor;
        res.json({ success: true, count: trending.length, data: trending });
    } catch (err) {
        next(err);
    }
};

/**
 * GET RECOMMENDED SKILLS
 * Route: GET /api/recommended/:skill
 * Finds a skill, then looks up its recommended companions
 */
const getRecommendedSkills = async (req, res, next) => {
    try {
        const { skill } = req.params;
        const normalizedSkill = escapeRegex((skill || '').trim());
        const foundSkill = await Skill.findOne({ name: new RegExp(`^${normalizedSkill}$`, 'i') });

        if (!foundSkill) {
            return res.status(404).json({ success: false, message: 'Skill not found' });
        }

        // Find recommended skills that exist in the database
        const recommendedNames = (foundSkill.recommended || [])
            .map(name => (name || '').trim())
            .filter(Boolean);

        const recommendedSkills = await Skill.find({
            name: { $in: recommendedNames.map(name => new RegExp(`^${escapeRegex(name)}$`, 'i')) }
        });

        // Map results, marking skills not found in DB
        const result = recommendedNames.map(recName => {
            const match = recommendedSkills.find(
                s => s.name.toLowerCase() === recName.toLowerCase()
            );
            return match || { name: recName, inDatabase: false };
        });

        res.json({ success: true, basedOn: foundSkill.name, data: result });
    } catch (err) {
        next(err);
    }
};

/**
 * COMPARE SKILLS
 * Route: GET /api/compare?skills=Python,React
 * Accepts comma-separated skill names via query string
 */
const compareSkills = async (req, res, next) => {
    try {
        const { skills: skillsQuery } = req.query;
        if (!skillsQuery) {
            return res.status(400).json({
                success: false,
                message: 'Please provide skills query parameter (e.g. ?skills=react,angular)'
            });
        }

        const skillNames = skillsQuery
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);

        if (!skillNames.length) {
            return res.status(400).json({
                success: false,
                message: 'Please provide at least one valid skill name'
            });
        }

        const regexNames = skillNames.map(name => new RegExp(`^${escapeRegex(name)}$`, 'i'));

        const foundSkills = await Skill.find({ name: { $in: regexNames } });

        const results = skillNames.map(name => {
            const match = foundSkills.find(s => s.name.toLowerCase() === name.toLowerCase());
            if (!match) return { name, error: 'Skill not found' };
            return match;
        });

        res.json({ success: true, comparing: skillNames, data: results });
    } catch (err) {
        next(err);
    }
};

/**
 * CREATE SKILL (Protected — requires JWT)
 * Route: POST /api/skills
 * Adds a new skill to the database
 */
const createSkill = async (req, res, next) => {
    try {
        const skill = await Skill.create(req.body);
        res.status(201).json({ success: true, data: skill });
    } catch (err) {
        next(err);
    }
};

/**
 * REFRESH TRENDS (Protected — requires JWT, admin role)
 * Route: POST /api/admin/trends/refresh
 *
 * Triggers an on-demand run of the trends pipeline. Useful for QA and
 * for ops to bootstrap the skill_trends collection without waiting for
 * the next 6-hour cron tick. Runs in a fire-and-forget manner so the
 * HTTP request returns immediately.
 */
const refreshTrends = async (req, res, next) => {
    try {
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Admin role required' });
        }
        const { runTrendsPipeline, getStatus } = require('../services/trendsPipeline');
        const status = getStatus();
        if (status.isRunning) {
            return res.json({ success: true, status: 'already-running', ...status });
        }
        runTrendsPipeline().catch((err) => {
            console.error('[refreshTrends] background run failed:', err.message);
        });
        res.status(202).json({ success: true, status: 'started', startedAt: new Date() });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getAllSkills,
    getSkillByName,
    getTrendingSkills,
    getRecommendedSkills,
    compareSkills,
    createSkill,
    refreshTrends
};
