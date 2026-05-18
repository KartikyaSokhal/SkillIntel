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

// Prisma
const prisma = require('./config/prisma');

// Routes
const skillRoutes = require('./routes/skillRoutes');
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

// Middleware
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');

// Models
const Skill = require('./models/Skill');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;
const NODE_ENV = process.env.NODE_ENV || 'development';

//////////////////////////////////////////////////////
// MIDDLEWARE
//////////////////////////////////////////////////////

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback_session_secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: MONGO_URI,
    ttl: 7 * 24 * 60 * 60
  }),
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
}));

app.use(logger);

if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//////////////////////////////////////////////////////
// VIEW ENGINE
//////////////////////////////////////////////////////

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

//////////////////////////////////////////////////////
// ROUTES
//////////////////////////////////////////////////////

app.use('/api/auth', authRoutes);
app.use('/api', skillRoutes);
app.use('/', dashboardRoutes);

//////////////////////////////////////////////////////
// 404 + ERROR HANDLER
//////////////////////////////////////////////////////

app.use((req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'API route not found' });
  }
  res.status(404).send('<h1>404 — Page Not Found</h1><p><a href="/">Go Home</a></p>');
});

app.use(errorHandler);

//////////////////////////////////////////////////////
// SOCKET.IO
//////////////////////////////////////////////////////

io.on('connection', (socket) => {
  console.log(`🔌 New client connected: ${socket.id}`);

  socket.emit('welcome', {
    message: 'Connected to SkillIntel live feed',
    socketId: socket.id
  });

  socket.on('requestTrending', async () => {
    try {
      let trending = await Skill.find()
        .sort({ growth: -1 })
        .limit(5)
        .select('name growth demandIndex salary category icon');

      // fallback to PostgreSQL if Mongo empty
      if (!trending || trending.length === 0) {
        const pg = await prisma.skill.findMany({
          orderBy: { growth: 'desc' },
          take: 5,
          select: {
            name: true,
            growth: true,
            demandIndex: true,
            salary: true,
            category: true,
            icon: true
          }
        });
        trending = pg;
      }

      socket.emit('trendingUpdate', { data: trending });

    } catch (err) {
      socket.emit('error', { message: 'Failed to fetch trending data' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

//////////////////////////////////////////////////////
// START SERVER
//////////////////////////////////////////////////////

async function startServer() {
  try {
    // MongoDB
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // PostgreSQL
    await prisma.$connect();
    console.log('✅ Connected to PostgreSQL');

    // ✅ ONLY scheduler handles pipeline
    try {
      require('./jobs/scheduler').arm();
    } catch (err) {
      console.error('⚠ Scheduler failed:', err.message);
    }

    // Start server
    server.listen(PORT, () => {
      console.log(`
======================================
  SkillIntel Backend v2.0.0
  Port: ${PORT}
  Environment: ${NODE_ENV}
  DB: Mongo + PostgreSQL
======================================

API:        http://localhost:${PORT}/api/skills
Dashboard:  http://localhost:${PORT}/dashboard
Auth:       http://localhost:${PORT}/api/auth/login
`);
    });

  } catch (err) {
    console.error('❌ Startup failed:', err);
    process.exit(1);
  }
}

startServer();

//////////////////////////////////////////////////////
// CLEAN SHUTDOWN
//////////////////////////////////////////////////////

process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down...');

  await prisma.$disconnect();
  await mongoose.disconnect();

  process.exit(0);
});