const SRPortal = (() => {
  const qs = sel => document.querySelector(sel);
  const showLinkNote = (html = '', tone = 'info') => {
    const node = qs('[data-sr-link-note]');
    if (!node) return;
    if (!html) {
      node.className = 'alert d-none';
      node.innerHTML = '';
      return;
    }
    node.className = `alert alert-${tone}`;
    node.innerHTML = html;
  };
  const authLoginUrl = () => (
    window.location.hostname.endsWith('gridai.loc')
      ? `https://auth.gridai.loc/hiring?back_url=${encodeURIComponent(window.location.href)}`
      : window.location.hostname.endsWith('gridai.ru')
        ? `https://auth.gridai.ru/hiring?back_url=${encodeURIComponent(window.location.href)}`
        : '/hiring'
  );

  const badgeForStatus = status => {
    if (!status) return 'secondary';
    const normalized = status.toLowerCase();
    if (normalized.includes('готов')) return 'success';
    if (normalized.includes('работ')) return 'warning';
    return 'secondary';
  };

  const apiMap = {
    dashboard: 'dashboard',
    reports: 'reports',
    roles: 'roles',
    competitors: 'competitors',
    template: 'template',
    team: 'team',
    billing: 'billing',
    settings: 'settings'
  };

  const getBase = () => {
    const defaultBase = window.location.protocol.startsWith('http') ? '/api/v1' : '../data';
    return window.SR_API_BASE || localStorage.getItem('sr-api-base') || defaultBase;
  };

  const providerLabel = provider => ({
    telegram: 'Telegram',
    max: 'MAX',
    google: 'Google',
    yandex: 'Yandex ID',
    vk: 'VK ID'
  }[String(provider || '').toLowerCase()] || String(provider || ''));

  const loadJson = async page => {
    try {
      const base = getBase();
      const useJson = !base.includes('/api');
      const endpoint = apiMap[page] || page;
      const url = useJson ? `${base}/${page}.json` : `${base}/${endpoint}`;
      const headers = { 'Content-Type': 'application/json' };
      const res = await fetch(url, {
        cache: 'no-store',
        headers,
        credentials: useJson ? 'same-origin' : 'include'
      });
      if (res.status === 401) throw new Error('UNAUTHORIZED');
      if (res.status === 403) throw new Error('FORBIDDEN');
      if (!res.ok) return null;
      return await res.json();
    } catch (error) {
      return { __error: String(error?.message || 'UNKNOWN') };
    }
  };

  const loadLinkedProviders = async () => {
    try {
      const res = await fetch('/api/v1/me/link/providers', {
        credentials: 'include',
        cache: 'no-store'
      });
      if (res.status === 401) throw new Error('UNAUTHORIZED');
      if (!res.ok) return [];
      const payload = await res.json();
      return Array.isArray(payload.items) ? payload.items : [];
    } catch (_) {
      return [];
    }
  };

  const showState = state => {
    const loading = qs('[data-sr-loading]');
    const error = qs('[data-sr-error]');
    if (loading) loading.classList.toggle('d-none', state !== 'loading');
    if (error) error.classList.toggle('d-none', state !== 'error');
  };

  const renderDashboard = data => {
    if (!data) return;
    const stats = qs('#sr-stats');
    if (stats) {
      stats.innerHTML = data.stats
        .map(
          item => `
          <div class="col-md-4">
            <div class="card sr-card h-100">
              <div class="card-body">
                <p class="sr-muted mb-2">${item.label}</p>
                <h2 class="h4 mb-0">${item.value}</h2>
                <small class="sr-muted">${item.delta}</small>
              </div>
            </div>
          </div>`
        )
        .join('');
    }

    const reports = qs('#sr-reports');
    if (reports) {
      reports.innerHTML = data.reports
        .map(
          item => `
          <tr>
            <td>${item.role}</td>
            <td>${item.region}</td>
            <td>${item.date}</td>
            <td><span class="badge text-bg-${badgeForStatus(item.status)}">${item.status}</span></td>
          </tr>`
        )
        .join('');
    }

    const activity = qs('#sr-activity');
    if (activity) {
      activity.innerHTML = data.activity
        .map(item => `<li>• ${item}</li>`)
        .join('');
    }
  };

  const renderReports = data => {
    if (!data) return;
    const tbody = qs('#sr-reports-table');
    if (!tbody) return;
    tbody.innerHTML = data.items
      .map(
        item => `
        <tr>
          <td>${item.role}</td>
          <td>${item.region}</td>
          <td>${item.type}</td>
          <td>${item.date}</td>
          <td><span class="badge text-bg-${badgeForStatus(item.status)}">${item.status}</span></td>
          <td><button class="btn btn-outline-secondary btn-sm">Открыть</button></td>
        </tr>`
      )
      .join('');
  };

  const renderRoles = data => {
    if (!data) return;
    const container = qs('#sr-roles');
    if (!container) return;
    container.innerHTML = data.items
      .map(
        item => `
        <div class="col-md-6 col-lg-4">
          <div class="card sr-card h-100">
            <div class="card-body">
              <h3 class="h6">${item.title}</h3>
              <p class="sr-muted">${item.region} · ${item.level}</p>
              <p class="sr-muted">Навыки: ${item.skills}</p>
              <button class="btn btn-outline-secondary btn-sm">Открыть</button>
            </div>
          </div>
        </div>`
      )
      .join('');
  };

  const renderCompetitors = data => {
    if (!data) return;
    const list = qs('#sr-competitors');
    if (list) {
      list.innerHTML = data.leaders
        .map(item => `<li>${item.company} — ${item.count}</li>`)
        .join('');
    }
    const index = qs('#sr-competitors-index');
    if (index) index.textContent = data.index;
    const summary = qs('#sr-competitors-summary');
    if (summary) summary.textContent = data.summary;
  };

  const renderTemplate = data => {
    if (!data) return;
    const role = qs('#sr-template-role');
    if (role) role.textContent = data.role;
    const meta = qs('#sr-template-meta');
    if (meta) meta.textContent = `Уровень: ${data.level} · Формат: ${data.format}`;
    const req = qs('#sr-template-req');
    if (req) req.innerHTML = data.requirements.map(item => `<li>${item}</li>`).join('');
    const tasks = qs('#sr-template-tasks');
    if (tasks) tasks.innerHTML = data.tasks.map(item => `<li>${item}</li>`).join('');
    const salary = qs('#sr-template-salary');
    if (salary) salary.textContent = data.salary;
    const note = qs('#sr-template-note');
    if (note) note.textContent = data.salaryNote;
  };

  const renderTeam = data => {
    if (!data) return;
    const container = qs('#sr-team');
    if (!container) return;
    const members = data.members || data.items || [];
    container.innerHTML = members
      .map(
        item => `
        <div class="col-md-6 col-lg-4">
          <div class="card sr-card h-100">
            <div class="card-body">
              <h3 class="h6 mb-1">${item.name}</h3>
              <p class="sr-muted">${item.role} · ${item.access || item.status || ''}</p>
              <button class="btn btn-outline-secondary btn-sm">Управлять</button>
            </div>
          </div>
        </div>`
      )
      .join('');
  };

  const renderBilling = data => {
    if (!data) return;
    const container = qs('#sr-plans');
    if (!container) return;
    container.innerHTML = data.plans
      .map(
        plan => `
        <div class="col-md-6 col-lg-4">
          <div class="card sr-card h-100${plan.featured ? ' border border-primary' : ''}">
            <div class="card-body">
              ${plan.featured ? '<span class="badge text-bg-primary">Популярный</span>' : ''}
              <h3 class="h6${plan.featured ? ' mt-2' : ''}">${plan.name}</h3>
              <p class="display-6 fw-semibold">${plan.price}</p>
              <p class="sr-muted">${plan.desc}</p>
              <button class="btn ${plan.featured ? 'btn-primary' : 'btn-outline-secondary'} btn-sm">${plan.cta}</button>
            </div>
          </div>
        </div>`
      )
      .join('');
  };

  const renderSettings = data => {
    if (!data) return;
    const notifications = qs('#sr-notifications');
    if (notifications) {
      notifications.innerHTML = data.notifications
        .map(
          (item, idx) => `
          <div class="form-check form-switch">
            <input class="form-check-input" type="checkbox" role="switch" id="notif${idx}" ${
              item.enabled ? 'checked' : ''
            } />
            <label class="form-check-label" for="notif${idx}">${item.label}</label>
          </div>`
        )
        .join('');
    }
    const limits = qs('#sr-limits');
    if (limits) {
      limits.innerHTML = data.limits.map(item => `<p class="sr-muted">${item.label}: ${item.value}</p>`).join('');
    }
  };

  const startLinkedProvider = async item => {
    const provider = String(item.provider || '').toLowerCase();
    if (item.mode === 'oauth') {
      showLinkNote('');
      const res = await fetch(`/api/v1/me/oauth/${provider}/start`, {
        method: 'POST',
        credentials: 'include'
      });
      const payload = await res.json().catch(() => ({}));
      if (res.ok && payload.authorizeUrl) {
        window.location.href = payload.authorizeUrl;
      }
      return;
    }

    const startUrl = item.mode === 'telegram_web_login'
      ? '/api/v1/me/telegram/link/start'
      : '/api/v1/me/max/link/start';
    const statusUrl = item.mode === 'telegram_web_login'
      ? '/api/v1/me/telegram/link/status'
      : '/api/v1/me/max/link/status';
    const res = await fetch(startUrl, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intent: 'hiring' })
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok || !payload.requestId || !payload.botUrl) return;
    const providerName = providerLabel(provider);
    const opened = window.open(payload.botUrl, '_blank', 'noopener,noreferrer');
    if (!opened) {
      window.location.href = payload.botUrl;
      return;
    }
    const fallbackCommand = payload.command
      ? `Если deeplink не сработал, отправь в ${providerName}: <code>${payload.command}</code>`
      : '';
    showLinkNote(`Открыли ${providerName}. Подтверди вход в боте. ${fallbackCommand}`.trim(), 'info');
    let attempts = 0;
    const timer = window.setInterval(async () => {
      attempts += 1;
      const statusRes = await fetch(`${statusUrl}?requestId=${encodeURIComponent(payload.requestId)}`, {
        credentials: 'include',
        cache: 'no-store'
      });
      const statusPayload = await statusRes.json().catch(() => ({}));
      if (statusPayload.status === 'authorized' || attempts >= 60 || statusPayload.status === 'expired') {
        window.clearInterval(timer);
        if (statusPayload.status === 'authorized') {
          showLinkNote('');
          window.location.reload();
        } else if (statusPayload.status === 'expired') {
          showLinkNote(`Не удалось подтвердить вход через ${providerName}. Попробуй ещё раз.`, 'warning');
        }
      }
    }, 2000);
  };

  const renderLinkedProviders = items => {
    const node = qs('#sr-linked-accounts');
    if (!node) return;
    node.innerHTML = items.map(item => `
      <div class="d-flex justify-content-between align-items-center gap-3 border rounded px-3 py-2 mb-2">
        <div>
          <strong>${providerLabel(item.provider)}</strong>
          <div class="sr-muted small">${item.linked ? 'Подключен к текущему аккаунту' : 'Не подключен'}</div>
        </div>
        <div class="d-flex align-items-center gap-2">
          ${item.linked ? '<span class="badge text-bg-success">Подключен</span>' : ''}
          ${item.enabled && !item.linked ? `<button class="btn btn-outline-secondary btn-sm" data-link-provider="${item.provider}">Подключить</button>` : ''}
        </div>
      </div>
    `).join('');
    node.querySelectorAll('[data-link-provider]').forEach(button => {
      button.addEventListener('click', () => {
        const provider = String(button.getAttribute('data-link-provider') || '').toLowerCase();
        const found = items.find(entry => String(entry.provider || '').toLowerCase() === provider);
        if (found) startLinkedProvider(found).catch(() => {});
      });
    });
  };

  const renderers = {
    dashboard: renderDashboard,
    reports: renderReports,
    roles: renderRoles,
    competitors: renderCompetitors,
    template: renderTemplate,
    team: renderTeam,
    billing: renderBilling,
    settings: renderSettings
  };

  const init = async () => {
    const page = document.body.dataset.page;
    if (!page || !renderers[page]) return;
    showState('loading');
    const [data, linkedProviders] = await Promise.all([
      loadJson(page),
      page === 'settings' ? loadLinkedProviders() : Promise.resolve([])
    ]);
    if (!data || data.__error) {
      showState('error');
      const error = qs('[data-sr-error]');
      if (error && String(getBase()).includes('/api') && data?.__error === 'UNAUTHORIZED') {
        error.innerHTML = `Нужна авторизация. Откройте <a href="${authLoginUrl()}">страницу входа</a>.`;
      } else if (error && data?.__error === 'FORBIDDEN') {
        error.textContent = 'Недостаточно прав для этого раздела.';
      }
      return;
    }
    showState('ready');
    renderers[page](data);
    if (page === 'settings') renderLinkedProviders(linkedProviders);
  };

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => {
  SRPortal.init();
});
