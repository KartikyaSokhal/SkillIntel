const fs = require('fs');
const path = require('path');

const SKILLS_FILE = path.join(__dirname, '../data/skills.json');

/**
 * Read all skills from the JSON file (synchronous)
 * @returns {Array} Array of skill objects
 */
function readSkills() {
  try {
    const raw = fs.readFileSync(SKILLS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('[fileHandler] Error reading skills.json:', err.message);
    throw new Error('Failed to read skills data');
  }
}

/**
 * Find a single skill by name (case-insensitive)
 * @param {string} name
 * @returns {Object|null}
 */
function findSkillByName(name) {
  const skills = readSkills();
  return skills.find(s => s.name.toLowerCase() === name.toLowerCase()) || null;
}

module.exports = { readSkills, findSkillByName };
