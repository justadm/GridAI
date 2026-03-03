import { demoData } from '../demo';
import { useAuth } from './useAuth';

const apiBase = '/api/v1';

async function apiGet<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
  const { isAuthed, setAuthed } = useAuth();
  if (!isAuthed.value) {
    return (demoData as any)[path] as T;
  }
  const qs = params
    ? `?${Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&')}`
    : '';
  const res = await fetch(`${apiBase}/${path}${qs}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  if (res.status === 401) {
    setAuthed(false);
    throw new Error('UNAUTHORIZED');
  }
  if (!res.ok) throw new Error('API_ERROR');
  return res.json();
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const { isAuthed, setAuthed } = useAuth();
  if (!isAuthed.value) throw new Error('UNAUTHORIZED');
  const res = await fetch(`${apiBase}/${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  if (res.status === 401) {
    setAuthed(false);
    throw new Error('UNAUTHORIZED');
  }
  if (!res.ok) throw new Error('API_ERROR');
  return res.json();
}

async function apiDelete<T>(path: string): Promise<T> {
  const { isAuthed, setAuthed } = useAuth();
  if (!isAuthed.value) throw new Error('UNAUTHORIZED');
  const res = await fetch(`${apiBase}/${path}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    }
  });
  if (res.status === 401) {
    setAuthed(false);
    throw new Error('UNAUTHORIZED');
  }
  if (!res.ok) throw new Error('API_ERROR');
  return res.json();
}

async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const { isAuthed, setAuthed } = useAuth();
  if (!isAuthed.value) throw new Error('UNAUTHORIZED');
  const res = await fetch(`${apiBase}/${path}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  if (res.status === 401) {
    setAuthed(false);
    throw new Error('UNAUTHORIZED');
  }
  if (!res.ok) throw new Error('API_ERROR');
  return res.json();
}

async function apiDownload(path: string): Promise<Blob> {
  const { isAuthed, setAuthed } = useAuth();
  if (!isAuthed.value) throw new Error('UNAUTHORIZED');
  const res = await fetch(`${apiBase}/${path}`, {
    credentials: 'include'
  });
  if (res.status === 401) {
    setAuthed(false);
    throw new Error('UNAUTHORIZED');
  }
  if (!res.ok) throw new Error('API_ERROR');
  return res.blob();
}

export function useApi() {
  return {
    getDashboard: () => apiGet('dashboard'),
    getReports: (params?: Record<string, string | number | undefined>) => apiGet('reports', params),
    getRoles: () => apiGet('roles'),
    getCompetitors: () => apiGet('competitors'),
    getTemplate: () => apiGet('template'),
    getTeam: (params?: Record<string, string | number | undefined>) => apiGet('team', params),
    getBilling: () => apiGet('billing'),
    getSettings: () => apiGet('settings'),
    getHhStatus: () => apiGet('hh/status'),
    getMe: () => apiGet('me'),
    getLeads: (params?: Record<string, string | number | undefined>) => apiGet('leads', params),
    getAudit: (params?: Record<string, string | number | undefined>) => apiGet('audit', params),
    createReport: (payload: any) => apiPost('reports', payload),
    deleteReport: (id: string) => apiDelete(`reports/${id}`),
    exportReport: (id: string, format: 'pdf' | 'csv' = 'pdf') => apiDownload(`reports/${id}/export?format=${format}`),
    createRole: (payload: any) => apiPost('roles', payload),
    inviteTeam: (payload: any) => apiPost('team/invite', payload),
    updateTeamRole: (id: string, payload: any) => apiPatch(`team/${id}`, payload),
    deleteTeamMember: (id: string) => apiDelete(`team/${id}`),
    deleteRole: (id: string) => apiDelete(`roles/${id}`),
    startCheckout: (plan: string) => apiPost('billing/checkout', { plan }),
    startHhOauth: () => apiPost<{ url: string }>('hh/oauth/start', {}),
    updateLead: (id: string, payload: any) => apiPatch(`leads/${id}`, payload),
    logout: () => apiPost('auth/logout', {})
  };
}
