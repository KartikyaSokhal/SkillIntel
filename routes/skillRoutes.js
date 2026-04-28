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
