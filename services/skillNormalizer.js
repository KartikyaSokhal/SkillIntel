const NORMALIZATION_MAP = {
  node: "Node.js",
  "nodejs": "Node.js",
  "node.js": "Node.js",
  js: "JavaScript",
  reactjs: "React",
  "react.js": "React",
  postgres: "PostgreSQL"
};
function normalize(skill) {
  const key = skill.toLowerCase();
  return NORMALIZATION_MAP[key] || skill;
}
module.exports = normalize;
