require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Skill = require('./models/Skill');
const User = require('./models/User');
const MONGO_URI = process.env.MONGO_URI;
async function seedDatabase() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB for seeding');
        const rawData = fs.readFileSync(
            path.join(__dirname, 'data', 'skills.json'),
            'utf-8'
        );
        const skills = JSON.parse(rawData);
        await Skill.deleteMany();
        console.log('🗑  Cleared existing skills');
        await User.deleteMany();
        console.log('🗑  Cleared existing users');
        await Skill.insertMany(skills);
        console.log(`📦 Inserted ${skills.length} skills`);
        const admin = new User({
            name: 'Admin',
            email: 'admin@skillintel.com',
            password: 'password123',
            role: 'admin'
        });
        await admin.save();
        console.log('👤 Created admin user (admin@skillintel.com / password123)');
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
