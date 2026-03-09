function calculateDemand(skillCounts) {

  const maxCount = Math.max(...Object.values(skillCounts));

  const skills = Object.entries(skillCounts).map(([name, count]) => {

    const demandScore = Math.round((count / maxCount) * 100);

    return {
      name,
      frequency: count,
      demandScore
    };

  });

  return skills.sort((a, b) => b.demandScore - a.demandScore);
}

module.exports = calculateDemand;