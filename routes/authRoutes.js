/**
 * ═══════════════════════════════════════════════════════════════
 * Authentication Routes — SkillIntel
 * ═══════════════════════════════════════════════════════════════
 *
 * Route Purposes:
 *   POST /api/auth/register             → Create a new user account
 *   POST /api/auth/login                → Authenticate and receive JWT + session
 *   POST /api/auth/logout               → Destroy session and clear cookies
 *   GET  /api/auth/profile              → Get current user profile (JWT-protected)
 *   PUT  /api/auth/profile              → Update current user profile (JWT-protected)
 *   POST /api/auth/profile              → Create/update profile (returns 201 on first save)
 *   POST /api/auth/profile/resume       → Upload resume binary (multipart, JWT-protected)
 *   GET  /api/auth/profile/resume       → Download resume binary (JWT-protected)
 * ═══════════════════════════════════════════════════════════════
 */

const express = require('express');
const multer = require('multer');
const router = express.Router();
const {
    register,
    login,
    logout,
    getProfile,
    updateProfile,
    createOrUpdateProfile,
    uploadResume,
    downloadResume
} = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Resume upload limits — 5 MB cap, PDF/DOC/DOCX only.
const RESUME_MIME_ALLOW = new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]);

const resumeUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (RESUME_MIME_ALLOW.has(file.mimetype)) return cb(null, true);
        return cb(new Error('Only PDF, DOC, or DOCX resumes are accepted.'));
    }
});

// Public routes — no authentication required
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// Protected routes — require valid JWT in Authorization header
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);
router.post('/profile', authMiddleware, createOrUpdateProfile);

router.post(
    '/profile/resume',
    authMiddleware,
    (req, res, next) => {
        // Wrap multer to surface validation errors as JSON instead of HTML.
        resumeUpload.single('resume')(req, res, (err) => {
            if (!err) return next();
            const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
            return res.status(status).json({ success: false, message: err.message });
        });
    },
    uploadResume
);
router.get('/profile/resume', authMiddleware, downloadResume);

module.exports = router;
