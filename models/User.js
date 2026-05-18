const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const regionalDemandSchema = new mongoose.Schema({
    city: String,
    level: String
}, { _id: false });

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters']
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },

    profile: {
        status: {
            type: String,
            enum: ['Student', 'Working Professional'],
            default: 'Student'
        },
        currentRole: { type: String, default: '' },
        salary: { type: Number, default: null },
        intent: { type: String, default: '' },

        skills: {
            type: [String],
            default: []
        },

        // ─── v2 fields ───────────────────────────────
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

        //////////////////////////////////////////////////////
        // 🔥 UPDATED RESUME SCHEMA WITH SCORING
        //////////////////////////////////////////////////////
        resume: {
            fileName: { type: String, default: '' },
            mimeType: { type: String, default: '' },
            fileData: { type: Buffer, default: null },
            sizeBytes: { type: Number, default: 0 },
            uploadedAt: { type: Date, default: null },

            // 🔥 NEW FIELDS (SCORING SYSTEM)
            score: { type: Number, default: 0 },                 // ATS Score
            foundSkills: { type: [String], default: [] },        // detected skills
            missingSkills: { type: [String], default: [] },      // gaps

            // optional but powerful
            extractedTextPreview: { type: String, default: '' }  // first 500 chars
        }
    },

    createdAt: {
        type: Date,
        default: Date.now
    }

}, { timestamps: true });

//////////////////////////////////////////////////////
// PASSWORD HASHING
//////////////////////////////////////////////////////

userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

//////////////////////////////////////////////////////
// FIX: PREVENT OVERWRITE MODEL ERROR
//////////////////////////////////////////////////////

module.exports = mongoose.models.User || mongoose.model('User', userSchema);