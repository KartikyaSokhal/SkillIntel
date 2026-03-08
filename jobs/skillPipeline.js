const fetchJobs = require("../services/jobFetcher");
const analyzeJobs = require("../services/geminiAnalyzer");
const updateSkillsFile = require("../services/skillUpdater");

async function runSkillPipeline() {

  console.log("Fetching job listings...");

  const jobs = await fetchJobs();

  if (jobs.length === 0) {
    console.log("No jobs found.");
    return;
  }

  console.log("Sending jobs to Gemini for analysis...");

  const skills = await analyzeJobs(jobs);

  if (!skills.length) {
    console.log("Gemini returned no skills.");
    return;
  }

  console.log("Updating skills.json...");

  updateSkillsFile(skills);

  console.log("Skill pipeline completed.");

}

module.exports = runSkillPipeline;