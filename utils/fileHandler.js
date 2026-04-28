const fs = require('fs');
const path = require('path');
const SKILLS_FILE = path.join(__dirname, '../data/skills.json');
function readSkills() {
  try {
    const raw = fs.readFileSync(SKILLS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('[fileHandler] Error reading skills.json:', err.message);
    throw new Error('Failed to read skills data');
  }
}
function findSkillByName(name) {
  const skills = readSkills();
  return skills.find(s => s.name.toLowerCase() === name.toLowerCase()) || null;
}
module.exports = { readSkills, findSkillByName };
