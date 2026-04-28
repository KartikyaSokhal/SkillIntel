const mongoose = require('mongoose');
const skillTrendSchema = new mongoose.Schema({
    skill: { type: String, required: true, trim: true },
    jobCountCurrent: { type: Number, default: 0 },
    jobCountPrevious: { type: Number, default: 0 },
    githubScore: { type: Number, default: 0 },
    stackoverflowScore: { type: Number, default: 0 },
    googleTrendScore: { type: Number, default: 0 },
    trendScore: { type: Number, default: 0 },
    direction: { type: String, enum: ['UP', 'DOWN', 'STABLE'], default: 'STABLE' },
    percentChange: { type: Number, default: 0 },
    timestamp: { type: Date, default: Date.now }
}, { collection: 'skill_trends', timestamps: false });
skillTrendSchema.index({ skill: 1, timestamp: -1 });
skillTrendSchema.index({ timestamp: -1 });
module.exports = mongoose.model('SkillTrend', skillTrendSchema);
