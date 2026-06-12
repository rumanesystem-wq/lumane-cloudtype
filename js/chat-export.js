/* ================================================================
   chat-export.js — 대화 내용 저장 (D-약 + A)

   - A: 현재 대화 .txt 다운로드
   - D-약: "다시 보기 링크" 클립보드 복사 (같은 브라우저 visitor_key 자동 매칭)

   window.* 노출: toggleExportMenu, copyChatLink, downloadChatText
   의존: 없음 (DOM + localStorage만 사용)
================================================================ */

function _now() {
  const d = new Date();
  const pad = n => String(n).padStart(2, '0');
  return {
    file: `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`,
    human: `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

/* ================ 메뉴 토글 ================ */
let _outsideHandler = null;
window.toggleExportMenu = function() {
  const menu = document.getElementById('exportMenu');
  if (!menu) return;
  const opening = menu.style.display === 'none' || menu.style.display === '';
  menu.style.display = opening ? 'block' : 'none';

  // 이전 리스너는 항상 먼저 정리 (중복 등록 방지)
  if (_outsideHandler) {
    document.removeEventListener('click', _outsideHandler);
    _outsideHandler = null;
  }

  if (opening) {
    setTimeout(() => {
      _outsideHandler = (e) => {
        if (!e.target.closest('.h-export-wrap')) {
          menu.style.display = 'none';
          document.removeEventListener('click', _outsideHandler);
          _outsideHandler = null;
        }
      };
      document.addEventListener('click', _outsideHandler);
    }, 0);
  }
};

/* ================ D-약: 다시 보기 링크 복사 ================ */
window.copyChatLink = async function() {
  const menu = document.getElementById('exportMenu');
  if (menu) menu.style.display = 'none';

  // 현재 페이지 URL (쿼리·해시 제거 — 깔끔하게)
  const url = `${location.origin}${location.pathname}`;

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(url);
    } else {
      // fallback: 임시 textarea 사용
      const ta = document.createElement('textarea');
      ta.value = url;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    alert('🔗 다시 보기 링크가 복사되었습니다.\n\n카톡 "나에게 보내기"로 저장해두면\n같은 폰·브라우저에서 다시 들어올 때\n이전 대화를 자동으로 불러옵니다.\n\n※ 다른 기기에서는 새 대화로 시작됩니다.');
  } catch (err) {
    console.warn('[chat-export] 링크 복사 실패:', err);
    prompt('아래 주소를 길게 눌러 복사하세요:', url);
  }
};

/* ================ A: 텍스트 다운로드 ================ */
function _extractMessages() {
  const root = document.getElementById('messages');
  if (!root) return [];

  // ui.js addMsg가 생성하는 실제 구조: .msg-group.bot / .msg-group.user
  // 본문은 .bubble (한 메시지에 .bubble 여러 개 존재 가능 — 문단 분리)
  const groups = root.querySelectorAll('.msg-group');
  const rows = [];

  groups.forEach(g => {
    const role = g.classList.contains('user') ? '고객'
              : g.classList.contains('bot')  ? '루마네'
              : '';
    const bubbles = g.querySelectorAll('.bubble');
    const parts = [];
    bubbles.forEach(b => {
      const t = (b.textContent || '').trim();
      if (t) parts.push(t);
    });
    const text = parts.join('\n');
    if (text) rows.push({ role, text });
  });

  return rows;
}

window.downloadChatText = function() {
  const menu = document.getElementById('exportMenu');
  if (menu) menu.style.display = 'none';

  const rows = _extractMessages();
  if (rows.length === 0) {
    alert('저장할 대화 내용이 없습니다.');
    return;
  }

  const t = _now();
  const header = [
    '═══════════════════════════════════════',
    '   케이트블랑 드레스룸 — 루마네 상담 기록',
    `   저장 시각: ${t.human}`,
    '═══════════════════════════════════════',
    '',
  ].join('\n');

  const body = rows.map(r => {
    const tag = r.role ? `[${r.role}]` : '';
    return `${tag}\n${r.text}\n`;
  }).join('\n');

  const footer = [
    '',
    '═══════════════════════════════════════',
    '   ※ 본 견적은 상담 시점 기준이며,',
    '      실측 후 변동될 수 있습니다.',
    '   문의: 010-3784-5215',
    '═══════════════════════════════════════',
  ].join('\n');

  const blob = new Blob([header + body + footer], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `루마네_상담_${t.file}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
