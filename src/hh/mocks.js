const mockVacancies = [
  {
    id: 'mock-1',
    name: 'Frontend Developer (React)',
    employer: { name: 'Acme Product' },
    area: { name: 'Москва' },
    salary: { from: 150000, to: 220000, currency: 'RUR' },
    experience: { id: 'between1And3' },
    schedule: { id: 'remote' },
    alternate_url: 'https://example.com/vacancy/1',
    snippet: {
      requirement: 'React, TypeScript, REST, Git',
      responsibility: 'Разработка UI, интеграция API'
    }
  },
  {
    id: 'mock-2',
    name: 'Backend Node.js Developer',
    employer: { name: 'Beta Tech' },
    area: { name: 'Санкт-Петербург' },
    salary: { from: 180000, to: 260000, currency: 'RUR' },
    experience: { id: 'between3And6' },
    schedule: { id: 'fullDay' },
    alternate_url: 'https://example.com/vacancy/2',
    snippet: {
      requirement: 'Node.js, PostgreSQL, REST, Docker',
      responsibility: 'Разработка API и интеграции'
    }
  },
  {
    id: 'mock-3',
    name: 'QA Engineer (Manual/Auto)',
    employer: { name: 'Gamma QA' },
    area: { name: 'Удаленно' },
    salary: { from: 90000, to: 140000, currency: 'RUR' },
    experience: { id: 'between1And3' },
    schedule: { id: 'remote' },
    alternate_url: 'https://example.com/vacancy/3',
    snippet: {
      requirement: 'Тест-кейсы, API testing, Postman',
      responsibility: 'Ручное/авто тестирование'
    }
  },
  {
    id: 'mock-4',
    name: 'Data Analyst',
    employer: { name: 'Delta Analytics' },
    area: { name: 'Москва' },
    salary: { from: 120000, to: 180000, currency: 'RUR' },
    experience: { id: 'between1And3' },
    schedule: { id: 'fullDay' },
    alternate_url: 'https://example.com/vacancy/4',
    snippet: {
      requirement: 'SQL, Excel, Power BI, Python',
      responsibility: 'Отчеты, дашборды, анализ'
    }
  },
  {
    id: 'mock-5',
    name: 'DevOps Engineer',
    employer: { name: 'Omega Cloud' },
    area: { name: 'Москва' },
    salary: { from: 200000, to: 300000, currency: 'RUR' },
    experience: { id: 'between3And6' },
    schedule: { id: 'remote' },
    alternate_url: 'https://example.com/vacancy/5',
    snippet: {
      requirement: 'Kubernetes, CI/CD, AWS, Linux',
      responsibility: 'Инфраструктура и автоматизация'
    }
  }
];

function mockSearchVacancies() {
  return {
    found: mockVacancies.length,
    pages: 1,
    items: mockVacancies
  };
}

function mockGetVacancy(id) {
  return mockVacancies.find(v => v.id === id) || mockVacancies[0];
}

module.exports = {
  mockSearchVacancies,
  mockGetVacancy
};
