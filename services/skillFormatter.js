function formatSkills(skills, demandMap) {
  return skills.map(skill => {
    const rawName = String(skill.name || '').trim();
    if (!rawName) return null;
    const name =
      rawName.charAt(0).toUpperCase() +
      rawName.slice(1);
    const demandScore =
      demandMap[rawName.toLowerCase()] || 50;
    const demandIndex = Number(Math.min(10, Math.max(1, Math.round((demandScore / 10) * 10) / 10)));
    let averageSalary = 1000000;
    if (typeof skill.averageSalary === 'string') {
      const salaryMatch = skill.averageSalary.replace(/,/g, '').match(/\d+/g);
      if (salaryMatch) {
        averageSalary = parseInt(salaryMatch[0], 10);
      }
    } else if (typeof skill.averageSalary === 'number') {
      averageSalary = skill.averageSalary;
    }
    const salary = averageSalary < 1000000 ? Math.round(averageSalary * 83) : averageSalary;
    const growth = Number(skill.growthPercentage || skill.growth || 10);
    const recommended = (skill.recommendedRelatedSkills || skill.recommended || [])
      .map(item => String(item || '').trim())
      .filter(Boolean);
    return {
      name,
      category: skill.category || 'Technology',
      demandIndex,
      salary,
      growth,
      experienceBarrier: 'Moderate',
      saturationRisk: 'Stable',
      description: `${name} market intelligence from recent hiring trends.`,
      tags: ['Pipeline'],
      recommended
    };
  }).filter(Boolean);
}
module.exports = formatSkills;
