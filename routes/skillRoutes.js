const express = require("express");
const router = express.Router();

const {
  getAllSkills,
  getSkillByName,
  getTrendingSkills,
  getRecommendedSkills,
  compareSkills,
  refreshSkills
} = require("../controllers/skillController");

router.get("/skills", getAllSkills);

router.get("/skills/trending", getTrendingSkills);

router.get("/skills/recommended/:skill", getRecommendedSkills);

router.get("/skills/compare", compareSkills);

router.get("/skills/:name", getSkillByName);

router.post("/skills/refresh", refreshSkills);

module.exports = router;