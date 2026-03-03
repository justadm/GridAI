<template>
  <section class="py-5">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-lg-6">
          <div class="card">
            <div class="card-body">
              <h1 class="h4 fw-semibold mb-3">Вход в SkillRadar</h1>
              <p class="text-secondary">Введите email, получите магическую ссылку (в dev вернём токен).</p>
              <form class="mb-3" @submit.prevent="sendLink">
                <label class="form-label">Email</label>
                <div class="input-group">
                  <input v-model="email" type="email" class="form-control" placeholder="you@company.com" required />
                  <button class="btn btn-primary" type="submit">Отправить</button>
                </div>
              </form>
              <div v-if="loginMessage" class="alert alert-info">{{ loginMessage }}</div>

              <form class="mt-4" @submit.prevent="verify">
                <label class="form-label">Токен</label>
                <div class="input-group">
                  <input v-model="token" type="text" class="form-control" placeholder="код из email" required />
                  <button class="btn btn-outline-secondary" type="submit">Подтвердить</button>
                </div>
              </form>
              <div v-if="verifyMessage" class="alert alert-success mt-3">{{ verifyMessage }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useHead } from '../composables/useHead';
import { useUser } from '../composables/useUser';
import { useAuth } from '../composables/useAuth';

const email = ref('');
const token = ref('');
const loginMessage = ref('');
const verifyMessage = ref('');
const router = useRouter();
const { setProfile } = useUser();
const { setAuthed } = useAuth();

useHead(`
  <title>SkillRadar — Вход</title>
  <meta name="robots" content="noindex,nofollow" />
`);

onMounted(() => {
  if (typeof window === 'undefined') return;
  const maybeToken = new URLSearchParams(window.location.search).get('token');
  if (maybeToken) token.value = maybeToken;
});

const sendLink = async () => {
  loginMessage.value = '';
  const res = await fetch('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email: email.value })
  });
  const data = await res.json();
  if (!res.ok) {
    loginMessage.value = data?.error?.message || 'Ошибка отправки.';
    return;
  }
  loginMessage.value = 'Код входа отправлен на email.';
};

const verify = async () => {
  verifyMessage.value = '';
  const res = await fetch('/api/v1/auth/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ token: token.value })
  });
  const data = await res.json();
  if (!res.ok) {
    verifyMessage.value = data?.error?.message || 'Ошибка проверки.';
    return;
  }
  setAuthed(true);
  localStorage.removeItem('sr-token');
  localStorage.setItem('sr-api-base', '/api/v1');
  setProfile({ email: data.user?.email, role: data.user?.role });
  verifyMessage.value = 'Готово! Переходим в портал…';
  const redirect = typeof window !== 'undefined' ? sessionStorage.getItem('sr-redirect') : null;
  if (redirect) {
    sessionStorage.removeItem('sr-redirect');
  }
  setTimeout(() => router.push(redirect || '/portal'), 800);
};
</script>
