/**
 * ═══════════════════════════════════════════════════════════════
 * SkillIntel — Master Server Entry Point
 * ═══════════════════════════════════════════════════════════════
 *
 * This is the central file that wires together ALL components:
 *   - Express middleware stack
 *   - MongoDB connection via Mongoose
 *   - Session management with connect-mongo
 *   - EJS template engine for SSR
 *   - Socket.io for real-time WebSocket communication
 *   - All API and view route handlers
 *   - Global error handling
 *
 * ─────────────────────────────────────────────────────────────
 * MIDDLEWARE ORDER — WHY IT MATTERS
 * ─────────────────────────────────────────────────────────────
 * Express middleware executes in the ORDER it is registered.
 * A request flows through each middleware like a pipeline:
 *
 *   Request → cors → json parser → urlencoded → session
 *           → custom logger → morgan → ROUTE HANDLERS
 *           → 404 handler → ERROR HANDLER (last)
 *
 * If you register a route BEFORE the JSON parser, req.body
 * would be undefined. If the error handler is registered
 * BEFORE routes, errors won't reach it. ORDER IS CRITICAL.
 * ═══════════════════════════════════════════════════════════════
 */

// ── Load environment variables FIRST (before any other imports) ──
require('dotenv').config();

const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');
const { Server } = require('socket.io');

// ── Import Routes ─────────────────────────────────────────────
const skillRoutes = require('./routes/skillRoutes');
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

// ── Import Custom Middleware ──────────────────────────────────
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');

// ── Import Skill Model (for Socket.io queries) ───────────────
const Skill = require('./models/Skill');

const app = express();

/**
 * SOCKET.IO SETUP
 * ───────────────
 * Socket.io requires wrapping the Express app with http.createServer().
 * This gives us an HTTP server that BOTH Express and Socket.io share.
 *
 * HTTP vs WebSockets:
 *   HTTP: Request → Response (one-time, client initiates)
 *   WebSocket: Persistent bidirectional connection (either side can send)
 *
 * Socket.io sits ON TOP of the HTTP server and upgrades connections
 * from HTTP to WebSocket when possible, falling back to polling.
 *
 * WHY REAL-TIME IS USEFUL FOR SKILLINTEL:
 *   When trending skill data changes, we can push updates instantly
 *   to all connected clients without them needing to refresh.
 */
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ['http://localhost:5173', 'http://localhost:3000'],
        methods: ['GET', 'POST']
    }
});

// ── Configuration ─────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ═══════════════════════════════════════════════════════════════
// MIDDLEWARE REGISTRATION (ORDER MATTERS!)
// ═══════════════════════════════════════════════════════════════

// 1. CORS — Allow cross-origin requests (React dev server on :5173)
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true  // Allow cookies to be sent cross-origin
}));

// 2. Body Parsers — Parse incoming request bodies
app.use(express.json());                         // Parse JSON bodies
app.use(express.urlencoded({ extended: true }));  // Parse URL-encoded forms

/**
 * 3. SESSION MIDDLEWARE
 * ─────────────────────
 * WHAT IS A SESSION?
 *   A session is server-side storage tied to a specific user.
 *   The server creates a unique session ID, stores data (like user info)
 *   in the session store, and sends only the session ID to the client
 *   as a cookie. On subsequent requests, the cookie is sent back,
 *   and the server looks up the session data.
 *
 * HOW connect-mongo WORKS:
 *   By default, express-session stores sessions in memory (lost on restart).
 *   connect-mongo stores sessions in MongoDB, making them persistent
 *   across server restarts and scalable across multiple server instances.
 *
 * SESSION vs JWT — KEY DIFFERENCE:
 *   Session: Server stores user data → client holds only a session ID cookie
 *   JWT:     Client holds the full token → server stores nothing (stateless)
 *   
 *   SkillIntel uses BOTH:
 *     - JWT for API routes (React SPA communicates via Authorization header)
 *     - Sessions for SSR routes (EJS dashboard authenticated via cookie)
 */
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback_session_secret',
    resave: false,              // Don't save session if nothing changed
    saveUninitialized: false,   // Don't create empty sessions
    store: MongoStore.create({
        mongoUrl: MONGO_URI,    // Sessions stored in MongoDB Atlas
        ttl: 7 * 24 * 60 * 60  // Session TTL: 7 days (in seconds)
    }),
    cookie: {
        secure: false,          // Set to true with HTTPS in production
        httpOnly: true,         // Prevent client-side JS from reading cookie
        maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days in milliseconds
    }
}));

