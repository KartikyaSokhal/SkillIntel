require('dotenv').config();                 // ✅ ADD

const express = require('express');
const path = require('path');
const skillRoutes = require('./routes/skillRoutes');
const connectDB = require('./config/db');  // ✅ ADD

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ CONNECT DB before anything else
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const runSkillPipeline = require("./jobs/skillPipeline");

// ⚠️ run AFTER DB connection (simple version)
runSkillPipeline();

// Static Files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api', skillRoutes);

// 404 Handler
app.use((req, res, next) => {
    if (req.originalUrl.startsWith('/api')) {
        return res.status(404).json({ error: 'API route not found' });
    }
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// ❌ BUG FIX HERE
app.use((err, req, res, next) => {
    console.error('[Error]', err.message);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message   // ✅ FIXED
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`\n🚀 SkillIndex Server Running`);
    console.log(`Local: http://localhost:${PORT}`);
    console.log(`API: http://localhost:${PORT}/api/skills\n`);
});