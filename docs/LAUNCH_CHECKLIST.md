# Чек‑лист запуска GridAI (после HH)

## A. Инфраструктура
- [ ] Доступ к серверу (Ubuntu) проверен.
- [ ] Node 22 установлен (system node).
- [ ] Репозиторий доступен root (SSH ключ добавлен в GitHub).
- [ ] Порт/доступы/файрволл настроены (если нужен web).

## B. HH API
- [ ] Получить `HH_CLIENT_ID / CLIENT_SECRET` (или API‑ключ).
- [ ] Обновить `.env`:
  - `USE_MOCKS=false`
  - `HH_API_BASE=https://api.hh.ru`
- [ ] Проверить лимиты/троттлинг HH.

## C. OpenAI
- [ ] Вставить `OPENAI_API_KEY`.
- [ ] Проверить лимиты/стоимость.
- [ ] Убедиться, что ошибки LLM не ломают поток.

## D. Deploy
- [ ] Клонировать репо:
```bash
git clone git@github.com:justadm/gridai.git /opt/GridAI
cd /opt/GridAI
```
- [ ] Выбрать один способ запуска и не смешивать старый `systemd` сценарий с docker-сценарием.
- [ ] Для текущего прода использовать `docker compose`.
- [ ] Настроить `.env`
- [ ] Поднять сервисы:
```bash
docker compose -f docker-compose.yml -f docker-compose.msk.yml up -d --build
```
- [ ] Проверить статус:
```bash
docker compose ps
docker compose logs --tail 50 web
docker compose logs --tail 50 bot
curl -sI http://127.0.0.1:13001/
curl -skI https://gridai.ru/
```
- [ ] Если менялся web-routing или меню, дополнительно проверить:
```bash
curl -skI https://admin.gridai.ru/settings/
curl -skI https://admin.gridai.ru/reports/
curl -skI https://career.gridai.ru/
curl -skI https://hiring.gridai.ru/roles/
curl -sk https://admin.gridai.ru/settings/ | rg 'href="[^"]+"'
```
- [ ] Убедиться, что хостовый `nginx` не содержит route-specific rewrite для `career/hiring/admin`; внутренние пути должны обслуживаться приложением.

## E. Тесты перед запуском
- [ ] `/status` — `USE_MOCKS=false`.
- [ ] `/help` — корректные подсказки.
- [ ] Поиск вакансий по 3–4 запросам.
- [ ] B2B‑режим: рынок роли / конкуренты / шаблон.

## F. Мониторинг и откат
- [ ] Быстрый откат: `USE_MOCKS=true`, перезапуск.
- [ ] При падениях web сначала проверять listener `127.0.0.1:13001`.
- [ ] При restart loop контейнеров смотреть `docker compose logs -f web bot`.
- [ ] Разбор инцидента `502`: `docs/INCIDENT_2026-03-30_GRIDAI_RU_502.md`.
- [ ] Разбор роутинга поддоменов и меню: `docs/ROUTING_2026-03-30_SUBDOMAINS.md`.
