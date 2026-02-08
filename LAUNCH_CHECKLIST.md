# Чек‑лист запуска SkillRadar (после HH)

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
git clone git@github.com:justadm/skillradar.git /opt/skillradar
cd /opt/skillradar
```
- [ ] `npm install`
- [ ] Настроить `.env`
- [ ] Установить systemd unit (system‑node):
```bash
sudo cp /opt/skillradar/deploy/skillradar.systemnode.service /etc/systemd/system/skillradar.service
sudo systemctl daemon-reload
sudo systemctl enable skillradar
sudo systemctl start skillradar
```
- [ ] Проверить статус:
```bash
sudo systemctl status skillradar
sudo tail -f /var/log/skillradar.log
```

## E. Тесты перед запуском
- [ ] `/status` — `USE_MOCKS=false`.
- [ ] `/help` — корректные подсказки.
- [ ] Поиск вакансий по 3–4 запросам.
- [ ] B2B‑режим: рынок роли / конкуренты / шаблон.

## F. Мониторинг и откат
- [ ] Быстрый откат: `USE_MOCKS=true`, перезапуск.
- [ ] При падениях — смотреть `/var/log/skillradar.log`.
