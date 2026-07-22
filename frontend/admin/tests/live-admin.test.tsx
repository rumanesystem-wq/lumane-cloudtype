import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({
  verifySession: vi.fn(), sessions: vi.fn(), session: vi.fn(), takeover: vi.fn(), release: vi.fn(), sendMessage: vi.fn(),
}));

vi.mock('../src/api/client', () => ({
  adminApi: api,
  AdminApiError: class AdminApiError extends Error { constructor(public status: number, message: string) { super(message); } },
}));

import { LiveAdmin } from '../src/features/live/LiveAdmin';

const summary = { id: 'session-1', mode: 'ai', customerName: '홍길동', messageCount: 1, unreadAdminCount: 0, startedAt: '2026-07-22T00:00:00Z', lastActivity: '2026-07-22T00:00:00Z', lastMessageAt: '2026-07-22T00:00:00Z' } as const;
const detail = { ...summary, messages: [{ role: 'user' as const, content: '<img src=x onerror=alert(1)>', time: '2026-07-22T00:00:00Z' }] };

describe('LiveAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.verifySession.mockResolvedValue({});
    api.sessions.mockResolvedValue({ sessions: [summary] });
    api.session.mockResolvedValue({ session: detail });
    api.takeover.mockResolvedValue({ ok: true });
    api.release.mockResolvedValue({ ok: true });
    api.sendMessage.mockResolvedValue({ ok: true, mid: 'adm-1' });
  });

  it('loads a real session and renders message content as text', async () => {
    const { container } = render(<LiveAdmin />);
    expect(await screen.findByRole('heading', { name: '홍길동' })).toBeVisible();
    expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeVisible();
    expect(container.querySelector('img')).toBeNull();
    expect(api.verifySession).toHaveBeenCalledOnce();
    expect(api.sessions).toHaveBeenCalled();
    expect(api.session).toHaveBeenCalledWith('session-1', expect.any(AbortSignal));
  });

  it('runs takeover and enables replies after the refreshed session enters admin mode', async () => {
    let adminMode = false;
    api.session.mockImplementation(() => Promise.resolve({ session: { ...detail, mode: adminMode ? 'admin' : 'ai' } }));
    api.takeover.mockImplementation(() => { adminMode = true; return Promise.resolve({ ok: true }); });
    render(<LiveAdmin />);
    fireEvent.click(await screen.findByRole('button', { name: '난입하기' }));
    await waitFor(() => expect(api.takeover).toHaveBeenCalledWith('session-1'));
    const reply = await screen.findByLabelText('고객에게 답장');
    await waitFor(() => expect(reply).toBeEnabled());
    fireEvent.change(reply, { target: { value: '확인했습니다.' } });
    fireEvent.click(screen.getByRole('button', { name: '전송' }));
    await waitFor(() => expect(api.sendMessage).toHaveBeenCalledWith('session-1', '확인했습니다.'));
  });
});
