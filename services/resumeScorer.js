const pdfParse = require('pdf-parse');

//////////////////////////////////////////////////////
// 🔥 SKILL DATABASE (EXPANDED)
//////////////////////////////////////////////////////

const CORE_SKILLS = [
  'javascript', 'python', 'react', 'node.js', 'node',
  'sql', 'mysql', 'aws', 'docker', 'kubernetes',
  'java', 'django', 'express', 'fastapi',
  'git', 'linux', 'rest api', 'next.js'
];

//////////////////////////////////////////////////////
// 🔥 TEXT NORMALIZATION (CRITICAL FIX)
//////////////////////////////////////////////////////

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ') // remove dots, symbols (node.js → node js)
    .replace(/\s+/g, ' ')
    .trim();
}

//////////////////////////////////////////////////////
// SAFE TEXT EXTRACTION
//////////////////////////////////////////////////////

async function extractText(buffer) {
  try {
    const data = await pdfParse(buffer);

    if (!data || !data.text) {
      throw new Error('Empty PDF content');
    }

    return normalize(data.text);

  } catch (err) {
    console.error('[resumeScorer] PDF parse failed:', err.message);
    return '';
  }
}

//////////////////////////////////////////////////////
// 🔥 SKILL DETECTION (SMART MATCHING)
//////////////////////////////////////////////////////

function findSkills(text) {
  if (!text) return [];

  const found = [];

  for (const skill of CORE_SKILLS) {
    const cleanSkill = normalize(skill);

    // word boundary match (prevents "java" matching "javascript")
    const regex = new RegExp(`\\b${cleanSkill}\\b`, 'i');

    if (regex.test(text)) {
      found.push(skill);
    }
  }

  return [...new Set(found)];
}

//////////////////////////////////////////////////////
// 🔥 ADVANCED SCORING SYSTEM
//////////////////////////////////////////////////////

function calculateScore(foundSkills) {
  const count = foundSkills.length;

  if (count >= 10) return 90;
  if (count >= 7) return 75;
  if (count >= 5) return 60;
  if (count >= 3) return 40;
  if (count >= 1) return 20;

  return 0;
}

//////////////////////////////////////////////////////
// 🔥 KEYWORD QUALITY (UI LABELS)
//////////////////////////////////////////////////////

function getKeywordMatchLabel(score) {
  if (score >= 75) return 'High';
  if (score >= 40) return 'Medium';
  return 'Low';
}

function getFormattingLabel(score) {
  if (score >= 60) return 'Optimal';
  return 'Needs Work';
}

//////////////////////////////////////////////////////
// MAIN FUNCTION
//////////////////////////////////////////////////////

async function scoreResume(fileBuffer) {
  if (!fileBuffer) {
    return {
      score: 0,
      keywordMatch: 'Low',
      formatting: 'Needs Work',
      foundSkills: [],
      missingSkills: CORE_SKILLS
    };
  }

  const text = await extractText(fileBuffer);

  const foundSkills = findSkills(text);
  const score = calculateScore(foundSkills);

  return {
    score,
    keywordMatch: getKeywordMatchLabel(score),
    formatting: getFormattingLabel(score),
    foundSkills,
    missingSkills: CORE_SKILLS.filter(s => !foundSkills.includes(s))
  };
}

module.exports = { scoreResume };