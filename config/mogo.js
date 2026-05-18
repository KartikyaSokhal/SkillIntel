const mongoose = require('mongoose');

async function connectMongo() {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB error:", err);
  }
}

module.exports = connectMongo;