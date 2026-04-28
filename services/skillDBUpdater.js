const Skill = require("../models/Skill");
async function updateSkillsDB(skills) {
  try {
    const timestamp = new Date();
    await Skill.bulkWrite(
      skills.map(skill => ({
        updateOne: {
          filter: { name: skill.name },
          update: { $set: { ...skill, lastUpdated: timestamp } },
          upsert: true
        }
      }))
    );
    console.log("✅ Skills saved to MongoDB");
  } catch (error) {
    console.error("❌ DB update error:", error.message);
  }
}
module.exports = updateSkillsDB;
