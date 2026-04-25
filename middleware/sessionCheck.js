/**
 * ═══════════════════════════════════════════════════════════════
 * SESSION-BASED ROUTE PROTECTION MIDDLEWARE
 * ═══════════════════════════════════════════════════════════════
 *
 * SESSION-BASED vs TOKEN-BASED AUTH — KEY DIFFERENCES:
 * ─────────────────────────────────────────────────────
 *
 * SESSION-BASED (this middleware):
 *   - Server stores session data in a database (MongoDB via connect-mongo)
 *   - Client stores only a session ID cookie
 *   - Server looks up session ID to find user data
 *   - Stateful: server must maintain session storage
 *   - Best for: traditional web apps, SSR pages, browser-based flows
 *
 * TOKEN-BASED (authMiddleware.js):
 *   - Server signs a JWT token and sends it to the client
 *   - Client stores the full token (localStorage, cookie, etc.)
 *   - Server verifies token signature — no database lookup needed
 *   - Stateless: server stores nothing
 *   - Best for: APIs, mobile apps, SPAs, microservices
 *
 * IN SKILLINTEL:
 *   - JWT (authMiddleware.js) protects /api/* routes (for React SPA)
 *   - Sessions (this file) protect /dashboard SSR routes (for EJS views)
 * ═══════════════════════════════════════════════════════════════
 */

const sessionCheck = (req, res, next) => {
    // Check if the session contains user data (set during login)
    if (req.session && req.session.user) {
        // User is authenticated via session — proceed to route
        next();
    } else {
        // No active session — redirect to login page (SSR flow)
        res.redirect('/login');
    }
};

module.exports = sessionCheck;
