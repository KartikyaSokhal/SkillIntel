const axios = require("axios");

async function fetchJobs() {
  try {

    const response = await axios.get(
      "https://remotive.com/api/remote-jobs"
    );

    const jobs = response.data.jobs;

    // limit jobs for Gemini token safety
    const limitedJobs = jobs.slice(0, 12);

    const formatted = limitedJobs.map(job => ({
      title: job.title,
      company: job.company_name,
      category: job.category,
      description: job.description.substring(0, 500)
    }));

    return formatted;

  } catch (error) {

    console.error("Job fetch error:", error.message);
    return [];

  }
}

module.exports = fetchJobs;