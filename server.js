const express = require('express');
const path = require('path');
const skillRoutes = require('./routes/skillRoutes');

const app = express();
const PORT = process.env.PORT || 3000;


app.use(express.json());
app.use(express.urlencoded({ extended: false }));


app.use(express.static(path.join(__dirname, 'public')));


app.use('/api', skillRoutes);


app.use((req, res, next) => {

    if (req.originalUrl.startsWith('/api')) {
        return res.status(404).json({ error: 'API route not found' });
    }

    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});


app.use((err, req, res, next) => {
    console.error('[Error]', err.message);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message
    });
});


app.listen(PORT, () => {
    console.log(`\n🚀 SkillIndex Server Running`);
    console.log(`Local: http://localhost:${PORT}`);
    console.log(`API: http://localhost:${PORT}/api/skills\n`);
});