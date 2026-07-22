import { useCallback, useEffect, useRef, useState } from 'react';
import { AdminApiError, adminApi, type AdminSessionDetail, type AdminSessionSummary } from '../../api/client';

type LoadState = 'loading' | 'ready' | 'error';

export function useLiveAdmin() {
  const [authState, setAuthState] = useState<LoadState>('loading');
  const [sessions, setSessions] = useState<AdminSessionSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminSessionDetail | null>(null);
  const [error, setError] = useState('');
  const [mutating, setMutating] = useState(false);
  const selectedIdRef = useRef<string | null>(null);
  const requestSequence = useRef(0);

  useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    const sequence = ++requestSequence.current;
    try {
      const listPayload = await adminApi.sessions(signal);
      if (signal?.aborted || sequence !== requestSequence.current) return;
      setSessions(listPayload.sessions);
      const currentId = selectedIdRef.current;
      const nextId = currentId && listPayload.sessions.some((session) => session.id === currentId)
        ? currentId
        : listPayload.sessions[0]?.id ?? null;
      if (nextId !== currentId) setSelectedId(nextId);
      if (!nextId) {
        setDetail(null);
        setError('');
        return;
      }
      const detailPayload = await adminApi.session(nextId, signal);
      if (signal?.aborted || sequence !== requestSequence.current || selectedIdRef.current && selectedIdRef.current !== nextId) return;
      setDetail(detailPayload.session);
      setError('');
    } catch (reason) {
      if (signal?.aborted) return;
      if (reason instanceof AdminApiError && reason.status === 401) {
        window.location.replace('/admin');
        return;
      }
      setError(reason instanceof Error ? reason.message : '상담을 불러오지 못했습니다.');
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    adminApi.verifySession(controller.signal).then(() => {
      if (controller.signal.aborted) return;
      setAuthState('ready');
      void refresh(controller.signal);
    }).catch((reason) => {
      if (controller.signal.aborted) return;
      if (reason instanceof AdminApiError && reason.status === 401) window.location.replace('/admin');
      else { setAuthState('error'); setError(reason instanceof Error ? reason.message : '관리자 세션을 확인하지 못했습니다.'); }
    });
    return () => controller.abort();
  }, [refresh]);

  useEffect(() => {
    if (authState !== 'ready') return;
    let controller = new AbortController();
    const poll = () => {
      if (document.hidden) return;
      controller.abort();
      controller = new AbortController();
      void refresh(controller.signal);
    };
    const timer = window.setInterval(poll, 2000);
    document.addEventListener('visibilitychange', poll);
    return () => { window.clearInterval(timer); controller.abort(); document.removeEventListener('visibilitychange', poll); };
  }, [authState, refresh]);

  useEffect(() => {
    if (authState !== 'ready' || !selectedId) return;
    const controller = new AbortController();
    void refresh(controller.signal);
    return () => controller.abort();
  }, [authState, refresh, selectedId]);

  const runMutation = useCallback(async (action: () => Promise<unknown>) => {
    setMutating(true);
    setError('');
    try { await action(); await refresh(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : '요청을 처리하지 못했습니다.'); }
    finally { setMutating(false); }
  }, [refresh]);

  return {
    authState, detail, error, mutating, refresh: () => refresh(), selectedId, sessions,
    select: setSelectedId,
    takeover: () => selectedId && runMutation(() => adminApi.takeover(selectedId)),
    release: () => selectedId && runMutation(() => adminApi.release(selectedId)),
    send: (message: string) => selectedId ? runMutation(() => adminApi.sendMessage(selectedId, message)) : Promise.resolve(),
  };
}
