/**
 * ═══════════════════════════════════════════════════════════════
 * Skill Model — SkillIntel
 * ═══════════════════════════════════════════════════════════════
 *
 * This Mongoose model represents a single skill tracked by the
 * market intelligence engine. Each document stores market metrics,
 * career relevance data, and regional demand signals.
 *
 * INDEX: An index on `name` is created for fast case-insensitive
 * lookups — this avoids full collection scans on name queries.
 * ═══════════════════════════════════════════════════════════════
 */

const mongoose = require('mongoose');

/**
 * Sub-schema for regional demand entries.
 * Each entry maps a city/region to its demand level.
 * _id is disabled because these are embedded sub-documents.
 */
const regionalDemandSchema = new mongoose.Schema({
    /** City or region name, e.g. "Bangalore, Karnataka" */
    city: String,
    /** Demand level: "Critical", "High", "Rising", etc. */
    level: String
}, { _id: false });

const skillSchema = new mongoose.Schema({
    /** Skill name — unique identifier, e.g. "Python", "React" */
    name: {
        type: String,
        required: [true, 'Skill name is required'],
        unique: true,
        trim: true
    },

    /** Broad category: "Frontend", "Backend", "DevOps", "AI & Data", etc. */
    category: {
        type: String,
        required: [true, 'Category is required']
    },

    /** Emoji icon for UI display */
    icon: { type: String },

    /**
     * Demand Index (0–10 scale)
     * Represents current market demand based on job postings,
     * recruiter activity, and company requirements.
     */
    demandIndex: { type: Number, min: 0, max: 10 },

    /**
     * Average salary in INR (raw number, e.g. 1500000 = ₹15 LPA)
     * Stored as Number for sorting and comparison operations.
     */
    salary: { type: Number },

    /**
     * Year-over-year growth percentage.
     * Positive = growing demand, negative = declining.
     * e.g. 22 means 22% growth in job postings over last year.
     */
    growth: { type: Number },

    /**
     * Experience barrier to entry:
     * "Low" — easy for beginners
     * "Moderate" / "Medium" — needs some background
     * "High" — requires significant experience
     */
    experienceBarrier: { type: String },

    /**
     * Market saturation risk level:
     * "Low", "Stable", "Elevated", "Niche Fast-Growth", etc.
     * Indicates how competitive the job market is for this skill.
     */
    saturationRisk: { type: String },

    /** Short description of the skill */
    description: { type: String },

    /** Tags for filtering, e.g. ["Trending", "AI/ML Leader"] */
    tags: [{ type: String }],

    /**
     * Recommended companion skills to learn alongside.
     * Stored as an array of skill name strings.
     */
    recommended: [{ type: String }],

    /**
     * Career paths that this skill enables.
     * e.g. ["Data Science", "Backend Engineering", "AI & Machine Learning"]
     */
    careerPaths: [{ type: String }],

    /**
     * Regional demand breakdown — array of city-level demand data.
     * Helps users understand geographic job markets.
     */
    regionalDemand: [regionalDemandSchema],

    /** Timestamp of last data update */
    lastUpdated: {
        type: Date,
        default: Date.now
    },

    // ─── Real-time Trend Engine fields (additive, populated by trendsPipeline) ───
    // Latest unified trend score (0–100) computed from jobs + GitHub + StackOverflow
    // + Google Trends. Optional — older docs simply lack these and the controller
    // gracefully falls back to `growth` when sorting.
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

/**
 * INDEX on `name` field
 * ─────────────────────
 * The `unique: true` on the name field above automatically creates an index.
 * Indexes speed up queries that filter or sort by the indexed field.
 * Without an index, MongoDB performs a collection scan (reads every document).
 * With an index, it can jump directly to matching documents — O(log n) vs O(n).
 *
 * NOTE: We do NOT need skillSchema.index({ name: 1 }) separately because
 * unique: true already creates an index. Adding both causes a warning.
 */

module.exports = mongoose.model('Skill', skillSchema);
