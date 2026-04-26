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

        const SEED_RESET = String(process.env.SEED_RESET || '').toLowerCase() === 'true';

        // ── Optionally reset collections (explicit only) ──────
        if (SEED_RESET) {
            await Skill.deleteMany();
            console.log('🗑  Cleared existing skills (SEED_RESET=true)');
        }

        // ── Upsert skills by name (safe/idempotent) ───────────
        const bulk = skills.map((skill) => ({
            updateOne: {
                filter: { name: skill.name },
                update: { $set: skill },
                upsert: true
            }
        }));
        if (bulk.length) {
            const result = await Skill.bulkWrite(bulk, { ordered: false });
            const upserts = result.upsertedCount || 0;
            const mods = result.modifiedCount || 0;
            const matches = result.matchedCount || 0;
            console.log(`📦 Skills upserted: +${upserts} new, ${mods} updated, ${matches} matched`);
        } else {
            console.log('⚠ No skills found in data/skills.json');
        }

        // ── Optionally reset users (explicit only) ────────────
        if (SEED_RESET) {
            await User.deleteMany();
            console.log('🗑  Cleared existing users (SEED_RESET=true)');
        }

        // ── Ensure default users exist (non-destructive) ───────
        const adminEmail = 'admin@skillintel.com';
        const testEmail = 'test@skillintel.com';

        const existingAdmin = await User.findOne({ email: adminEmail });
        if (!existingAdmin) {
            // The User model's pre-save hook automatically hashes the password
            const admin = new User({
                name: 'Admin',
                email: adminEmail,
                password: 'password123',
                role: 'admin'
            });
            await admin.save();
            console.log('👤 Created admin user (admin@skillintel.com / password123)');
        } else {
            console.log('👤 Admin user already exists (skipped)');
        }

        const existingTest = await User.findOne({ email: testEmail });
        if (!existingTest) {
            const testUser = new User({
                name: 'Test User',
                email: testEmail,
                password: 'test1234',
                role: 'user'
            });
            await testUser.save();
            console.log('👤 Created test user (test@skillintel.com / test1234)');
        } else {
            console.log('👤 Test user already exists (skipped)');
        }

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
