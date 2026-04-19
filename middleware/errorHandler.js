/**
 * ═══════════════════════════════════════════════════════════════
 * GLOBAL ERROR-HANDLING MIDDLEWARE
 * ═══════════════════════════════════════════════════════════════
 *
 * WHY THIS MUST BE REGISTERED LAST IN server.js:
 * ───────────────────────────────────────────────
 * Express identifies error-handling middleware by its 4-parameter
 * signature: (err, req, res, next). Express only forwards errors
 * to this handler if:
 *   1. A route handler calls next(err)
 *   2. A synchronous error is thrown inside a route
 *   3. An async error is caught and passed to next()
 *
 * If this middleware is registered BEFORE route handlers, the routes
 * won't exist in the middleware stack yet — errors won't reach it.
 * It MUST come after all app.use() and route registrations.
 *
 * STRUCTURED ERROR HANDLING:
 * ──────────────────────────
 * Different error types get different HTTP status codes:
 *   - Mongoose CastError (bad ObjectId) → 400 Bad Request
 *   - Mongoose ValidationError → 422 Unprocessable Entity
 *   - JWT errors → 401 Unauthorized
 *   - Everything else → 500 Internal Server Error
 *
 * In production, the stack trace is hidden for security.
 * ═══════════════════════════════════════════════════════════════
 */

const errorHandler = (err, req, res, next) => {
    // Log the full error to the server console for debugging
    console.error(`[ERROR] ${err.message}`);

    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';

    // ── Mongoose CastError (invalid ObjectId format) ──────────
    if (err.name === 'CastError') {
        statusCode = 400;
        message = `Invalid value: ${err.value} — expected a valid ${err.kind}`;
    }

    // ── Mongoose ValidationError (schema validation failures) ─
    if (err.name === 'ValidationError') {
        statusCode = 422;
        const fields = Object.values(err.errors).map(e => e.message);
        message = `Validation failed: ${fields.join(', ')}`;
    }

    // ── JWT Errors (token expired, malformed, etc.) ───────────
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid authentication token';
    }
    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Authentication token has expired';
    }

    // ── Mongoose duplicate key (unique constraint violation) ──
    if (err.code === 11000) {
        statusCode = 409;
        const field = Object.keys(err.keyValue)[0];
        message = `Duplicate value for field: ${field}`;
    }

    res.status(statusCode).json({
        success: false,
        message,
        // Only include stack trace in development environment
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = errorHandler;
