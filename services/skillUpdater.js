const fs = require("fs");
const path = require("path");

const SKILLS_FILE = path.join(__dirname, "../data/skills.json");

function updateSkillsFile(skills) {

  try {

    fs.writeFileSync(
      SKILLS_FILE,
      JSON.stringify(skills, null, 2),
      "utf-8"
    );

    console.log("skills.json updated successfully");

  } catch (error) {

    console.error("File update error:", error.message);

  }
}

module.exports = updateSkillsFile;