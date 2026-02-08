const apiBase = '/api/v1';

const loginForm = document.getElementById('login-form');
const verifyForm = document.getElementById('verify-form');
const loginResult = document.getElementById('login-result');
const verifyResult = document.getElementById('verify-result');

loginForm.addEventListener('submit', async e => {
  e.preventDefault();
  loginResult.classList.add('d-none');
  const email = document.getElementById('email').value.trim();
  const res = await fetch(`${apiBase}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  const data = await res.json();
  if (!res.ok) {
    loginResult.textContent = data?.error?.message || 'Ошибка отправки.';
    loginResult.classList.remove('d-none');
    return;
  }
  loginResult.textContent = data.debug_token
    ? `Dev token: ${data.debug_token}`
    : 'Ссылка отправлена на email.';
  loginResult.classList.remove('d-none');
});

verifyForm.addEventListener('submit', async e => {
  e.preventDefault();
  verifyResult.classList.add('d-none');
  const token = document.getElementById('token').value.trim();
  const res = await fetch(`${apiBase}/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  });
  const data = await res.json();
  if (!res.ok) {
    verifyResult.textContent = data?.error?.message || 'Ошибка проверки.';
    verifyResult.classList.remove('d-none');
    return;
  }
  localStorage.setItem('sr-token', data.token);
  localStorage.setItem('sr-api-base', apiBase);
  verifyResult.textContent = 'Готово! Переходим в портал…';
  verifyResult.classList.remove('d-none');
  setTimeout(() => {
    window.location.href = 'portal/dashboard.html';
  }, 800);
});
