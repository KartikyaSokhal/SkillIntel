const fetchJobs = require("../services/jobFetcher");
const extractSkills = require("../services/skillExtractor");
const calculateDemand = require("../services/demandCalculator");
const analyzeSkills = require("../services/geminiAnalyzer");
const updateSkillsFile = require("../services/skillUpdater");
const formatSkills = require("../services/skillFormatter");

// 🔥 NEW: dual write service
const { upsertSkillDual } = require("../services/dualWriteService");

const prisma = require("../config/prisma");

let isRunning = false;
let lastRunAt = null;

async function isDataFresh(hours = 24) {
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
  try {
    const latest = await prisma.skill.aggregate({
      _max: { lastTrendComputedAt: true }
    });

    const last = latest?._max?.lastTrendComputedAt;
    if (!last) return false;

    return new Date(last) >= cutoff;
  } catch (err) {
    console.warn("[skillPipeline] freshness check failed:", err.message);
    return false;
  }
}

async function runSkillPipeline() {
  if (isRunning) {
    console.log("[skillPipeline] already running — skipping");
    return { status: "skipped", reason: "already-running" };
  }

  const fresh = await isDataFresh(24);
  if (fresh) {
    console.log("[skillPipeline] data is fresh — skipping run");
    return { status: "skipped", reason: "fresh-data" };
  }

  isRunning = true;

  try {
    const startedAt = new Date();

    console.log("📡 Fetching job listings...");
    const jobs = await fetchJobs();

    console.log("🧠 Extracting skills...");
    const skillCounts = extractSkills(jobs);

    console.log("📊 Calculating demand...");
    let demandSkills = calculateDemand(skillCounts);

    // limit top skills
    demandSkills = demandSkills.slice(0, 30);

    // create demand map
    const demandMap = {};
    demandSkills.forEach(s => {
      demandMap[s.name.toLowerCase()] = s.demandScore;
    });

    console.log("🤖 Enriching with AI...");
    const enrichedSkills = await analyzeSkills(demandSkills);

    console.log("🔍 Gemini output sample:", enrichedSkills[0]);

    const formattedSkills = formatSkills(enrichedSkills, demandMap);

    console.log("💾 Writing to MongoDB + PostgreSQL...");

    // 🔥 DUAL WRITE (IMPORTANT CHANGE)
    for (const skill of formattedSkills) {
      try {
        await upsertSkillDual(skill);
      } catch (err) {
        console.error(`❌ Failed to sync skill: ${skill.name}`, err.message);
      }
    }

    // JSON backup (optional but good)
    updateSkillsFile(formattedSkills);

    lastRunAt = new Date();
    const elapsed = lastRunAt - startedAt;
    console.log(`[skillPipeline] completed in ${elapsed} ms`);

    console.log("✅ Skills synced to MongoDB + PostgreSQL + JSON");

  } catch (error) {
    console.error("❌ Pipeline failed:", error);
    return { status: "error", message: error.message };
  } finally {
    isRunning = false;
  }
}

module.exports = runSkillPipeline;