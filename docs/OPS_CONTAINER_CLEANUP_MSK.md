# Автоматическая очистка контейнерного мусора на `msk`

## Цель

Не допускать повторного накопления `containerd`/Docker мусора на корневом диске сервера `msk`.

## Что настроено

Используются два отдельных systemd-таймера:

- ежедневный `builder prune`
- еженедельный `image prune` + `volume prune` только при высоком заполнении диска

Оба режима отправляют отчет в Telegram через `/opt/tg-notify/.env`.

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
/opt/scripts/container_cleanup.sh daily 85
```

Что делает:

- запускает `docker builder prune -af`
- отправляет отчет в Telegram

### Weekly

Команда:

```bash
/opt/scripts/container_cleanup.sh weekly 85
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
sudo /opt/scripts/container_cleanup.sh daily 85
sudo /opt/scripts/container_cleanup.sh weekly 85
df -h /
docker system df
```

## Ожидаемое поведение

- daily обычно освобождает build cache
- weekly чаще всего пишет `skipped`, пока диск не дошел до порога
- когда usage доходит до `85%+`, weekly начинает убирать старые неиспользуемые образы и volumes
- Telegram получает краткий отчет с режимом, порогом, заполнением до/после и объемом освобожденного места
