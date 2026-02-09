<template>
  <div>
    <div class="d-flex justify-content-between align-items-center border-bottom pb-3 mb-4">
      <div>
        <h1 class="h3 mb-1">Заявки</h1>
        <p class="text-secondary mb-0">Лиды с публичных форм.</p>
      </div>
      <button class="btn btn-outline-secondary btn-sm" :disabled="!state.data?.items?.length" @click="exportCsv">Экспорт CSV</button>
    </div>

    <div v-if="!canViewLeads" class="alert alert-warning">
      Доступ к заявкам есть только у Admin и Owner.
    </div>

    <div v-if="state.loading" class="alert alert-info">Загружаем заявки…</div>
    <div v-if="state.error" class="alert alert-danger">Не удалось загрузить заявки.</div>

    <div class="card" v-if="state.data && canViewLeads">
      <div class="card-body">
        <div class="table-responsive">
          <table class="table align-middle">
            <thead>
              <tr>
                <th>ID</th>
                <th>Компания</th>
                <th>Email</th>
                <th>Источник</th>
                <th>Дата</th>
                <th>Комментарий</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in state.data.items" :key="item.id">
                <td>{{ item.id }}</td>
                <td>{{ item.company || '—' }}</td>
                <td><a :href="`mailto:${item.email}`">{{ item.email }}</a></td>
                <td>{{ item.source }}</td>
                <td>{{ item.created_at?.slice(0, 10) }}</td>
                <td class="text-secondary">{{ item.message || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive } from 'vue';
import { useApi } from '../../composables/useApi';
import { useAccess } from '../../composables/useAccess';
import { useHead } from '../../composables/useHead';

const api = useApi();
const { canViewLeads } = useAccess();
const state = reactive<{ loading: boolean; error: boolean; data: any | null }>({
  loading: true,
  error: false,
  data: null
});

onMounted(async () => {
  if (!canViewLeads.value) {
    state.loading = false;
    return;
  }
  try {
    state.data = await api.getLeads();
  } catch {
    state.error = true;
  } finally {
    state.loading = false;
  }
});

const exportCsv = () => {
  if (!state.data?.items?.length) return;
  const header = 'id,company,email,source,created_at,message';
  const rows = state.data.items.map((item: any) => {
    const msg = String(item.message || '').replace(/\n/g, ' ');
    return `${item.id},"${item.company || ''}","${item.email}","${item.source}","${item.created_at}","${msg}"`;
  });
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'skillradar-leads.csv';
  link.click();
  URL.revokeObjectURL(url);
};

useHead(`
  <title>SkillRadar — Заявки</title>
  <meta name="robots" content="noindex,nofollow" />
`);
</script>