// 4. Custom Logger — Application-level middleware (see middleware/logger.js)
app.use(logger);

// 5. Morgan — HTTP request logger for development
if (NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// ═══════════════════════════════════════════════════════════════
// VIEW ENGINE — EJS for Server-Side Rendering
// ═══════════════════════════════════════════════════════════════
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ═══════════════════════════════════════════════════════════════
// STATIC FILES — Serve CSS, JS, images from /public
// ═══════════════════════════════════════════════════════════════
app.use(express.static(path.join(__dirname, 'public')));

// ═══════════════════════════════════════════════════════════════
// ROUTE REGISTRATION
// ═══════════════════════════════════════════════════════════════

// API Routes — Return JSON data
app.use('/api/auth', authRoutes);    // /api/auth/login, /api/auth/register, etc.
app.use('/api', skillRoutes);        // /api/skills, /api/trending, etc.

// SSR Routes — Return rendered HTML pages
app.use('/', dashboardRoutes);       // /dashboard, /login

// ═══════════════════════════════════════════════════════════════
// 404 HANDLER — Must come after all routes
// ═══════════════════════════════════════════════════════════════
app.use((req, res) => {
    if (req.originalUrl.startsWith('/api')) {
        return res.status(404).json({ success: false, message: 'API route not found' });
    }
    res.status(404).send('<h1>404 — Page Not Found</h1><p><a href="/">Go Home</a></p>');
});

/**
 * ERROR HANDLER — MUST BE REGISTERED LAST
 * ────────────────────────────────────────
 * Express only recognizes error-handling middleware by its
 * 4-parameter signature: (err, req, res, next).
 * It must come AFTER all routes so it can catch errors from them.
 * See middleware/errorHandler.js for detailed explanation.
 */
app.use(errorHandler);

// ═══════════════════════════════════════════════════════════════
// SOCKET.IO — Real-Time WebSocket Events
// ═══════════════════════════════════════════════════════════════

io.on('connection', (socket) => {
    console.log(`🔌 New client connected: ${socket.id}`);

    // Send a welcome event to the newly connected client
    socket.emit('welcome', {
        message: 'Connected to SkillIntel live feed',
        socketId: socket.id
    });

    /**
     * EVENT: requestTrending
     * ──────────────────────
     * Client sends this event to request the latest trending skills.
     * Server queries MongoDB and emits the data back.
     * This demonstrates real-time server → client data push.
     */
    socket.on('requestTrending', async () => {
        try {
            const trending = await Skill.find()
                .sort({ growth: -1 })
                .limit(5)
                .select('name growth demandIndex salary category icon');

            socket.emit('trendingUpdate', { data: trending });
        } catch (err) {
            socket.emit('error', { message: 'Failed to fetch trending data' });
        }
    });

    socket.on('disconnect', () => {
        console.log(`❌ Client disconnected: ${socket.id}`);
    });
});

// ═══════════════════════════════════════════════════════════════
// DATABASE CONNECTION + SERVER START
// ═══════════════════════════════════════════════════════════════

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('✅ Connected to MongoDB Atlas');

        // Arm the trends scheduler AFTER Mongo is up so the startup
        // freshness check can query SkillTrend safely. Wrapped in a
        // try/catch so a scheduling failure can never block boot.
        try {
            require('./jobs/scheduler').arm();
        } catch (err) {
            console.error('⚠ Trends scheduler failed to arm:', err.message);
        }

        // Start the HTTP server (NOT app.listen — we use the http server for Socket.io)
        server.listen(PORT, () => {
            console.log(`
╔══════════════════════════════════════╗
║      SkillIntel Backend v1.0.0      ║
║      Port: ${String(PORT).padEnd(25)}║
║      Environment: ${NODE_ENV.padEnd(18)}║
║      Socket.io: Active              ║
╚══════════════════════════════════════╝

📡 API:       http://localhost:${PORT}/api/skills
🖥  Dashboard: http://localhost:${PORT}/dashboard
🔐 Auth:      http://localhost:${PORT}/api/auth/login
`);
        });
    })
    .catch((err) => {
        console.error('❌ MongoDB Connection Error:', err.message);
        process.exit(1);
    });