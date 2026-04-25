/**
 * ═══════════════════════════════════════════════════════════════
 * Skill Routes — SkillIntel
 * ═══════════════════════════════════════════════════════════════
 *
 * These routes handle all skill-related API endpoints.
 * Data is fetched from MongoDB via the Skill controller.
 *
 * ROUTE ORDER MATTERS:
 *   Static paths (/trending, /compare) must come BEFORE
 *   dynamic paths (/:name), because Express matches routes
 *   in order. If /:name comes first, "trending" would be
 *   treated as a skill name parameter.
 * ═══════════════════════════════════════════════════════════════
 */

const express = require('express');
const router = express.Router();
const {
    getAllSkills,
    getSkillByName,
    getTrendingSkills,
    getRecommendedSkills,
    compareSkills,
    createSkill,
    refreshTrends
} = require('../controllers/skillController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * ROUTER-LEVEL MIDDLEWARE
 * ───────────────────────
 * Unlike application-level middleware (registered with app.use()),
 * router-level middleware is registered with router.use() and runs
 * ONLY for routes within this specific router.
 *
 * This middleware only runs for /api/skills/* routes, not for
 * /api/auth/* or any other router. This provides scoped logging
 * without polluting logs from unrelated routes.
 */
router.use((req, res, next) => {
    console.log(`[SkillRoutes] ${req.method} ${req.originalUrl}`);
    next();
});

// ── Static routes (MUST come before /:name) ──────────────────

// GET /api/skills — list all skills
router.get('/skills', getAllSkills);

// GET /api/trending — skills sorted by growth (highest first)
router.get('/trending', getTrendingSkills);
// Backward-compatible alias used by existing frontend path
router.get('/skills/trending', getTrendingSkills);

// GET /api/compare — compare skills via query: ?skills=Python,React
router.get('/compare', compareSkills);
// Backward-compatible alias used by existing frontend path
router.get('/skills/compare', compareSkills);

// GET /api/recommended/:skill — get recommended companion skills
router.get('/recommended/:skill', getRecommendedSkills);
// Backward-compatible alias used by existing frontend path
router.get('/skills/recommended/:skill', getRecommendedSkills);

// ── Dynamic route (MUST come after static routes) ────────────

// GET /api/skills/:name — lookup a single skill by name
router.get('/skills/:name', getSkillByName);

// ── Protected route (requires JWT authentication) ────────────

// POST /api/skills — create a new skill (admin only)
router.post('/skills', authMiddleware, createSkill);

// POST /api/admin/trends/refresh — trigger trends pipeline on-demand (admin only)
router.post('/admin/trends/refresh', authMiddleware, refreshTrends);

module.exports = router;