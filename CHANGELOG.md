# Changelog

Все заметные изменения в проекте `GridAI` фиксируются в этом файле.

Формат ориентирован на `Keep a Changelog`, а версии следуют `SemVer`.

## [Unreleased]

### Added
- Базовый набор GitHub labels, milestones и стартовых issues для планирования `GridAI`.

## [0.1.0] - 2026-03-22

### Added
- Ребрендинг проекта в `GridAI` и перенос репозитория в новую GitHub-репу.
- Разделение продукта на `career` и `hiring` контуры с отдельными поддоменами и кабинетами.
- Единый auth-контур на `auth.gridai.ru` и публичный API на `api.gridai.ru`.
- Daily Telegram digest вакансий с подписками, cron-запуском и доставкой в бота.
- Social login и linking flows для `Telegram`, `MAX`, `Google`, `Yandex ID`, `VK`.
- Локальный `*.gridai.loc` и production `*.gridai.ru` конфиг для web/auth/career/hiring/admin/api.

### Changed
- Корневой `README` сокращён до минимального onboarding, подробные материалы вынесены в `docs/`.
- Продовый путь приложения на `msk` перенесён из `/opt/hr-skillradar` в `/opt/GridAI`.

