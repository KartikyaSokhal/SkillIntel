const fetchJobs = require("../services/jobFetcher");
const extractSkills = require("../services/skillExtractor");
const calculateDemand = require("../services/demandCalculator");
const analyzeSkills = require("../services/geminiAnalyzer");
const updateSkillsFile = require("../services/skillUpdater");
const formatSkills = require("../services/skillFormatter");

async function runSkillPipeline() {

  console.log("Fetching job listings...");

  const jobs = await fetchJobs();

  console.log("Extracting skills...");

  const skillCounts = extractSkills(jobs);

  console.log("Calculating demand...");

  let demandSkills = calculateDemand(skillCounts);

  demandSkills = demandSkills.slice(0, 30);

  const demandMap = {};

  demandSkills.forEach(s => {
    demandMap[s.name.toLowerCase()] = s.demandScore;
  });

  console.log("Enriching with AI...");

  const enrichedSkills = await analyzeSkills(demandSkills);

  console.log("Gemini output sample:", enrichedSkills[0]);

  const formattedSkills = formatSkills(enrichedSkills, demandMap);

  updateSkillsFile(formattedSkills);

  console.log("skills.json updated successfully");

}

module.exports = runSkillPipeline;