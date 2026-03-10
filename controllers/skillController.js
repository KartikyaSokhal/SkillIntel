const { readSkills, findSkillByName } = require('../utils/fileHandler');


const getAllSkills = (req, res, next) => {
    try {
        const skills = readSkills();
        res.json({ success: true, count: skills.length, data: skills });
    } catch (err) {
        next(err);
    }
};


const getSkillByName = (req, res, next) => {
    try {
        const { name } = req.params;
        const skill = findSkillByName(name);
        if (!skill) {
            return res.status(404).json({ error: 'Skill not found' });
        }
        res.json({ success: true, data: skill });
    } catch (err) {
        next(err);
    }
};


const getTrendingSkills = (req, res, next) => {
    try {
        const skills = readSkills();
        const trending = [...skills].sort((a, b) => b.growth - a.growth);
        res.json({ success: true, count: trending.length, data: trending });
    } catch (err) {
        next(err);
    }
};


const getRecommendedSkills = (req, res, next) => {
    try {
        const { skill } = req.params;
        const foundSkill = findSkillByName(skill);
        if (!foundSkill) {
            return res.status(404).json({ error: 'Skill not found' });
        }
        const allSkills = readSkills();
       
        const recommended = foundSkill.recommended.map(recName => {
            const match = allSkills.find(s => s.name.toLowerCase() === recName.toLowerCase());
            return match || { name: recName };
        });
        res.json({ success: true, basedOn: foundSkill.name, data: recommended });
    } catch (err) {
        next(err);
    }
};


const compareSkills = (req, res, next) => {
    try {
        const { skills: skillsQuery } = req.query;
        if (!skillsQuery) {
            return res.status(400).json({ error: 'Please provide skills query parameter (e.g. ?skills=react,angular)' });
        }
        const skillNames = skillsQuery.split(',').map(s => s.trim());
        const results = skillNames.map(name => {
            const skill = findSkillByName(name);
            if (!skill) return { name, error: 'Skill not found' };
            return skill;
        });
        res.json({ success: true, comparing: skillNames, data: results });
    } catch (err) {
        next(err);
    }
};

module.exports = { getAllSkills, getSkillByName, getTrendingSkills, getRecommendedSkills, compareSkills };
