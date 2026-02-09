const { normalizeText, includesAny } = require('../utils/text');

function getVacancyText(vacancy) {
  const parts = [
    vacancy.name,
    vacancy.snippet?.requirement,
    vacancy.snippet?.responsibility,
    vacancy.employer?.name
  ];
  return parts.filter(Boolean).join(' ');
}

function getVacancySalaryMax(vacancy) {
  if (!vacancy?.salary) return 0;
  return Math.max(vacancy.salary.from || 0, vacancy.salary.to || 0);
}

function getVacancyDate(vacancy) {
  if (!vacancy?.published_at) return 0;
  const ts = Date.parse(vacancy.published_at);
  return Number.isNaN(ts) ? 0 : ts;
}

function mapVacancyExperience(expId) {
  if (!expId) return 'unknown';
  if (expId === 'noExperience') return 'junior';
  if (expId === 'between1And3') return 'middle';
  if (expId === 'between3And6' || expId === 'moreThan6') return 'senior';
  return 'unknown';
}

function scoreVacancy(vacancy, criteria, stoplist = []) {
  let score = 0;
  const text = getVacancyText(vacancy);
  const normalizedText = normalizeText(text);

  const skills = Array.isArray(criteria.skills) ? criteria.skills : [];
  const skillHits = skills.filter(s => includesAny(normalizedText, [normalizeText(s)]));
  if (skillHits.length >= 1) score += 3;
  if (skillHits.length >= 2) score += 2;
  if (skillHits.length >= 4) score += 1;

  const role = String(criteria.role || '').trim();
  if (role && includesAny(normalizedText, [normalizeText(role)])) score += 3;

  const keywords = Array.isArray(criteria.keywords) ? criteria.keywords : [];
  const keywordHits = keywords.filter(k => includesAny(normalizedText, [normalizeText(k)]));
  if (keywordHits.length >= 1) score += 1;
  if (keywordHits.length >= 3) score += 1;

  const desiredExp = criteria.experience;
  const vacExp = mapVacancyExperience(vacancy.experience?.id);
  if (desiredExp && desiredExp !== 'unknown') {
    if (desiredExp === vacExp) score += 2;
    if (vacExp !== 'unknown' && desiredExp !== vacExp) score -= 1;
  }

  const desiredSalary = criteria.salary?.amount || 0;
  if (desiredSalary > 0 && vacancy.salary) {
    const best = getVacancySalaryMax(vacancy);
    if (best >= desiredSalary) score += 2;
    if (best > 0 && best < desiredSalary) score -= 3;
  }

  if (stoplist.length && includesAny(text, stoplist)) score -= 2;

  return score;
}

function rankVacancies(vacancies, criteria, stoplist) {
  return vacancies
    .map(v => ({ vacancy: v, score: scoreVacancy(v, criteria, stoplist) }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const salaryDiff = getVacancySalaryMax(b.vacancy) - getVacancySalaryMax(a.vacancy);
      if (salaryDiff !== 0) return salaryDiff;
      return getVacancyDate(b.vacancy) - getVacancyDate(a.vacancy);
    });
}

module.exports = {
  scoreVacancy,
  rankVacancies
};
