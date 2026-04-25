const normalize = require("./skillNormalizer");

const SKILL_KEYWORDS = [
  "react",
  "javascript",
  "typescript",
  "node",
  "node.js",
  "nodejs",
  "python",
  "django",
  "flask",
  "docker",
  "kubernetes",
  "aws",
  "sql",
  "mongodb",
  "machine learning",
  "pytorch",
  "tensorflow"
];

function extractSkills(jobs) {

  const skillCounts = {};

  jobs.forEach(job => {

    const text = (job.title + " " + job.description).toLowerCase();

    SKILL_KEYWORDS.forEach(skill => {

      if (text.includes(skill)) {

        const normalizedSkill = normalize(skill);

        skillCounts[normalizedSkill] =
          (skillCounts[normalizedSkill] || 0) + 1;

      }

    });

  });

  return skillCounts;
}

module.exports = extractSkills;