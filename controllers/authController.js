/**
 * ═══════════════════════════════════════════════════════════════
 * Authentication Controller — SkillIntel
 * ═══════════════════════════════════════════════════════════════
 *
 * Handles user registration, login, logout, and profile retrieval.
 * Demonstrates:
 *   - Password hashing with bcryptjs (via User model pre-save hook)
 *   - JWT token generation for stateless API auth
 *   - Session management for SSR page auth
 *   - Cookie setting for persistent client-side state
 *   - Input validation and secure error messages
 * ═══════════════════════════════════════════════════════════════
 */

const User = require('../models/User');
const Skill = require('../models/Skill');
const jwt = require('jsonwebtoken');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

/**
 * REGISTER — Create a new user account
 * Route: POST /api/auth/register
 *
 * Flow:
 *   1. Validate all required fields from req.body
 *   2. Check for duplicate email (409 Conflict)
 *   3. Create User document (bcrypt hook hashes password automatically)
 *   4. Return user data WITHOUT the password field
 */
const register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        // ── Input validation ──────────────────────────────────
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required: name, email, password'
            });
        }

        // Basic email format check
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }

        // ── Check for existing user ───────────────────────────
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'An account with this email already exists'
            });
        }

        // ── Create new user ──────────────────────────────────
        // The password is automatically hashed by the User model's
        // pre-save hook before being stored in MongoDB
        const user = await User.create({ name, email, password });

        // Return user data — NEVER include the password in responses
        res.status(201).json({
            success: true,
            message: 'Account created successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (err) {
        next(err);
    }
};

/**
 * LOGIN — Authenticate user and issue JWT + session
 * Route: POST /api/auth/login
 *
 * Flow:
 *   1. Find user by email
 *   2. Verify password using bcrypt comparison
 *   3. Generate JWT token (stateless auth for API)
 *   4. Store user in session (stateful auth for SSR pages)
 *   5. Set a cookie for persistent client state
 *
 * SECURITY: Error messages are intentionally generic —
 *   we say "Invalid credentials" instead of "Email not found"
 *   to prevent user enumeration attacks.
 */
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // ── Find user by email ────────────────────────────────
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // ── Verify password ──────────────────────────────────
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // ── Generate JWT token ────────────────────────────────
        // Payload contains user info that can be decoded on future requests
        // Expiry is set to 7 days — after that, user must re-login
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // ── Store user in session (for SSR dashboard) ─────────
        req.session.user = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        };

        // ── Set a cookie for client-side user display ─────────
        // httpOnly: true means JavaScript cannot read this cookie
        // (protection against XSS attacks)
        res.cookie('skillintel_user', user.name, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
        });

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        next(err);
    }
};

/**
 * LOGOUT — Destroy session and clear cookie
 * Route: POST /api/auth/logout
 */
const logout = (req, res, next) => {
    try {
        // Destroy the server-side session
        req.session.destroy((err) => {
            if (err) return next(err);

            // Clear the cookie from the client
            res.clearCookie('skillintel_user');
            res.clearCookie('connect.sid'); // express-session cookie

            res.json({
                success: true,
                message: 'Logged out successfully'
            });
        });
    } catch (err) {
        next(err);
    }
};

/**
 * GET PROFILE — Return decoded JWT user data
 * Route: GET /api/auth/profile
 *
 * This demonstrates a JWT-PROTECTED ROUTE.
 * The authMiddleware.js verifies the token and attaches
 * the decoded payload to req.user before this handler runs.
 * So req.user is guaranteed to contain valid user data here.
 */
const getProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('name email role profile');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user
        });
    } catch (err) {
        next(err);
    }
};

const VALID_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
const LEVEL_FALLBACK_SCORE = { Beginner: 25, Intermediate: 55, Advanced: 80, Expert: 95 };
const DEFAULT_JOB_KEYWORDS = [
    'api', 'microservices', 'cloud', 'scalable', 'distributed',
    'testing', 'ci/cd', 'docker', 'kubernetes', 'security', 'performance'
];

