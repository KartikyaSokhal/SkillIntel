const express = require('express');
const router = express.Router();
const WeeklyInsight = require('../models/WeeklyInsight');
const { generateWeeklyInsights } = require('../jobs/weeklyInsightsJob');

// GET /api/insights/latest
router.get('/latest', async (req, res, next) => {
    try {
        const latest = await WeeklyInsight.findOne().sort({ createdAt: -1 });
        if (!latest) {
            return res.json({ success: true, data: null });
        }
        res.json({ success: true, data: latest });
    } catch (err) {
        next(err);
    }
});

// Admin override to trigger immediately for testing
router.post('/generate', async (req, res, next) => {
    try {
        const insight = await generateWeeklyInsights();
        res.json({ success: true, message: 'Insight generated', data: insight });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
