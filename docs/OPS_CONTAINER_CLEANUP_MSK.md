# Автоматическая очистка контейнерного мусора на `msk`

## Цель

Не допускать повторного накопления `containerd`/Docker мусора на корневом диске сервера `msk`.

## Что настроено

Используются два отдельных systemd-таймера:

- ежедневный `builder prune`
- еженедельный `image prune` + `volume prune` только при высоком заполнении диска

Серверный контур вынесен в отдельный каталог:

- `/opt/container-cleanup/container_cleanup.sh`
- `/opt/container-cleanup/README.md`
- optional env: `/opt/container-cleanup/.env`
- env template: `/opt/container-cleanup/.env.example`

Это сделано специально, чтобы сервис не выглядел частью `GridAI`.

Отчет в Telegram берется из первого подходящего источника:

- `/opt/container-cleanup/.env`
- `/opt/GridAI/.env`
- `/etc/systemd/system/b24-remote-testing.service`
- `/opt/tg-notify/.env`

Важно:

- основной рабочий путь для продовой конфигурации — именно `/opt/container-cleanup/.env`
- fallback-источники нужны только как резерв, а не как основной способ маршрутизации уведомлений

## Порог

Для еженедельной агрессивной очистки выбран порог `85%`.

Причина:

- `90%` уже слишком поздно для сервера с несколькими проектами и сборками
- `85%` оставляет запас на неожиданные `docker build`, логи и временные файлы
- ежедневный `builder prune` снимает мелкое накопление без риска для живых контейнеров

## Режимы

### Daily

Команда:

```bash
/opt/container-cleanup/container_cleanup.sh daily 85
```

Что делает:

- запускает `docker builder prune -af`
- отправляет отчет в Telegram

### Weekly

Команда:

```bash
/opt/container-cleanup/container_cleanup.sh weekly 85
```

Что делает:

- проверяет заполнение `/`
- если usage `< 85%`, агрессивную очистку пропускает
- если usage `>= 85%`, запускает:
  - `docker image prune -af`
  - `docker volume prune -f`
- отправляет отчет в Telegram

## Что не удаляется

Автоматизация не трогает:

- running containers
- используемые образы
- используемые тома
- данные приложений вне Docker

## Проверка после установки

Минимальный набор:

```bash
systemctl status container-cleanup-daily.service --no-pager
systemctl status container-cleanup-weekly.service --no-pager
systemctl list-timers --all | rg 'container-cleanup'
sudo /opt/container-cleanup/container_cleanup.sh daily 85
sudo /opt/container-cleanup/container_cleanup.sh weekly 85
df -h /
docker system df
```

## Ожидаемое поведение

- daily обычно освобождает build cache
- weekly чаще всего пишет `skipped`, пока диск не дошел до порога
- когда usage доходит до `85%+`, weekly начинает убирать старые неиспользуемые образы и volumes
- Telegram получает краткий отчет с режимом, порогом, заполнением до/после и объемом освобожденного места
