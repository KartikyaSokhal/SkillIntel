const axios = require("axios");

/*
Tech keywords for identifying technical roles
*/
const TECH_KEYWORDS = [
  "engineer",
  "developer",
  "software",
  "backend",
  "frontend",
  "full stack",
  "web",
  "mobile",
  "ios",
  "android",
  "react",
  "node",
  "javascript",
  "typescript",
  "python",
  "django",
  "flask",
  "data",
  "data engineer",
  "data scientist",
  "machine learning",
  "deep learning",
  "ai",
  "ml",
  "cloud",
  "aws",
  "azure",
  "gcp",
  "devops",
  "kubernetes",
  "docker",
  "infrastructure",
  "platform",
  "security",
  "cybersecurity",
  "blockchain"
];

/*
Roles we want to exclude
*/
const EXCLUDED_KEYWORDS = [
  "sales",
  "marketing",
  "recruiter",
  "customer support",
  "customer service",
  "account manager",
  "business development",
  "rater",
  "moderator",
  "content reviewer"
];

/*
Check if job is a tech role
*/
function isTechJob(job) {

  const title = job.title.toLowerCase();
  const description = job.description.toLowerCase();

  const techRoles = [
    "software engineer",
    "software developer",
    "backend engineer",
    "frontend engineer",
    "full stack",
    "web developer",
    "mobile developer",
    "ios developer",
    "android developer",
    "data engineer",
    "machine learning engineer",
    "ml engineer",
    "ai engineer",
    "platform engineer",
    "devops engineer",
    "cloud engineer",
    "site reliability engineer"
  ];

  const techStack = [
    "javascript",
    "typescript",
    "react",
    "node",
    "python",
    "django",
    "flask",
    "docker",
    "kubernetes",
    "aws",
    "azure",
    "gcp",
    "sql",
    "mongodb",
    "graphql"
  ];

  const excluded = [
    "marketing",
    "sales",
    "brand manager",
    "product manager",
    "product designer",
    "crypto market",
    "account manager",
    "customer support",
    "recruiter",
    "seo"
  ];

  if (excluded.some(k => title.includes(k))) {
    return false;
  }

  if (techRoles.some(k => title.includes(k))) {
    return true;
  }

  return techStack.some(k => description.includes(k));

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
Fetch jobs from Remotive
*/
async function fetchRemotive() {

  try {

    const res = await axios.get(
      "https://remotive.com/api/remote-jobs"
    );

    return res.data.jobs.map(job => ({
      title: job.title,
      description: job.description,
      company: job.company_name,
      source: "remotive"
    }));

  } catch (err) {

    console.log("Remotive fetch error:", err.message);
    return [];

  }

}

/*
Fetch jobs from Arbeitnow
*/
async function fetchArbeitnow() {

  try {

    const res = await axios.get(
      "https://www.arbeitnow.com/api/job-board-api"
    );

    return res.data.data.map(job => ({
      title: job.title,
      description: job.description,
      company: job.company_name,
      source: "arbeitnow"
    }));

  } catch (err) {

    console.log("Arbeitnow fetch error:", err.message);
    return [];

  }

}

/*
Fetch jobs from The Muse
*/
async function fetchMuse() {

  try {

    const res = await axios.get(
      "https://www.themuse.com/api/public/jobs?page=1"
    );

    return res.data.results.map(job => ({
      title: job.name,
      description: job.contents,
      company: job.company.name,
      source: "themuse"
    }));

  } catch (err) {

    console.log("Muse fetch error:", err.message);
    return [];

  }

}

/*
Main job fetcher
*/
async function fetchJobs() {

  console.log("Collecting jobs from multiple sources...\n");

  let jobs = [];

  try {

    const [remotive, arbeitnow, muse] = await Promise.all([
      fetchRemotive(),
      fetchArbeitnow(),
      fetchMuse()
    ]);

    jobs = [...remotive, ...arbeitnow, ...muse];

  } catch (err) {

    console.log("Job fetch error:", err.message);

  }

  console.log("Total jobs collected:", jobs.length);

  const techJobs = jobs.filter(job => isTechJob(job));

  console.log("Tech jobs detected:", techJobs.length);

  const uniqueJobs = dedupe(techJobs);

  console.log("Unique tech jobs:", uniqueJobs.length);

  const limited = uniqueJobs.slice(0, 80);

  console.log("\nSample jobs:");

  limited.slice(0,5).forEach(job => {
    console.log("-", job.title);
  });

  console.log("");

  return limited;

}

module.exports = fetchJobs;