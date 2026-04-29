/* ================================================================
   답장(Reply) — 인용 메시지 상태 관리
================================================================ */

let pendingReply = null; // { mid, role, text }

export function getPendingReply() { return pendingReply; }

export function setPendingReply(mid, role, text) {
  pendingReply = { mid, role, text };
  renderReplyBar(role, text);
}

export function clearPendingReply() {
  pendingReply = null;
  const bar = document.getElementById('replyBar');
  if (bar) bar.style.display = 'none';
}

function renderReplyBar(role, text) {
  const bar = document.getElementById('replyBar');
  if (!bar) return;

  const preview = text.length > 60 ? text.slice(0, 60) + '…' : text;
  const who = role === 'user' ? '내 메시지' : '루마네';

  bar.innerHTML = `
    <div class="rb-line"></div>
    <div class="rb-content">
      <div class="rb-who">${who}</div>
      <div class="rb-preview">${escReply(preview)}</div>
    </div>
    <button class="rb-close" id="replyBarClose">✕</button>
  `;
  bar.style.display = 'flex';
  document.getElementById('replyBarClose').addEventListener('click', clearPendingReply);
}

/* 답장 말풍선 내 인용 영역 DOM 생성 */
export function buildQuoteDom(replyTo, isUserBubble) {
  if (!replyTo) return null;
  const q = document.createElement('div');
  q.className = 'reply-quote' + (isUserBubble ? ' reply-quote-user' : '');
  const who = replyTo.role === 'user' ? '내 메시지' : '루마네';
  const preview = replyTo.text.length > 50 ? replyTo.text.slice(0, 50) + '…' : replyTo.text;
  q.innerHTML = `<span class="rq-who">${who}</span><span class="rq-text">${escReply(preview)}</span>`;
  return q;
}

function escReply(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, ' ');
}
