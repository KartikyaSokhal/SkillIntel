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
const skillRoutes = require('./routes/skillRoutes');
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
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
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api/auth', authRoutes);    
app.use('/api', skillRoutes);        
app.use('/', dashboardRoutes);       
app.use((req, res) => {
    if (req.originalUrl.startsWith('/api')) {
        return res.status(404).json({ success: false, message: 'API route not found' });
    }
    res.status(404).send('<h1>404 — Page Not Found</h1><p><a href="/">Go Home</a></p>');
});
app.use(errorHandler);
io.on('connection', (socket) => {
    console.log(`🔌 New client connected: ${socket.id}`);
    socket.emit('welcome', {
        message: 'Connected to SkillIntel live feed',
        socketId: socket.id
    });
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
mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('✅ Connected to MongoDB Atlas');
        try {
            require('./jobs/scheduler').arm();
        } catch (err) {
            console.error('⚠ Trends scheduler failed to arm:', err.message);
        }
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
