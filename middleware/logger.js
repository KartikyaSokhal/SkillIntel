/**
 * ═══════════════════════════════════════════════════════════════
 * APPLICATION-LEVEL MIDDLEWARE — Custom Request Logger
 * ═══════════════════════════════════════════════════════════════
 *
 * WHAT IS APPLICATION-LEVEL MIDDLEWARE?
 * ─────────────────────────────────────
 * Application-level middleware is a function that runs on EVERY
 * incoming HTTP request before it reaches any route handler.
 * It is registered using app.use() in server.js.
 *
 * REQUEST LIFECYCLE:
 *   Client Request → CORS → JSON Parser → Session → THIS LOGGER
 *   → Morgan → Route Handler → Response
 *
 * WHY next()?
 * ──────────
 * Middleware functions receive (req, res, next). If a middleware
 * does NOT call next(), the request STOPS — no further middleware
 * or route handler will execute, and the client hangs forever.
 * Calling next() passes control to the next middleware in the stack.
 *
 * This logger simply prints request info and passes control onward.
 * ═══════════════════════════════════════════════════════════════
 */

const logger = (req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);

    // IMPORTANT: Always call next() in middleware unless you are
    // intentionally ending the request (e.g., returning an error response)
    next();
};

module.exports = logger;
