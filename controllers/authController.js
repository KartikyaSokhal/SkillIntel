/**
 * ═══════════════════════════════════════════════════════════════
 * Authentication Controller — SkillIntel
 * ═══════════════════════════════════════════════════════════════
 *
 * Handles user registration, login, logout, and profile retrieval.
 * Demonstrates:
 *   - Password hashing with bcryptjs (via User model pre-save hook)
 *   - JWT token generation for stateless API auth
 *   - Session management for SSR page auth
 *   - Cookie setting for persistent client-side state
 *   - Input validation and secure error messages
 * ═══════════════════════════════════════════════════════════════
 */

const User = require('../models/User');
const jwt = require('jsonwebtoken');

/**
 * REGISTER — Create a new user account
 * Route: POST /api/auth/register
 *
 * Flow:
 *   1. Validate all required fields from req.body
 *   2. Check for duplicate email (409 Conflict)
 *   3. Create User document (bcrypt hook hashes password automatically)
 *   4. Return user data WITHOUT the password field
 */
const register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        // ── Input validation ──────────────────────────────────
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required: name, email, password'
            });
        }

        // Basic email format check
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }

        // ── Check for existing user ───────────────────────────
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'An account with this email already exists'
            });
        }

        // ── Create new user ──────────────────────────────────
        // The password is automatically hashed by the User model's
        // pre-save hook before being stored in MongoDB
        const user = await User.create({ name, email, password });

        // Return user data — NEVER include the password in responses
        res.status(201).json({
            success: true,
            message: 'Account created successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (err) {
        next(err);
    }
};

/**
 * LOGIN — Authenticate user and issue JWT + session
 * Route: POST /api/auth/login
 *
 * Flow:
 *   1. Find user by email
 *   2. Verify password using bcrypt comparison
 *   3. Generate JWT token (stateless auth for API)
 *   4. Store user in session (stateful auth for SSR pages)
 *   5. Set a cookie for persistent client state
 *
 * SECURITY: Error messages are intentionally generic —
 *   we say "Invalid credentials" instead of "Email not found"
 *   to prevent user enumeration attacks.
 */
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // ── Find user by email ────────────────────────────────
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // ── Verify password ──────────────────────────────────
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // ── Generate JWT token ────────────────────────────────
        // Payload contains user info that can be decoded on future requests
        // Expiry is set to 7 days — after that, user must re-login
        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // ── Store user in session (for SSR dashboard) ─────────
        req.session.user = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        };

        // ── Set a cookie for client-side user display ─────────
        // httpOnly: true means JavaScript cannot read this cookie
        // (protection against XSS attacks)
        res.cookie('skillintel_user', user.name, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
        });

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        next(err);
    }
};

/**
 * LOGOUT — Destroy session and clear cookie
 * Route: POST /api/auth/logout
 */
const logout = (req, res, next) => {
    try {
        // Destroy the server-side session
        req.session.destroy((err) => {
            if (err) return next(err);

            // Clear the cookie from the client
            res.clearCookie('skillintel_user');
            res.clearCookie('connect.sid'); // express-session cookie

            res.json({
                success: true,
                message: 'Logged out successfully'
            });
        });
    } catch (err) {
        next(err);
    }
};

/**
 * GET PROFILE — Return decoded JWT user data
 * Route: GET /api/auth/profile
 *
 * This demonstrates a JWT-PROTECTED ROUTE.
 * The authMiddleware.js verifies the token and attaches
 * the decoded payload to req.user before this handler runs.
 * So req.user is guaranteed to contain valid user data here.
 */
const getProfile = (req, res) => {
    res.json({
        success: true,
        user: req.user
    });
};

module.exports = { register, login, logout, getProfile };
