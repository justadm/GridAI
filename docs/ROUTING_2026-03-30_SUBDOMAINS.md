# Роутинг поддоменов: изменения от `2026-03-30`

## Кратко

- Дата: `2026-03-30`
- Затронутые домены: `auth.gridai.ru`, `career.gridai.ru`, `hiring.gridai.ru`, `admin.gridai.ru`
- Решение: внутренний роутинг перенесен из `nginx` в приложение
- Инвариант: `nginx` разруливает домены и проксирование, приложение разруливает страницы и канонические пути

## Что было не так

К моменту правки логика маршрутизации была размазана между двумя слоями:

- часть правил жила в хостовом `nginx`
- часть правил жила в `src/web/server.js`
- HTML-шаблоны в `web/portal/*.html` и `web/career/dashboard.html` продолжали использовать относительные ссылки вида `reports.html`, `settings.html`, `app.js`, `portal.css`

Это привело к двум классам проблем:

### 1. Хвосты `.html` и дублирование путей

При переходах из вложенных маршрутов относительные ссылки накапливали путь:

- `/settings/` + `settings.html` => `/settings/settings.html`
- `/settings/` + `reports.html` => `/settings/reports.html`

После предыдущих rewrite-правил это могло превращаться в:

- `/settings/settings/`
- `/settings/reports/`

### 2. Сломанная админка

На `admin.gridai.ru` при кликах из меню возникала ошибка:

- `Cannot GET /settings/settings/`

Корневая причина была не в статике как таковой, а в сочетании:

- относительных ссылок в меню
- программной подмены URL для поддоменов
- дополнительных rewrite в `nginx`

## Что изменено

### 1. `nginx` больше не занимается внутренними маршрутами поддоменов

Из [`deploy/nginx/gridai.ru.conf`](../deploy/nginx/gridai.ru.conf) удалены rewrite-правила для:

- `career.gridai.ru`
- `hiring.gridai.ru`
- `admin.gridai.ru`

После изменения `nginx` отвечает только за:

- прием запросов по доменам
- TLS
- proxy_pass до приложения
- доменные редиректы верхнего уровня для `gridai.ru` / `www.gridai.ru`

### 2. Приложение само обслуживает slash-маршруты и legacy `.html`

В [`src/web/server.js`](../src/web/server.js):

- обработка страниц поддоменов перенесена в Express
- приложение умеет открывать и канонические slash-пути, и старые `.html` URL
- auth-gate для `career` и `hiring` работает на уровне приложения
- статические ассеты исключены из auth redirect-логики
- удалена старая подмена `req.url` для поддоменов

### 3. Все ссылки в меню переведены на абсолютные slash-маршруты

Исправлены шаблоны:

- [`web/portal/dashboard.html`](../web/portal/dashboard.html)
- [`web/portal/reports.html`](../web/portal/reports.html)
- [`web/portal/roles.html`](../web/portal/roles.html)
- [`web/portal/competitors.html`](../web/portal/competitors.html)
- [`web/portal/template.html`](../web/portal/template.html)
- [`web/portal/team.html`](../web/portal/team.html)
- [`web/portal/billing.html`](../web/portal/billing.html)
- [`web/portal/settings.html`](../web/portal/settings.html)
- [`web/portal/_base.html`](../web/portal/_base.html)
- [`web/portal/layout.html`](../web/portal/layout.html)
- [`web/career/dashboard.html`](../web/career/dashboard.html)

Типовые изменения:

- `href="reports.html"` -> `href="/reports/"`
- `href="settings.html"` -> `href="/settings/"`
- `href="dashboard.html"` -> `href="/"`
- `href="portal.css"` -> `href="/hiring/portal.css"`
- `src="app.js"` -> `src="/hiring/app.js"`
- `src="../theme.js"` -> `src="/theme.js"`

## Результат

После деплоя на прод:

- `https://admin.gridai.ru/settings/` -> `HTTP/2 200`
- `https://admin.gridai.ru/reports/` -> `HTTP/2 200`
- HTML на `admin.gridai.ru/settings/` больше не содержит ссылок вида `settings.html`, `reports.html`
- меню на поддоменах использует только абсолютные slash-маршруты
- неавторизованный вход на `career.gridai.ru` и `hiring.gridai.ru` по-прежнему уходит на `auth.gridai.ru`, но источник этого поведения теперь приложение, а не `nginx`

## Как проверять после правок роутинга

Минимальный smoke-check:

```bash
curl -skI https://admin.gridai.ru/settings/
curl -skI https://admin.gridai.ru/reports/
curl -skI https://career.gridai.ru/
curl -skI https://hiring.gridai.ru/roles/
curl -sk https://admin.gridai.ru/settings/ | rg 'href="[^"]+"'
ssh msk "curl -s http://127.0.0.1:13001/settings/ -H 'Host: admin.gridai.ru' | rg 'href=\"[^\"]+\"'"
```

Что считать успешным результатом:

- `admin` страницы отвечают `200`
- `career` и `hiring` для гостя отвечают `302` на `auth.gridai.ru`
- в отданном HTML нет относительных menu-links вида `reports.html`, `settings.html`
- в `nginx` нет rewrite под конкретные страницы поддоменов

## Правило на будущее

Любые новые страницы в web-интерфейсе должны соблюдать одно правило:

- в HTML использовать только абсолютные пути приложения

То есть:

- хорошо: `/reports/`, `/roles/`, `/settings/`, `/theme.js`
- плохо: `reports.html`, `settings.html`, `app.js`, `../theme.js`

Если правило нарушить, проблема снова проявится на вложенных маршрутах.
