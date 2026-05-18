const prisma = require('../config/prisma'); // PostgreSQL
const SkillMongo = require('../models/Skill'); // MongoDB (fix capital S)

async function upsertSkillDual(skillData) {
  try {
    // 1. PostgreSQL (PRIMARY DB)
    const pgSkill = await prisma.skill.upsert({
      where: { name: skillData.name },

      update: {
        category: skillData.category,
        demandIndex: skillData.demandIndex,
        salary: skillData.salary || null,
        growth: skillData.growth || null,
        description: skillData.description || null,

        trendScore: skillData.trendScore || null,
        direction: skillData.direction || null,
        percentChange: skillData.percentChange || null,

        jobCountCurrent: skillData.jobCountCurrent || null,
        jobCountPrevious: skillData.jobCountPrevious || null,

        githubScore: skillData.githubScore || null,
        stackoverflowScore: skillData.stackoverflowScore || null,
        googleTrendScore: skillData.googleTrendScore || null,

        lastTrendComputedAt: new Date()
      },

      create: {
        name: skillData.name,
        category: skillData.category,
        demandIndex: skillData.demandIndex,
        salary: skillData.salary || null,
        growth: skillData.growth || null,
        description: skillData.description || null,

        trendScore: skillData.trendScore || null,
        direction: skillData.direction || null,
        percentChange: skillData.percentChange || null,

        jobCountCurrent: skillData.jobCountCurrent || null,
        jobCountPrevious: skillData.jobCountPrevious || null,

        githubScore: skillData.githubScore || null,
        stackoverflowScore: skillData.stackoverflowScore || null,
        googleTrendScore: skillData.googleTrendScore || null,

        lastTrendComputedAt: new Date()
      }
    });

    // 2. MongoDB (SECONDARY)
    const mongoSkill = await SkillMongo.findOneAndUpdate(
      { name: skillData.name },
      { $set: skillData },
      {
        upsert: true,
        returnDocument: 'after' // ✅ FIXES deprecation warning
      }
    );

    return { pgSkill, mongoSkill };

  } catch (error) {
    console.error("❌ Dual write failed:", error.message);
    throw error;
  }
}

module.exports = { upsertSkillDual };