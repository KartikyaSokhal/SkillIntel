const Skill = require('../models/Skill');
const renderDashboard = async (req, res, next) => {
    try {
        const skills = await Skill.find().sort({ demandIndex: -1 });
        res.render('dashboard', {
            title: 'SkillIntel Dashboard',
            skills,
            user: req.session.user || null,
            lastUpdated: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
        });
    } catch (err) {
        next(err);
    }
};
const renderLogin = (req, res) => {
    const error = req.query.error || null;
    res.render('login', { title: 'Login — SkillIntel', error });
};
module.exports = { renderDashboard, renderLogin };
