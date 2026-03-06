const express = require("express");
const router = express.Router();

const {
  getAllSkills,
  getSkillByName,
  getTrendingSkills,
  getRecommendedSkills,
  compareSkills,
} = require("../controllers/skillController");

// All skills
router.get("/skills", getAllSkills);

// Single skill
router.get("/skills/:name", getSkillByName);

// Trending skills
router.get("/skills/trending", getTrendingSkills);

// Recommended skills
router.get("/skills/recommended/:skill", getRecommendedSkills);

// Compare skills
router.get("/skills/compare", compareSkills);

module.exports = router;
