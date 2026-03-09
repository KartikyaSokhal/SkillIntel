function formatSkills(skills, demandMap) {

  return skills.map(skill => {

    const name =
      skill.name.charAt(0).toUpperCase() +
      skill.name.slice(1);

    const demandScore =
      demandMap[skill.name.toLowerCase()] || 50;

    let averageSalary = 100000;

    if (typeof skill.averageSalary === "string") {

      const salaryMatch = skill.averageSalary.match(/\d+/g);

      if (salaryMatch) {
        averageSalary = parseInt(salaryMatch[0]) * 1000;
      }

    } else if (typeof skill.averageSalary === "number") {

      averageSalary = skill.averageSalary;

    }

    return {
      name,
      category: skill.category || "Technology",
      demandScore,
      growth: skill.growthPercentage || skill.growth || 10,
      averageSalary,
      recommended:
        skill.recommendedRelatedSkills ||
        skill.recommended ||
        []
    };

  });

}

module.exports = formatSkills;