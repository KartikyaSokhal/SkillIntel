const express = require('express');
const router = express.Router();

const {
    getAllSkills,
    getSkillByName,
    getTrendingSkills,
    getRecommendedSkills,
    compareSkills,
    createSkill,
    refreshTrends
} = require('../controllers/skillController');

const authMiddleware = require('../middleware/authMiddleware');

// Public routes
router.get('/skills', getAllSkills);
router.get('/skills/:name', getSkillByName);
router.get('/trending', getTrendingSkills);
router.get('/recommended', authMiddleware, getRecommendedSkills);
router.post('/compare', compareSkills);

// Admin / protected
router.post('/skills', authMiddleware, createSkill);
router.post('/refresh-trends', authMiddleware, refreshTrends);

module.exports = router;