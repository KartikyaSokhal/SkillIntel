/**
 * ═══════════════════════════════════════════════════════════════
 * Dashboard Routes — SSR (Server-Side Rendering)
 * ═══════════════════════════════════════════════════════════════
 *
 * These routes serve HTML pages rendered by the EJS template engine.
 * Unlike API routes that return JSON, these return full HTML documents.
 *
 * /dashboard is protected by sessionCheck middleware — if the user
 * is not logged in, they are redirected to /login.
 * ═══════════════════════════════════════════════════════════════
 */

const express = require('express');
const router = express.Router();
const { renderDashboard, renderLogin } = require('../controllers/dashboardController');
const sessionCheck = require('../middleware/sessionCheck');

// GET /login — Render the login form (public, no auth needed)
router.get('/login', renderLogin);

// GET /dashboard — Render the dashboard (protected by session)
// sessionCheck runs first → if no session, redirects to /login
// If session exists, renderDashboard fetches data and renders EJS
router.get('/dashboard', sessionCheck, renderDashboard);

module.exports = router;
