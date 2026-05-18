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

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);
router.post('/profile', authMiddleware, createOrUpdateProfile);

router.post(
    '/profile/resume',
    authMiddleware,
    (req, res, next) => {
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