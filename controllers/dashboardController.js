/**
 * ═══════════════════════════════════════════════════════════════
 * Dashboard Controller — Server-Side Rendering (SSR)
 * ═══════════════════════════════════════════════════════════════
 *
 * HOW SSR DIFFERS FROM API RESPONSES:
 * ────────────────────────────────────
 * API Routes (e.g. GET /api/skills):
 *   - Return raw JSON data: { success: true, data: [...] }
 *   - Consumed by frontend JavaScript (React, fetch, axios)
 *   - Client renders the UI using the JSON data
 *
 * SSR Routes (e.g. GET /dashboard):
 *   - Server fetches data from MongoDB
 *   - Server passes data to an EJS template
 *   - EJS template generates complete HTML on the server
 *   - Browser receives fully-rendered HTML (no JavaScript needed)
 *
 * ADVANTAGES OF SSR:
 *   - Faster initial page load (HTML is ready immediately)
 *   - Better SEO (search engines can read the HTML)
 *   - Works even if client-side JavaScript is disabled
 *
 * ADVANTAGES OF API + SPA (React):
 *   - Richer interactivity (no full page reloads)
 *   - Better UX for complex applications
 *   - Separation of frontend and backend
 *
 * SkillIntel uses BOTH approaches:
 *   - React SPA for the main user interface (API-driven)
 *   - EJS SSR for the admin dashboard (session-protected)
 * ═══════════════════════════════════════════════════════════════
 */

const Skill = require('../models/Skill');

/**
 * Render the dashboard page using EJS
 * Protected by sessionCheck middleware (user must be logged in)
 */
const renderDashboard = async (req, res, next) => {
    try {
        // Fetch all skills from MongoDB, sorted by demand
        const skills = await Skill.find().sort({ demandIndex: -1 });

        // res.render() does three things:
        //   1. Finds the template file: views/dashboard.ejs
        //   2. Passes the data object as template variables
        //   3. Compiles EJS → HTML and sends it to the browser
        res.render('dashboard', {
            title: 'SkillIntel Dashboard',
            skills,
            user: req.session.user || null,
            lastUpdated: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Render the login page (SSR)
 */
const renderLogin = (req, res) => {
    // Pass an error message if one exists in query params
    const error = req.query.error || null;
    res.render('login', { title: 'Login — SkillIntel', error });
};

module.exports = { renderDashboard, renderLogin };
