# GridAI

GridAI — платформа с двумя сценариями:
- `career` — подбор вакансий, дайджесты и сигналы рынка для кандидатов;
- `hiring` — аналитика ролей, конкурентов и hiring-процессов для рекрутеров.

Подробная документация и прежний развёрнутый README перенесены в [`docs/README_FULL.md`](/Users/just/projects/GridAI/docs/README_FULL.md).

## Установка

1. Установить зависимости:
```bash
npm install
```

2. Создать `.env` на основе примера:
```bash
cp .env.example .env
```

3. Заполнить минимум:
- `TELEGRAM_BOT_TOKEN_JOBS`
- `TELEGRAM_BOT_TOKEN_HR`
- `OPENAI_API_KEY`

## Запуск

Локальная разработка:
```bash
npm run dev
```

Обычный запуск:
```bash
npm start
```

Docker:
```bash
docker compose up -d --build
```
