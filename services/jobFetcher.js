const axios = require("axios");
require("dotenv").config();
const JSEARCH_API_KEY = process.env.JSEARCH_API_KEY;
const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID;
const ADZUNA_API_KEY = process.env.ADZUNA_API_KEY;
console.log("---- ENV DEBUG ----");
console.log("JSEARCH_API_KEY:", JSEARCH_API_KEY ? "Loaded" : "Missing");
console.log("ADZUNA_APP_ID:", ADZUNA_APP_ID ? "Loaded" : "Missing");
console.log("ADZUNA_API_KEY:", ADZUNA_API_KEY ? "Loaded" : "Missing");
console.log("-------------------");
const TECH_KEYWORDS = [
  "software",
  "developer",
  "engineer",
  "backend",
  "frontend",
  "full stack",
  "react",
  "angular",
  "node",
  "python",
  "java",
  "spring",
  "django",
  "flask",
  "aws",
  "docker",
  "kubernetes",
  "devops",
  "machine learning",
  "data engineer",
  "data scientist"
];
const EXCLUDED = [
  "sales",
  "marketing",
  "recruiter",
  "customer support",
  "account manager",
  "business development"
];
function isTechJob(job) {
  const text = (
    job.title + " " + job.description
  ).toLowerCase();
  if (EXCLUDED.some(k => text.includes(k))) {
    return false;
  }
  return TECH_KEYWORDS.some(k => text.includes(k));
}
function dedupe(jobs) {
  const seen = new Set();
  const unique = [];
  for (const job of jobs) {
    const key =
      job.title.toLowerCase() +
      (job.company || "").toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(job);
    }
  }
  return unique;
}
/*
Fetch jobs from JSearch
*/
async function fetchJSearch() {
  console.log("\nFetching jobs from JSearch...");
  try {
    const res = await axios.get(
      "https:
      {
        params: {
          query: "software developer india",
          page: "1",
          num_pages: "2"
        },
        headers: {
          "X-RapidAPI-Key": JSEARCH_API_KEY,
          "X-RapidAPI-Host": "jsearch.p.rapidapi.com"
        }
      }
    );
    const jobs = res.data.data.map(job => ({
      title: job.job_title || "",
      description: job.job_description || "",
      company: job.employer_name || "",
      location: job.job_city || "India",
      source: "jsearch"
    }));
    console.log("Jobs from JSearch:", jobs.length);
    return jobs;
  } catch (error) {
    console.log("JSearch fetch error:", error.response?.status);
    console.log(error.response?.data || error.message);
    return [];
  }
}
async function fetchAdzuna() {
  console.log("\nFetching jobs from Adzuna...");
  try {
    const res = await axios.get(
      "https://api.adzuna.com/v1/api/jobs/in/search/1",
      {
        params: {
          app_id: ADZUNA_APP_ID,
          app_key: ADZUNA_API_KEY,
          results_per_page: 50,
          what: "software developer"
        }
      }
    );
    const jobs = res.data.results.map(job => ({
      title: job.title,
      description: job.description || "",
      company: job.company.display_name || "",
      location: job.location.display_name || "India",
      source: "adzuna"
    }));
    console.log("Jobs from Adzuna:", jobs.length);
    return jobs;
  } catch (error) {
    console.log("Adzuna fetch error:", error.response?.status);
    console.log(error.response?.data || error.message);
    return [];
  }
}
async function fetchJobs() {
  console.log("\nCollecting Indian tech jobs...\n");
  let jobs = [];
  try {
    const [jsearchJobs, adzunaJobs] = await Promise.all([
      fetchJSearch(),
      fetchAdzuna()
    ]);
    jobs = [...jsearchJobs, ...adzunaJobs];
  } catch (err) {
    console.log("Job fetch pipeline error:", err.message);
  }
  console.log("\nTotal jobs collected:", jobs.length);
  const techJobs = jobs.filter(job => isTechJob(job));
  console.log("Tech jobs detected:", techJobs.length);
  const uniqueJobs = dedupe(techJobs);
  console.log("Unique tech jobs:", uniqueJobs.length);
  const limited = uniqueJobs.slice(0, 150);
  console.log("\nSample jobs:");
  limited.slice(0,5).forEach(job => {
    console.log("-", job.title);
  });
  console.log("");
  return limited;
}
module.exports = fetchJobs;
