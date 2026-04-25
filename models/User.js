/**
 * ═══════════════════════════════════════════════════════════════
 * User Model — SkillIntel
 * ═══════════════════════════════════════════════════════════════
 *
 * This Mongoose model represents a registered user of the platform.
 * It demonstrates:
 *   - Schema validation (required fields, unique constraints)
 *   - Pre-save middleware (Mongoose hook) for automatic password hashing
 *   - Instance methods for password verification
 *   - bcryptjs usage for one-way password hashing (10 salt rounds)
 *
 * SECURITY NOTE:
 *   Passwords are NEVER stored in plain text. bcryptjs generates a
 *   random salt and hashes the password before it hits the database.
 *   The comparePassword() method hashes the candidate and compares
 *   the result — the original password is never recoverable.
 * ═══════════════════════════════════════════════════════════════
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    /** Full name of the user */
    name: {
        type: String,
        required: [true, 'Name is required']
    },

    /** Email — must be unique across all users (used as login ID) */
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true
    },

    /** Hashed password — never returned in API responses */
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters']
    },

    /** Role-based access: 'user' (default) or 'admin' */
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },

    /**
     * Extended profile fields.
     *
     * Schema is additive: legacy fields (status, currentRole, salary, intent,
     * resume.{fileName,uploadedAt}, skills) are preserved verbatim so existing
     * users keep working. New v2 fields are added below for the redesigned
     * profile dashboard (location, organization, bio, headline, avatarUrl,
     * interestsTechnical, interestsStrategic, skillsDetailed, and the resume
     * binary fields fileData + mimeType).
     */
    profile: {
        // ─── Legacy fields (preserved) ──────────────────────────
        status: {
            type: String,
            enum: ['Student', 'Working Professional'],
            default: 'Student'
        },
        currentRole: {
            type: String,
            default: ''
        },
        salary: {
            type: Number,
            default: null
        },
        intent: {
            type: String,
            default: ''
        },
        skills: {
            type: [String],
            default: []
        },

        // ─── v2 fields (additive) ───────────────────────────────
        location: { type: String, default: '' },
        organization: { type: String, default: '' },
        bio: { type: String, default: '', maxlength: 1000 },
        headline: { type: String, default: '' },
        avatarUrl: { type: String, default: '' },
        interestsTechnical: { type: [String], default: [] },
        interestsStrategic: { type: [String], default: [] },
        skillsDetailed: {
            type: [{
                _id: false,
                name: { type: String, required: true, trim: true },
                level: {
                    type: String,
                    enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
                    default: 'Intermediate'
                },
                score: { type: Number, min: 0, max: 100, default: 50 }
            }],
            default: []
        },

        resume: {
            fileName: { type: String, default: '' },
            mimeType: { type: String, default: '' },
            // Stored inline as a Buffer so the document is fully self-contained
            // and visible in MongoDB Compass. Capped at 5 MB by the upload route.
            fileData: { type: Buffer, default: null },
            sizeBytes: { type: Number, default: 0 },
            uploadedAt: { type: Date, default: null }
        }
    },

    /** Account creation timestamp */
    createdAt: {
        type: Date,
        default: Date.now
    }
});

/**
 * PRE-SAVE HOOK — Mongoose Middleware (Document Middleware)
 * ─────────────────────────────────────────────────────────
 * This is a "pre" hook that runs BEFORE the document is saved to MongoDB.
 * It intercepts the save operation to hash the password automatically.
 *
 * - this.isModified('password') ensures we only re-hash when the
 *   password field has actually changed (not on every save)
 * - bcrypt.genSalt(10) creates a random salt with 10 rounds of processing
 * - bcrypt.hash() combines the salt with the password to create a hash
 *
 * WHY async without next()?
 *   Mongoose 5+ supports returning a Promise from pre hooks.
 *   If the async function resolves, Mongoose proceeds; if it rejects,
 *   the save is aborted with the error.
 */
userSchema.pre('save', async function () {
    // Only hash if the password field was modified (or is new)
    if (!this.isModified('password')) return;

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

/**
 * INSTANCE METHOD — comparePassword
 * ──────────────────────────────────
 * Compares a plain-text candidate password against the stored hash.
 * Returns true if they match, false otherwise.
 *
 * @param {string} candidatePassword - The plain-text password to verify
 * @returns {Promise<boolean>} - Whether the password matches
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
