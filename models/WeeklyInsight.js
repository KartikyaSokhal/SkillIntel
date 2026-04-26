const mongoose = require('mongoose');

const weeklyInsightSchema = new mongoose.Schema({
    weekStartDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    topSkills: [{
        type: String
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('WeeklyInsight', weeklyInsightSchema);
