const User = require('../models/User');
const jwt = require('jsonwebtoken');
const register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required: name, email, password'
            });
        }
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
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'An account with this email already exists'
            });
        }
        const user = await User.create({ name, email, password });
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
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
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
        res.cookie('skillintel_user', user.name, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000 
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
const logout = (req, res, next) => {
    try {
        req.session.destroy((err) => {
            if (err) return next(err);
            res.clearCookie('skillintel_user');
            res.clearCookie('connect.sid'); 
            res.json({
                success: true,
                message: 'Logged out successfully'
            });
        });
    } catch (err) {
        next(err);
    }
};
const getProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('name email role profile');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        res.json({
            success: true,
            user
        });
    } catch (err) {
        next(err);
    }
};
const VALID_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
const LEVEL_FALLBACK_SCORE = { Beginner: 25, Intermediate: 55, Advanced: 80, Expert: 95 };
function profileForClient(user) {
    const profile = (user.profile && user.profile.toObject) ? user.profile.toObject() : { ...(user.profile || {}) };
    if (profile.resume) {
        const { fileData, ...resumeMeta } = profile.resume;
        profile.resume = { ...resumeMeta, hasFile: !!fileData };
    }
    return profile;
}
function applyProfileUpdate(user, body) {
    const {
        name,
        status,
        currentRole,
        salary,
        intent,
        skills,
        resumeFileName,
        location,
        organization,
        bio,
        headline,
        avatarUrl,
        interestsTechnical,
        interestsStrategic,
        skillsDetailed
    } = body || {};
    if (typeof name === 'string' && name.trim()) {
        user.name = name.trim();
    }
    if (status === 'Student' || status === 'Working Professional') {
        user.profile.status = status;
    }
    if (typeof currentRole === 'string') user.profile.currentRole = currentRole.trim();
    if (typeof intent === 'string') user.profile.intent = intent.trim();
    if (typeof location === 'string') user.profile.location = location.trim();
    if (typeof organization === 'string') user.profile.organization = organization.trim();
    if (typeof bio === 'string') user.profile.bio = bio.slice(0, 1000);
    if (typeof headline === 'string') user.profile.headline = headline.trim();
    if (typeof avatarUrl === 'string') user.profile.avatarUrl = avatarUrl.trim();
    if (salary === '' || salary === null || salary === undefined) {
        user.profile.salary = null;
    } else {
        const parsedSalary = Number(salary);
        user.profile.salary = Number.isFinite(parsedSalary) ? parsedSalary : null;
    }
    if (Array.isArray(skills)) {
        user.profile.skills = skills.map((s) => String(s || '').trim()).filter(Boolean);
    }
    if (Array.isArray(interestsTechnical)) {
        user.profile.interestsTechnical = interestsTechnical
            .map((s) => String(s || '').trim()).filter(Boolean).slice(0, 30);
    }
    if (Array.isArray(interestsStrategic)) {
        user.profile.interestsStrategic = interestsStrategic
            .map((s) => String(s || '').trim()).filter(Boolean).slice(0, 30);
    }
    if (Array.isArray(skillsDetailed)) {
        user.profile.skillsDetailed = skillsDetailed
            .map((row) => {
                if (!row || typeof row.name !== 'string' || !row.name.trim()) return null;
                const level = VALID_LEVELS.includes(row.level) ? row.level : 'Intermediate';
                let score = Number(row.score);
                if (!Number.isFinite(score)) score = LEVEL_FALLBACK_SCORE[level];
                score = Math.max(0, Math.min(100, score));
                return { name: row.name.trim(), level, score };
            })
            .filter(Boolean)
            .slice(0, 50);
    }
    if (typeof resumeFileName === 'string' && resumeFileName.trim()) {
        user.profile.resume.fileName = resumeFileName.trim();
        if (!user.profile.resume.uploadedAt) {
            user.profile.resume.uploadedAt = new Date();
        }
    }
}
const getProfileV2 = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                profile: profileForClient(user),
                createdAt: user.createdAt
            }
        });
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
        applyProfileUpdate(user, req.body);
        await user.save();
        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                profile: profileForClient(user)
            }
        });
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
        const isFirstTime = !(user.profile && (user.profile.bio || user.profile.location || user.profile.headline));
        applyProfileUpdate(user, req.body);
        await user.save();
        res.status(isFirstTime ? 201 : 200).json({
            success: true,
            message: isFirstTime ? 'Profile created' : 'Profile updated',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                profile: profileForClient(user)
            }
        });
    } catch (err) {
        next(err);
    }
};
const uploadResume = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded (field name: "resume")' });
        }
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        user.profile.resume = {
            fileName: req.file.originalname,
            mimeType: req.file.mimetype,
            fileData: req.file.buffer,
            sizeBytes: req.file.size,
            uploadedAt: new Date()
        };
        await user.save();
        res.status(201).json({
            success: true,
            message: 'Resume uploaded',
            resume: {
                fileName: user.profile.resume.fileName,
                mimeType: user.profile.resume.mimeType,
                sizeBytes: user.profile.resume.sizeBytes,
                uploadedAt: user.profile.resume.uploadedAt,
                hasFile: true
            }
        });
    } catch (err) {
        next(err);
    }
};
const downloadResume = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('profile.resume');
        if (!user || !user.profile || !user.profile.resume || !user.profile.resume.fileData) {
            return res.status(404).json({ success: false, message: 'No resume on file' });
        }
        const { fileName, mimeType, fileData } = user.profile.resume;
        res.set('Content-Type', mimeType || 'application/octet-stream');
        res.set('Content-Disposition', `inline; filename="${fileName || 'resume'}"`);
        res.send(fileData);
    } catch (err) {
        next(err);
    }
};
module.exports = {
    register,
    login,
    logout,
    getProfile: getProfileV2,
    updateProfile,
    createOrUpdateProfile,
    uploadResume,
    downloadResume
};
