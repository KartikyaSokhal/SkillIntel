const User = require('../models/User');
const jwt = require('jsonwebtoken');

// 🔥 NEW: Resume scorer
const { scoreResume } = require('../services/resumeScorer');

//////////////////////////////////////////////////////
// AUTH CONTROLLERS
//////////////////////////////////////////////////////

const register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Email already exists'
            });
        }

        const user = await User.create({ name, email, password });

        res.status(201).json({
            success: true,
            message: 'Account created',
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

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        req.session.user = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        };

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

const logout = (req, res, next) => {
    req.session.destroy((err) => {
        if (err) return next(err);
        res.clearCookie('connect.sid');
        res.json({ success: true, message: 'Logged out' });
    });
};

//////////////////////////////////////////////////////
// PROFILE
//////////////////////////////////////////////////////

const getProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('-password');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, user });

    } catch (err) {
        next(err);
    }
};

const updateProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const { name, status, currentRole, location } = req.body;

        if (name) user.name = name;
        if (status) user.profile.status = status;
        if (currentRole) user.profile.currentRole = currentRole;
        if (location) user.profile.location = location;

        await user.save();

        res.json({ success: true, message: 'Profile updated', user });

    } catch (err) {
        next(err);
    }
};

const createOrUpdateProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.profile = {
            ...user.profile,
            ...req.body
        };

        await user.save();

        res.json({ success: true, message: 'Profile created/updated', user });

    } catch (err) {
        next(err);
    }
};

//////////////////////////////////////////////////////
// 🔥 RESUME UPLOAD + SCORING
//////////////////////////////////////////////////////

const uploadResume = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // 🔥 RUN SCORING ENGINE
        const analysis = await scoreResume(req.file.buffer);

        // 🔥 SAVE EVERYTHING
        user.profile.resume = {
            fileName: req.file.originalname,
            mimeType: req.file.mimetype,
            fileData: req.file.buffer,
            sizeBytes: req.file.size,
            uploadedAt: new Date(),

            // 🔥 NEW SCORING FIELDS
            score: analysis.score,
            foundSkills: analysis.foundSkills,
            missingSkills: analysis.missingSkills
        };

        await user.save();

        res.status(201).json({
            success: true,
            message: 'Resume uploaded & analyzed',
            analysis
        });

    } catch (err) {
        next(err);
    }
};

//////////////////////////////////////////////////////
// DOWNLOAD RESUME
//////////////////////////////////////////////////////

const downloadResume = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('profile.resume');

        if (!user || !user.profile?.resume?.fileData) {
            return res.status(404).json({
                success: false,
                message: 'No resume found'
            });
        }

        const { fileName, mimeType, fileData } = user.profile.resume;

        res.set('Content-Type', mimeType || 'application/octet-stream');
        res.set('Content-Disposition', `inline; filename="${fileName || 'resume'}"`);

        res.send(fileData);

    } catch (err) {
        next(err);
    }
};

//////////////////////////////////////////////////////
// EXPORTS
//////////////////////////////////////////////////////

module.exports = {
    register,
    login,
    logout,
    getProfile,
    updateProfile,
    createOrUpdateProfile,
    uploadResume,
    downloadResume
};