function normalizeToken(value = '') {
    return String(value).toLowerCase().replace(/[^a-z0-9.+#/-]/g, ' ').trim();
}

async function extractResumeText(file) {
    const mime = file?.mimetype || '';
    if (mime === 'application/pdf') {
        const parsed = await pdfParse(file.buffer);
        return { text: parsed?.text || '', parserStatus: 'pdf_ok' };
    }
    if (mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const parsed = await mammoth.extractRawText({ buffer: file.buffer });
        return { text: parsed?.value || '', parserStatus: 'docx_ok' };
    }
    if (mime === 'application/msword') {
        // DOC parsing is intentionally marked unsupported for now.
        return { text: '', parserStatus: 'doc_not_supported' };
    }
    return { text: '', parserStatus: 'unsupported_type' };
}

function buildAtsAnalysis(text, trendingSkills = []) {
    const corpus = normalizeToken(text);
    const trendNames = Array.from(new Set(
        trendingSkills.map((s) => String(s?.name || '').trim()).filter(Boolean)
    ));

    const matchedSkills = trendNames.filter((name) => {
        const token = normalizeToken(name);
        return token && corpus.includes(token);
    });

    const missingSkills = trendNames.filter((name) => !matchedSkills.includes(name)).slice(0, 10);
    const matchedJobKeywords = DEFAULT_JOB_KEYWORDS.filter((kw) => corpus.includes(normalizeToken(kw)));

    const keywordPool = trendNames.length + DEFAULT_JOB_KEYWORDS.length;
    const keywordHits = matchedSkills.length + matchedJobKeywords.length;
    const relevanceScore = trendNames.length ? Math.round((matchedSkills.length / trendNames.length) * 100) : 0;
    const keywordMatchScore = keywordPool ? Math.round((keywordHits / keywordPool) * 100) : 0;
    const atsScore = Math.max(0, Math.min(100, Math.round(keywordMatchScore * 0.7 + relevanceScore * 0.3)));

    const suggestions = [];
    missingSkills.slice(0, 4).forEach((skill) => suggestions.push(`Add ${skill}`));
    if (matchedJobKeywords.length < 3) suggestions.push('Improve keyword usage for job descriptions');
    if (!suggestions.length) suggestions.push('Great baseline. Add project-based impact bullets for stronger ATS relevance.');

    return {
        atsScore,
        matchedKeywords: [...matchedSkills, ...matchedJobKeywords].slice(0, 20),
        missingSkills,
        suggestions
    };
}

/**
 * Strips heavy resume binary data from a profile object before sending it
 * over the wire. The dashboard only needs filename / mimetype / uploadedAt;
 * the bytes are streamed via GET /api/auth/profile/resume on demand.
 */
function profileForClient(user) {
    const profile = (user.profile && user.profile.toObject) ? user.profile.toObject() : { ...(user.profile || {}) };
    if (profile.resume) {
        const { fileData, ...resumeMeta } = profile.resume;
        profile.resume = { ...resumeMeta, hasFile: !!fileData };
    }
    if (!profile.resumeAnalysis) {
        profile.resumeAnalysis = {
            atsScore: 0,
            matchedKeywords: [],
            missingSkills: [],
            suggestions: [],
            updatedAt: null,
            parserStatus: 'not_run'
        };
    }
    return profile;
}

/**
 * Pure helper used by both PUT and POST /profile so the two endpoints
 * stay byte-for-byte consistent.
 */
function applyProfileUpdate(user, body) {
    const {
        name,
        status,
        currentRole,
        salary,
        intent,
        skills,
        resumeFileName,
        // v2 fields
        location,
        organization,
        bio,
        headline,
        avatarUrl,
        interestsTechnical,
        interestsStrategic,
        skillsDetailed
    } = body || {};

    if (typeof name === 'string' && name.trim()) {
        user.name = name.trim();
    }

    if (status === 'Student' || status === 'Working Professional') {
        user.profile.status = status;
    }

    if (typeof currentRole === 'string') user.profile.currentRole = currentRole.trim();
    if (typeof intent === 'string') user.profile.intent = intent.trim();
    if (typeof location === 'string') user.profile.location = location.trim();
    if (typeof organization === 'string') user.profile.organization = organization.trim();
    if (typeof bio === 'string') user.profile.bio = bio.slice(0, 1000);
    if (typeof headline === 'string') user.profile.headline = headline.trim();
    if (typeof avatarUrl === 'string') user.profile.avatarUrl = avatarUrl.trim();

    if (salary === '' || salary === null || salary === undefined) {
        user.profile.salary = null;
    } else {
        const parsedSalary = Number(salary);
        user.profile.salary = Number.isFinite(parsedSalary) ? parsedSalary : null;
    }

    if (Array.isArray(skills)) {
        user.profile.skills = skills.map((s) => String(s || '').trim()).filter(Boolean);
    }

    if (Array.isArray(interestsTechnical)) {
        user.profile.interestsTechnical = interestsTechnical
            .map((s) => String(s || '').trim()).filter(Boolean).slice(0, 30);
    }
    if (Array.isArray(interestsStrategic)) {
        user.profile.interestsStrategic = interestsStrategic
            .map((s) => String(s || '').trim()).filter(Boolean).slice(0, 30);
    }

    if (Array.isArray(skillsDetailed)) {
        user.profile.skillsDetailed = skillsDetailed
            .map((row) => {
                if (!row || typeof row.name !== 'string' || !row.name.trim()) return null;
                const level = VALID_LEVELS.includes(row.level) ? row.level : 'Intermediate';
                let score = Number(row.score);
                if (!Number.isFinite(score)) score = LEVEL_FALLBACK_SCORE[level];
                score = Math.max(0, Math.min(100, score));
                return { name: row.name.trim(), level, score };
            })
            .filter(Boolean)
            .slice(0, 50);
    }

    if (typeof resumeFileName === 'string' && resumeFileName.trim()) {
        user.profile.resume.fileName = resumeFileName.trim();
        if (!user.profile.resume.uploadedAt) {
            user.profile.resume.uploadedAt = new Date();
        }
    }
}

const getProfileV2 = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                profile: profileForClient(user),
                createdAt: user.createdAt
            }
        });
    } catch (err) {
        next(err);
    }
};

const updateProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        applyProfileUpdate(user, req.body);
        await user.save();

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                profile: profileForClient(user)
            }
        });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/auth/profile — upsert-style. First-time savers get 201; existing
 * users get 200. The body shape is identical to PUT /api/auth/profile.
 */
const createOrUpdateProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const isFirstTime = !(user.profile && (user.profile.bio || user.profile.location || user.profile.headline));
        applyProfileUpdate(user, req.body);
        await user.save();

        res.status(isFirstTime ? 201 : 200).json({
            success: true,
            message: isFirstTime ? 'Profile created' : 'Profile updated',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                profile: profileForClient(user)
            }
        });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/auth/profile/resume — multipart upload, multer middleware
 * places the file on req.file. We persist it inline as a Buffer so it
 * shows up under the user document in MongoDB Compass.
 */
const uploadResume = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded (field name: "resume")' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.profile.resume = {
            fileName: req.file.originalname,
            mimeType: req.file.mimetype,
            fileData: req.file.buffer,
            sizeBytes: req.file.size,
            uploadedAt: new Date()
        };

        try {
            const topTrending = await Skill.find()
                .sort({ trendScore: -1, growth: -1, demandIndex: -1 })
                .limit(20)
                .select('name');
            const parsed = await extractResumeText(req.file);
            const analysis = buildAtsAnalysis(parsed.text, topTrending);
            user.profile.resumeAnalysis = {
                ...analysis,
                updatedAt: new Date(),
                parserStatus: parsed.parserStatus
            };
        } catch (parseErr) {
            user.profile.resumeAnalysis = {
                atsScore: 0,
                matchedKeywords: [],
                missingSkills: [],
                suggestions: ['Resume parsed with errors. Try uploading a clean PDF or DOCX file.'],
                updatedAt: new Date(),
                parserStatus: 'parse_error'
            };
        }

        await user.save();

        res.status(201).json({
            success: true,
            message: 'Resume uploaded',
            resume: {
                fileName: user.profile.resume.fileName,
                mimeType: user.profile.resume.mimeType,
                sizeBytes: user.profile.resume.sizeBytes,
                uploadedAt: user.profile.resume.uploadedAt,
                hasFile: true
            },
            resumeAnalysis: user.profile.resumeAnalysis || null
        });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/auth/profile/resume — streams the stored binary back to the
 * authenticated user with the original mime type and filename.
 */
const downloadResume = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('profile.resume');
        if (!user || !user.profile || !user.profile.resume || !user.profile.resume.fileData) {
            return res.status(404).json({ success: false, message: 'No resume on file' });
        }

        const { fileName, mimeType, fileData } = user.profile.resume;
        res.set('Content-Type', mimeType || 'application/octet-stream');
        res.set('Content-Disposition', `inline; filename="${fileName || 'resume'}"`);
        res.send(fileData);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    register,
    login,
    logout,
    // The default getProfile is kept for back-compat callers, but
    // getProfileV2 returns the full profile shape (including v2 fields).
    getProfile: getProfileV2,
    updateProfile,
    createOrUpdateProfile,
    uploadResume,
    downloadResume
};
