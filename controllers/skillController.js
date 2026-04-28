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
const getRecommendedSkills = async (req, res, next) => {
    try {
        const { skill } = req.params;
        const normalizedSkill = escapeRegex((skill || '').trim());
        const foundSkill = await Skill.findOne({ name: new RegExp(`^${normalizedSkill}$`, 'i') });
        if (!foundSkill) {
            return res.status(404).json({ success: false, message: 'Skill not found' });
        }
        const recommendedNames = (foundSkill.recommended || [])
            .map(name => (name || '').trim())
            .filter(Boolean);
        const recommendedSkills = await Skill.find({
            name: { $in: recommendedNames.map(name => new RegExp(`^${escapeRegex(name)}$`, 'i')) }
        });
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
const createSkill = async (req, res, next) => {
    try {
        const skill = await Skill.create(req.body);
        res.status(201).json({ success: true, data: skill });
    } catch (err) {
        next(err);
    }
};
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
