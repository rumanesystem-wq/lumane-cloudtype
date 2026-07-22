import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Button, Feedback, ListDetailLayout } from '../../primitives';
import { useLiveAdmin } from './useLiveAdmin';

const formatTime = (value?: string) => value ? new Intl.DateTimeFormat('ko-KR', { hour: '2-digit', minute: '2-digit' }).format(new Date(value)) : '';

export function LiveAdmin() {
  const live = useLiveAdmin();
  const [draft, setDraft] = useState('');
  const messagesRef = useRef<HTMLDivElement>(null);
  const wasAtBottomRef = useRef(true);

  useEffect(() => {
    const element = messagesRef.current;
    if (element && wasAtBottomRef.current) element.scrollTop = element.scrollHeight;
  }, [live.detail?.messages.length]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const message = draft.trim();
    if (!message || live.mutating) return;
    await live.send(message);
    setDraft('');
  };

  if (live.authState === 'loading') return <Feedback title="관리자 세션 확인 중"><p>잠시만 기다려 주세요.</p></Feedback>;
  if (live.authState === 'error') return <Feedback kind="error" title="관리자 화면을 열 수 없습니다" onRetry={live.refresh}>{live.error}</Feedback>;

  return <>
    {live.error && <Feedback kind="error" title="요청을 완료하지 못했습니다" onRetry={live.refresh}>{live.error}</Feedback>}
    <ListDetailLayout
      list={<div className="live-list"><div className="detail-heading"><h2>실시간 상담</h2><span className="badge">{live.sessions.length}개</span></div>{live.sessions.length === 0 ? <p className="empty-copy">진행 중인 상담이 없습니다.</p> : <ul className="conversation-list">{live.sessions.map((session) => <li key={session.id}><button aria-pressed={live.selectedId === session.id} className={live.selectedId === session.id ? 'is-selected' : ''} onClick={() => live.select(session.id)}><span><strong>{session.nickname || session.customerName}</strong><small>{session.mode === 'admin' ? '담당자 상담 중' : 'AI 상담 중'} · 메시지 {session.messageCount}개</small>{session.unreadAdminCount > 0 && <span className="conversation-list__selected">고객 미확인 {session.unreadAdminCount}</span>}</span><time>{formatTime(session.lastMessageAt)}</time></button></li>)}</ul>}</div>}
      detail={!live.detail ? <div className="empty-panel"><h2>상담을 선택해 주세요</h2><p>새 상담이 들어오면 목록에 자동으로 표시됩니다.</p></div> : <div className="live-detail"><div className="detail-heading"><div><p className="eyebrow">실시간 상담</p><h2>{live.detail.nickname || live.detail.customerName}</h2></div><div className="detail-actions"><span className="badge">{live.detail.mode === 'admin' ? '담당자 상담 중' : 'AI 상담 중'}</span>{live.detail.mode === 'admin' ? <Button disabled={live.mutating} onClick={live.release}>AI에게 넘기기</Button> : <Button tone="primary" disabled={live.mutating} onClick={live.takeover}>난입하기</Button>}</div></div><div ref={messagesRef} className="live-messages" aria-live="polite" onScroll={(event) => { const element = event.currentTarget; wasAtBottomRef.current = element.scrollTop + element.clientHeight >= element.scrollHeight - 32; }}>{live.detail.messages.map((message, index) => <article className={`live-message live-message--${message.role === 'user' ? 'customer' : message.fromAdmin ? 'admin' : 'ai'}`} key={message.mid || `${message.time || message.ts}-${index}`}><strong>{message.role === 'user' ? '고객' : message.fromAdmin ? '담당자' : '루마네 AI'}</strong><p>{message.content}</p><time>{formatTime(message.time || message.ts)}</time></article>)}</div><form className="live-composer" onSubmit={submit}><label htmlFor="admin-reply">고객에게 답장</label><textarea id="admin-reply" value={draft} onChange={(event) => setDraft(event.target.value)} disabled={live.detail.mode !== 'admin' || live.mutating} maxLength={2000} rows={3} placeholder={live.detail.mode === 'admin' ? '답장을 입력하세요' : '난입 후 답장할 수 있습니다'} /><Button type="submit" tone="primary" loading={live.mutating} disabled={live.detail.mode !== 'admin' || !draft.trim()}>전송</Button></form></div>}
    />
  </>;
}
