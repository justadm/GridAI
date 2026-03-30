const SRCareer = (() => {
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
  const authEntryUrl = () => {
    const backUrl = encodeURIComponent(window.location.href);
    const host = window.location.hostname;
    if (host.endsWith('gridai.loc')) return `https://auth.gridai.loc/career?back_url=${backUrl}`;
    if (host.endsWith('gridai.ru')) return `https://auth.gridai.ru/career?back_url=${backUrl}`;
    return '/career';
  };

  async function ensureSession() {
    const loading = qs('[data-sr-loading]');
    const error = qs('[data-sr-error]');
    loading?.classList.remove('d-none');
    try {
      const res = await fetch('/api/v1/me', { credentials: 'include' });
      if (res.status === 401) throw new Error('UNAUTHORIZED');
      loading?.classList.add('d-none');
      error?.classList.add('d-none');
      return true;
    } catch (err) {
      loading?.classList.add('d-none');
      error?.classList.remove('d-none');
      if (String(err?.message || '') === 'UNAUTHORIZED') {
        setTimeout(() => {
          window.location.href = authEntryUrl();
        }, 900);
      }
      return false;
    }
  }

  async function loadData() {
    const res = await fetch('/api/v1/career/dashboard', {
      cache: 'no-store',
      credentials: 'include'
    });
    if (!res.ok) return null;
    return res.json();
  }

  async function loadLinkedProviders() {
    const res = await fetch('/api/v1/me/link/providers', {
      cache: 'no-store',
      credentials: 'include'
    });
    if (!res.ok) return [];
    const payload = await res.json();
    return Array.isArray(payload.items) ? payload.items : [];
  }

  function providerLabel(provider) {
    const labels = {
      telegram: 'Telegram',
      max: 'MAX',
      google: 'Google',
      yandex: 'Yandex ID',
      vk: 'VK ID'
    };
    return labels[String(provider || '').toLowerCase()] || String(provider || '');
  }

  async function startLinkedProvider(item) {
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
      body: JSON.stringify({ intent: 'career' })
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
    const poll = async () => {
      const statusRes = await fetch(`${statusUrl}?requestId=${encodeURIComponent(payload.requestId)}`, {
        credentials: 'include',
        cache: 'no-store'
      });
      const statusPayload = await statusRes.json().catch(() => ({}));
      if (statusPayload.status === 'authorized') {
        showLinkNote('');
        window.location.reload();
        return true;
      }
      if (statusPayload.status === 'expired') {
        showLinkNote(`Не удалось подтвердить вход через ${providerName}. Попробуй ещё раз.`, 'warning');
      }
      return statusPayload.status !== 'pending';
    };
    let attempts = 0;
    const timer = window.setInterval(async () => {
      attempts += 1;
      const done = await poll().catch(() => false);
      if (done || attempts >= 60) {
        window.clearInterval(timer);
      }
    }, 2000);
  }

  function renderLinkedProviders(items) {
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
        const item = items.find(entry => String(entry.provider || '').toLowerCase() === provider);
        if (item) startLinkedProvider(item).catch(() => {});
      });
    });
  }

  function renderOverview(data) {
    qs('#sr-career-digests-count').textContent = data.overview.digests;
    qs('#sr-career-saved-count').textContent = data.overview.saved;
    qs('#sr-career-market-pulse').textContent = data.overview.marketPulse;
  }

  function renderDigests(items) {
    const node = qs('#sr-career-digests');
    node.innerHTML = items.map(item => `
      <div class="list-group-item px-0">
        <div class="d-flex justify-content-between align-items-start gap-3">
          <div>
            <strong>${item.query}</strong>
            <div class="sr-muted small mt-1">Последняя отправка: ${item.lastSent}</div>
          </div>
          <span class="badge text-bg-${item.status === 'active' ? 'success' : 'secondary'}">${item.statusLabel}</span>
        </div>
      </div>
    `).join('');
  }

  function renderSaved(items) {
    const node = qs('#sr-career-saved');
    node.innerHTML = items.map(item => `
      <div class="list-group-item px-0">
        <strong>${item.title}</strong>
        <div class="sr-muted small mt-1">${item.company} · ${item.salary} · ${item.mode}</div>
      </div>
    `).join('');
  }

  function renderQueries(items) {
    const node = qs('#sr-career-queries');
    node.innerHTML = items.map(item => `
      <tr>
        <td>${item.query}</td>
        <td>${item.market}</td>
        <td>${item.updatedAt}</td>
      </tr>
    `).join('');
  }

  function renderMarket(items) {
    const node = qs('#sr-career-market');
    node.innerHTML = items.map(item => `<li>• ${item}</li>`).join('');
  }

  function renderProfile(profile) {
    qs('#sr-career-role').textContent = profile.role;
    qs('#sr-career-format').textContent = profile.format;
    qs('#sr-career-salary').textContent = profile.salary;
  }

  function renderDataHint(data) {
    const note = qs('[data-sr-career-note]');
    if (!note) return;
    if (data?.requiresTelegram) {
      note.classList.remove('d-none');
      note.innerHTML = 'Подключи <strong>Telegram Careers bot</strong>, чтобы кабинет показывал твои реальные дайджесты, запросы и отправленные вакансии.';
      return;
    }
    note.classList.add('d-none');
    note.innerHTML = '';
  }

  async function init() {
    const authed = await ensureSession();
    if (!authed) return;
    const [data, linkedProviders] = await Promise.all([
      loadData(),
      loadLinkedProviders()
    ]);
    if (!data) return;
    renderDataHint(data);
    renderOverview(data);
    renderDigests(data.digests || []);
    renderSaved(data.saved || []);
    renderQueries(data.queries || []);
    renderMarket(data.market || []);
    renderProfile(data.profile || {});
    renderLinkedProviders(linkedProviders);
  }

  return { init };
})();

window.addEventListener('DOMContentLoaded', () => {
  SRCareer.init().catch(() => {});
});
