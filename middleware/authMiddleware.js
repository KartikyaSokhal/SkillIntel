/**
 * ═══════════════════════════════════════════════════════════════
 * JWT AUTHENTICATION MIDDLEWARE
 * ═══════════════════════════════════════════════════════════════
 *
 * STATELESS AUTHENTICATION — How JWT Works:
 * ──────────────────────────────────────────
 * 1. User logs in → server creates a JWT (signed with a secret key)
 * 2. JWT is sent to the client and stored (localStorage / cookie)
 * 3. On each request, the client sends: Authorization: Bearer <token>
 * 4. This middleware verifies the token's signature and expiry
 * 5. If valid, decoded user data is attached to req.user
 *
 * WHY "STATELESS"?
 * ────────────────
 * Unlike sessions, JWT does NOT require the server to store any data.
 * The token itself contains all needed info (user ID, email, role).
 * The server only needs its secret key to verify authenticity.
 *
 * This makes JWT ideal for APIs consumed by mobile apps, SPAs,
 * and microservices where session storage is impractical.
 *
 * SECURITY:
 * - The secret key must NEVER be exposed to clients
 * - Tokens should have an expiration time (e.g., 7 days)
 * - HTTPS should be used in production to prevent token theft
 * ═══════════════════════════════════════════════════════════════
 */

const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    // Step 1: Extract the Authorization header
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'Access denied. No authentication token provided.'
        });
    }

    // Step 2: Extract the token (remove "Bearer " prefix)
    const token = authHeader.split(' ')[1];

    try {
        // Step 3: Verify the token using the same secret used to sign it
        // jwt.verify() will throw if the token is invalid or expired
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Step 4: Attach decoded payload to req.user for route handlers
        // Now any subsequent middleware/route can access req.user.id, etc.
        req.user = decoded;

        // Step 5: Pass control to the next middleware or route handler
        next();
    } catch (err) {
        // Token is invalid, expired, or tampered with
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token.'
        });
    }
};

module.exports = authMiddleware;
