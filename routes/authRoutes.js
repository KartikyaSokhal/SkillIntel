/**
 * ═══════════════════════════════════════════════════════════════
 * Authentication Routes — SkillIntel
 * ═══════════════════════════════════════════════════════════════
 *
 * Route Purposes:
 *   POST /api/auth/register  → Create a new user account
 *   POST /api/auth/login     → Authenticate and receive JWT + session
 *   POST /api/auth/logout    → Destroy session and clear cookies
 *   GET  /api/auth/profile   → Get current user info (JWT-protected)
 * ═══════════════════════════════════════════════════════════════
 */

const express = require('express');
const router = express.Router();
const { register, login, logout, getProfile } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes — no authentication required
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// Protected route — requires valid JWT in Authorization header
// authMiddleware runs FIRST, verifies token, then getProfile runs
router.get('/profile', authMiddleware, getProfile);

module.exports = router;
