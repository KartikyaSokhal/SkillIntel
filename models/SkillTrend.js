/**
 * ═══════════════════════════════════════════════════════════════
 * SkillTrend Model — SkillIntel
 * ═══════════════════════════════════════════════════════════════
 *
 * Historical, append-only collection that captures one snapshot per
 * skill per pipeline run. The Skill collection holds the *latest*
 * trend numbers for fast list queries; this collection holds the
 * full time-series so we can compute deltas and render history.
 *
 * INDEX strategy:
 *   - Compound (skill, timestamp desc) — fastest path for "give me
 *     the previous snapshot for skill X" lookups in the pipeline.
 *   - Standalone timestamp index for time-range queries.
 * ═══════════════════════════════════════════════════════════════
 */

const mongoose = require('mongoose');

const skillTrendSchema = new mongoose.Schema({
    skill: { type: String, required: true, trim: true },

    // Raw signals from each source. Stored alongside the score so we
    // can debug pipeline runs without re-fetching upstream APIs.
    jobCountCurrent: { type: Number, default: 0 },
    jobCountPrevious: { type: Number, default: 0 },
    githubScore: { type: Number, default: 0 },
    stackoverflowScore: { type: Number, default: 0 },
    googleTrendScore: { type: Number, default: 0 },

    // Unified score and movement vs. previous snapshot.
    trendScore: { type: Number, default: 0 },
    direction: { type: String, enum: ['UP', 'DOWN', 'STABLE'], default: 'STABLE' },
    percentChange: { type: Number, default: 0 },

    timestamp: { type: Date, default: Date.now }
}, { collection: 'skill_trends', timestamps: false });

skillTrendSchema.index({ skill: 1, timestamp: -1 });
skillTrendSchema.index({ timestamp: -1 });

module.exports = mongoose.model('SkillTrend', skillTrendSchema);
