<template>
  <div>
    <div class="d-flex justify-content-between align-items-center border-bottom pb-3 mb-4">
      <div>
        <h1 class="h3 mb-1">Аудит</h1>
        <p class="text-secondary mb-0">История действий в ЛК.</p>
      </div>
      <button class="btn btn-outline-secondary btn-sm" :disabled="!state.data?.items?.length" @click="exportCsv">Экспорт CSV</button>
    </div>

    <div v-if="!canViewAudit" class="alert alert-warning">
      Доступ к аудиту есть только у Admin и Owner.
    </div>

    <div v-if="state.loading" class="alert alert-info">Загружаем аудит…</div>
    <div v-if="state.error" class="alert alert-danger">Не удалось загрузить аудит.</div>

    <div class="card mb-3" v-if="state.data && canViewAudit">
      <div class="card-body">
        <div class="row g-2 align-items-end">
          <div class="col-md-4">
            <label class="form-label">Поиск</label>
            <input v-model="filters.query" class="form-control" placeholder="Action / Actor / Target" />
          </div>
          <div class="col-md-3">
            <label class="form-label">Action</label>
            <input v-model="filters.action" class="form-control" placeholder="team.invite" />
          </div>
          <div class="col-md-3">
            <label class="form-label">Дата (от)</label>
            <input v-model="filters.from" class="form-control" type="date" />
          </div>
          <div class="col-md-2">
            <button class="btn btn-outline-secondary w-100" type="button" @click="resetFilters">Сбросить</button>
          </div>
        </div>
      </div>
    </div>

    <div class="card" v-if="state.data && canViewAudit">
      <div class="card-body">
        <div class="table-responsive">
          <table class="table align-middle">
            <thead>
              <tr>
                <th>ID</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Target</th>
                <th>Дата</th>
                <th>Payload</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in filteredItems" :key="item.id">
                <td>{{ item.id }}</td>
                <td>{{ item.actor_id || '—' }}</td>
                <td>{{ item.action }}</td>
                <td>{{ item.target || '—' }}</td>
                <td>{{ item.created_at?.slice(0, 19).replace('T', ' ') }}</td>
                <td class="text-secondary">{{ formatPayload(item.payload) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue';
import { useApi } from '../../composables/useApi';
import { useAccess } from '../../composables/useAccess';
import { useHead } from '../../composables/useHead';

const api = useApi();
const { canViewAudit } = useAccess();
const state = reactive<{ loading: boolean; error: boolean; data: any | null }>({
  loading: true,
  error: false,
  data: null
});
const filters = reactive({ query: '', action: '', from: '' });

onMounted(async () => {
  if (!canViewAudit.value) {
    state.loading = false;
    return;
  }
  try {
    state.data = await api.getAudit();
  } catch {
    state.error = true;
  } finally {
    state.loading = false;
  }
});

const filteredItems = computed(() => {
  if (!state.data?.items) return [];
  const q = filters.query.toLowerCase();
  return state.data.items.filter((item: any) => {
    const hay = `${item.actor_id || ''} ${item.action || ''} ${item.target || ''}`.toLowerCase();
    const queryOk = !q || hay.includes(q);
    const actionOk = !filters.action || String(item.action || '').toLowerCase().includes(filters.action.toLowerCase());
    const dateOk = !filters.from || String(item.created_at || '') >= filters.from;
    return queryOk && actionOk && dateOk;
  });
});

const resetFilters = () => {
  filters.query = '';
  filters.action = '';
  filters.from = '';
};

const formatPayload = (payload: any) => {
  if (!payload) return '—';
  try {
    return JSON.stringify(payload);
  } catch {
    return String(payload);
  }
};

const exportCsv = () => {
  if (!filteredItems.value.length) return;
  const header = 'id,actor,action,target,created_at,payload';
  const rows = filteredItems.value.map((item: any) => {
    const payload = item.payload ? JSON.stringify(item.payload).replace(/\n/g, ' ') : '';
    return `${item.id},"${item.actor_id || ''}","${item.action}","${item.target || ''}","${item.created_at}","${payload}"`;
  });
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'skillradar-audit.csv';
  link.click();
  URL.revokeObjectURL(url);
};

useHead(`
  <title>SkillRadar — Аудит</title>
  <meta name="robots" content="noindex,nofollow" />
`);
</script>
