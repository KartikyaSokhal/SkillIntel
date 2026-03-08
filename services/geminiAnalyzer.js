const model = require("../config/gemini");

async function analyzeJobs(jobs) {

  const prompt = `
You are a job market analysis AI.

Analyze these job listings and extract top technical skills.

Return STRICT JSON array.

Each skill must contain:

name
category
demandScore (0-100)
growth (percentage estimate)
averageSalary (USD yearly estimate)
recommended (related skills)

Only JSON. No explanation.

Jobs:
${JSON.stringify(jobs)}
`;

  try {

    const result = await model.generateContent(prompt);

    const text = result.response.text();

    const cleaned = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(cleaned);

  } catch (error) {

    console.error("Gemini analysis error:", error.message);

    return [];

  }
}

module.exports = analyzeJobs;