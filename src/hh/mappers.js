const DEFAULT_AREA = process.env.HH_AREA_DEFAULT || '113';

function mapExperienceToHH(exp) {
  if (!exp) return undefined;
  switch (exp) {
    case 'junior':
      return 'noExperience';
    case 'middle':
      return 'between1And3';
    case 'senior':
      return 'between3And6';
    default:
      return undefined;
  }
}

function normalizeSkill(skill) {
  const s = String(skill || '').trim().toLowerCase();
  if (!s) return '';
  const map = {
    js: 'javascript',
    javascript: 'javascript',
    node: 'node.js',
    nodejs: 'node.js',
    'node.js': 'node.js',
    ts: 'typescript',
    typescript: 'typescript',
    reactjs: 'react',
    vuejs: 'vue',
    qa: 'qa',
    rest: 'rest',
    api: 'api',
    sql: 'sql',
    postgres: 'postgresql',
    postgresq: 'postgresql',
    pg: 'postgresql',
    k8s: 'kubernetes'
  };
  return map[s] || s;
}

function uniqList(items) {
  const seen = new Set();
  const res = [];
  for (const item of items) {
    const value = String(item || '').trim();
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    res.push(value);
  }
  return res;
}

function criteriaToSearchParams(criteria = {}) {
  const textParts = [];
  if (criteria.role) textParts.push(criteria.role);
  if (Array.isArray(criteria.skills)) {
    const skills = uniqList(criteria.skills.map(normalizeSkill));
    textParts.push(...skills);
  }
  if (Array.isArray(criteria.keywords)) {
    textParts.push(...uniqList(criteria.keywords));
  }
  const text = textParts.join(' ').trim();

  const exclude = Array.isArray(criteria.exclude) ? uniqList(criteria.exclude) : [];
  const excludeText = exclude.length ? exclude.map(w => `NOT ${w}`).join(' ') : '';

  const params = {
    text: [text, excludeText].filter(Boolean).join(' ').trim(),
    area: criteria.area || DEFAULT_AREA,
    experience: mapExperienceToHH(criteria.experience),
    salary_from: criteria.salary?.amount || undefined,
    currency: criteria.salary?.currency || undefined,
    only_with_salary: criteria.salary?.amount ? true : undefined
  };

  return params;
}

module.exports = {
  criteriaToSearchParams,
  mapExperienceToHH
};
