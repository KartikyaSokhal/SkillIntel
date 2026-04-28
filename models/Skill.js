const mongoose = require('mongoose');
const regionalDemandSchema = new mongoose.Schema({
        city: String,
        level: String
}, { _id: false });
const skillSchema = new mongoose.Schema({
        name: {
        type: String,
        required: [true, 'Skill name is required'],
        unique: true,
        trim: true
    },
        category: {
        type: String,
        required: [true, 'Category is required']
    },
        icon: { type: String },
        demandIndex: { type: Number, min: 0, max: 10 },
        salary: { type: Number },
        growth: { type: Number },
        experienceBarrier: { type: String },
        saturationRisk: { type: String },
        description: { type: String },
        tags: [{ type: String }],
        recommended: [{ type: String }],
        careerPaths: [{ type: String }],
        regionalDemand: [regionalDemandSchema],
        lastUpdated: {
        type: Date,
        default: Date.now
    },
    trendScore: { type: Number },
    direction: { type: String, enum: ['UP', 'DOWN', 'STABLE', null], default: null },
    percentChange: { type: Number },
    jobCountCurrent: { type: Number },
    jobCountPrevious: { type: Number },
    githubScore: { type: Number },
    stackoverflowScore: { type: Number },
    googleTrendScore: { type: Number },
    lastTrendComputedAt: { type: Date }
}, { timestamps: true });
module.exports = mongoose.model('Skill', skillSchema);
