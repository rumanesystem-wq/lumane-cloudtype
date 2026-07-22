export type AdminSessionSummary = {
  id: string;
  mode: 'ai' | 'admin';
  customerName: string;
  messageCount: number;
  unreadAdminCount: number;
  startedAt: string;
  lastActivity: string;
  lastMessageAt: string;
  nickname?: string | null;
  src?: string | null;
  src2?: string | null;
};

export type AdminMessage = {
  role: 'user' | 'assistant';
  content: string;
  fromAdmin?: boolean;
  time?: string;
  ts?: string;
  mid?: string;
  read?: boolean;
};

export type AdminSessionDetail = AdminSessionSummary & {
  messages: AdminMessage[];
  customerTyping?: boolean;
};

export class AdminApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

function readCookie(name: string) {
  const prefix = `${encodeURIComponent(name)}=`;
  const value = document.cookie.split('; ').find((cookie) => cookie.startsWith(prefix));
  return value ? decodeURIComponent(value.slice(prefix.length)) : '';
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set('Content-Type', 'application/json');
  const csrfToken = readCookie('lumane_admin_csrf');
  if (csrfToken) headers.set('X-CSRF-Token', csrfToken);
  const response = await fetch(path, { ...init, credentials: 'same-origin', headers });
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { error?: string } | null;
    throw new AdminApiError(response.status, payload?.error || '요청을 처리하지 못했습니다.');
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const adminApi = {
  verifySession: (signal?: AbortSignal) => request<unknown>('/api/admin-auth/session', { signal }),
  sessions: (signal?: AbortSignal) => request<{ sessions: AdminSessionSummary[] }>('/api/admin/sessions', { signal }),
  session: (id: string, signal?: AbortSignal) => request<{ session: AdminSessionDetail }>(`/api/admin/session/${encodeURIComponent(id)}`, { signal }),
  takeover: (sessionId: string) => request<{ ok: true }>('/api/admin/takeover', { method: 'POST', body: JSON.stringify({ sessionId }) }),
  release: (sessionId: string) => request<{ ok: true }>('/api/admin/release', { method: 'POST', body: JSON.stringify({ sessionId }) }),
  sendMessage: (sessionId: string, message: string) => request<{ ok: true; mid: string }>('/api/admin/message', { method: 'POST', body: JSON.stringify({ sessionId, message }) }),
};
