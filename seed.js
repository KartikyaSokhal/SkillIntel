/**
 * ═══════════════════════════════════════════════════════════════
 * Database Seeder — SkillIntel
 * ═══════════════════════════════════════════════════════════════
 *
 * This script populates MongoDB with initial skill data from
 * data/skills.json and creates a default admin user for testing.
 *
 * Usage: npm run seed  (or: node seed.js)
 *
 * WHAT THIS DOES:
 *   1. Connects to MongoDB Atlas
 *   2. Clears existing skills and users
 *   3. Inserts all skills from the JSON file
 *   4. Creates a default admin user (password is auto-hashed)
 *   5. Closes the connection and exits
 * ═══════════════════════════════════════════════════════════════
 */

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Skill = require('./models/Skill');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI;

async function seedDatabase() {
    try {
        // ── Connect to MongoDB ────────────────────────────────
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB for seeding');

        // ── Read skill data from JSON ─────────────────────────
        const rawData = fs.readFileSync(
            path.join(__dirname, 'data', 'skills.json'),
            'utf-8'
        );
        const skills = JSON.parse(rawData);

        // ── Clear existing data ───────────────────────────────
        await Skill.deleteMany();
        console.log('🗑  Cleared existing skills');

        await User.deleteMany();
        console.log('🗑  Cleared existing users');

        // ── Insert skills ─────────────────────────────────────
        await Skill.insertMany(skills);
        console.log(`📦 Inserted ${skills.length} skills`);

        // ── Create default admin user ─────────────────────────
        // The User model's pre-save hook automatically hashes the password
        const admin = new User({
            name: 'Admin',
            email: 'admin@skillintel.com',
            password: 'password123',
            role: 'admin'
        });
        await admin.save();
        console.log('👤 Created admin user (admin@skillintel.com / password123)');

        // ── Create a test user ────────────────────────────────
        const testUser = new User({
            name: 'Test User',
            email: 'test@skillintel.com',
            password: 'test1234',
            role: 'user'
        });
        await testUser.save();
        console.log('👤 Created test user (test@skillintel.com / test1234)');

        console.log('\n🎉 Database seeded successfully!');
    } catch (err) {
        console.error('❌ Seeding error:', err.message);
    } finally {
        await mongoose.connection.close();
        console.log('🔒 Database connection closed');
        process.exit(0);
    }
}

seedDatabase();
