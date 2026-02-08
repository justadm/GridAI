const { request } = require('undici');
const { getVacancyCache, saveVacancyCache } = require('../db');
const { mockSearchVacancies, mockGetVacancy } = require('./mocks');

const HH_API_BASE = process.env.HH_API_BASE || 'https://api.hh.ru';
const HH_CACHE_TTL_MS = Number(process.env.HH_CACHE_TTL_MS || 6 * 60 * 60 * 1000);
const USE_MOCKS = String(process.env.USE_MOCKS || '').toLowerCase() === 'true';

function buildUrl(path, params = {}) {
  const url = new URL(path, HH_API_BASE);
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    url.searchParams.set(k, String(v));
  });
  return url.toString();
}

async function getJson(url) {
  const res = await request(url, {
    method: 'GET',
    headers: {
      'User-Agent': 'skillradar-bot/0.1',
      'Accept': 'application/json'
    }
  });
  if (res.statusCode >= 400) {
    const body = await res.body.text();
    throw new Error(`HH API error ${res.statusCode}: ${body.slice(0, 200)}`);
  }
  return res.body.json();
}

async function searchVacancies(params, page = 0, perPage = 50) {
  if (USE_MOCKS) return mockSearchVacancies();
  const url = buildUrl('/vacancies', { ...params, page, per_page: perPage });
  return getJson(url);
}

async function getVacancy(vacancyId) {
  if (USE_MOCKS) return mockGetVacancy(vacancyId);
  const cached = getVacancyCache(String(vacancyId));
  if (cached) {
    const age = Date.now() - new Date(cached.fetched_at).getTime();
    if (age < HH_CACHE_TTL_MS) return JSON.parse(cached.raw_json);
  }
  const url = buildUrl(`/vacancies/${vacancyId}`);
  const data = await getJson(url);
  saveVacancyCache(String(vacancyId), data);
  return data;
}

module.exports = {
  searchVacancies,
  getVacancy
};
