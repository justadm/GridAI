(() => {
  const getStoredTheme = () => localStorage.getItem('sr-theme') || 'auto';
  const getPreferredTheme = () =>
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  const applyTheme = theme => {
    const resolved = theme === 'auto' ? getPreferredTheme() : theme;
    document.documentElement.setAttribute('data-bs-theme', resolved);
  };
  const updateButtons = theme => {
    document.querySelectorAll('[data-sr-theme]').forEach(btn => {
      const isActive = btn.dataset.srTheme === theme;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  };
  const setTheme = theme => {
    localStorage.setItem('sr-theme', theme);
    applyTheme(theme);
    updateButtons(theme);
  };

  window.SRTheme = { set: setTheme, get: getStoredTheme };

  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', () => {
      if (getStoredTheme() === 'auto') {
        applyTheme('auto');
      }
    });

  document.addEventListener('DOMContentLoaded', () => {
    updateButtons(getStoredTheme());
    document.querySelectorAll('[data-sr-theme]').forEach(btn => {
      btn.addEventListener('click', () => setTheme(btn.dataset.srTheme));
    });
  });
})();
