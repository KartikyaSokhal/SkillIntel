const model = require("../config/gemini");

async function analyzeSkills(skills) {

  const prompt = `
You are a senior technology labor-market analyst.

You are given a list of skills extracted from real software engineering job listings.

Your task is to enrich each skill with market intelligence.

Detected skills with demand scores:

${JSON.stringify(skills)}

For EACH skill generate the following fields:

name
category
growth
averageSalary
recommended

Definitions:

name
Correct technology name with proper industry capitalization.

category
Must be ONE of the following categories only:

Frontend
Backend
Cloud
DevOps
AI
Database
Programming Language
Data
Security

growth
Estimated yearly demand growth percentage (integer).

averageSalary
Average yearly salary in USD (number only).

recommended
5–7 related technologies developers should learn next.

IMPORTANT RULES

1. Return ONLY valid JSON.
2. Do NOT include explanations.
3. Do NOT include markdown.
4. Every skill MUST contain all fields.
5. Recommended skills must be single technologies only.
6. Do NOT combine technologies like "AWS/GCP".
7. Use correct industry capitalization.

Examples of correct capitalization:

AWS
JavaScript
TypeScript
SQL
MongoDB
Machine Learning
Node.js
React
Docker
Kubernetes

Example output format:

[
{
"name": "React",
"category": "Frontend",
"growth": 18,
"averageSalary": 130000,
"recommended": [
"JavaScript",
"TypeScript",
"Next.js",
"Redux",
"Tailwind CSS",
"GraphQL"
]
}
]

Return only JSON.
`;

  try {

    const result = await model.generateContent(prompt);

    const text = result.response.text();

    const cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(cleaned);

    return parsed;

  } catch (error) {

    console.error("Gemini analysis error:", error.message);

    return [];

  }

}

module.exports = analyzeSkills;