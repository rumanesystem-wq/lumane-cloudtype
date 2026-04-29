/* ================================================================
   메시지 액션 — 삭제 / 수정 상태 관리
================================================================ */

let editingMid = null; // 수정 중인 메시지 ID

export function getEditingMid() { return editingMid; }

export function startEdit(mid, text, onFill) {
  cancelEdit();
  editingMid = mid;

  /* 수정 중 표시 바 */
  const bar = document.getElementById('editBar');
  if (bar) {
    const preview = text.length > 50 ? text.slice(0, 50) + '…' : text;
    bar.innerHTML = `
      <div class="eb-line"></div>
      <div class="eb-content">
        <div class="eb-label">✏️ 메시지 수정 중</div>
        <div class="eb-preview">${escAct(preview)}</div>
      </div>
      <button class="eb-close" id="editBarClose">✕</button>
    `;
    bar.style.display = 'flex';
    document.getElementById('editBarClose').addEventListener('click', cancelEdit);
  }

  /* 수정 중인 말풍선 하이라이트 */
  document.querySelectorAll('.msg-group').forEach(el => el.classList.remove('msg-editing'));
  const target = document.querySelector(`.msg-group[data-mid="${mid}"]`);
  if (target) target.classList.add('msg-editing');

  onFill(text); // 입력창에 기존 텍스트 채우기
}

export function cancelEdit() {
  editingMid = null;
  const bar = document.getElementById('editBar');
  if (bar) bar.style.display = 'none';
  document.querySelectorAll('.msg-editing').forEach(el => el.classList.remove('msg-editing'));
}

export function applyEditToDom(mid, newText) {
  const group = document.querySelector(`.msg-group[data-mid="${mid}"]`);
  if (!group) return;
  const bubble = group.querySelector('.bubble.user');
  if (bubble) {
    bubble.innerHTML = escAct(newText);
    /* 수정됨 표시 */
    const edited = group.querySelector('.msg-edited');
    if (!edited) {
      const timeEl = group.querySelector('.msg-time');
      if (timeEl) {
        const mark = document.createElement('span');
        mark.className = 'msg-edited';
        mark.textContent = '(수정됨)';
        timeEl.parentElement.insertBefore(mark, timeEl);
      }
    }
  }
  group.classList.remove('msg-editing');
}

export function deleteFromDom(mid) {
  const group = document.querySelector(`.msg-group[data-mid="${mid}"]`);
  if (group) {
    group.style.transition = 'opacity .2s';
    group.style.opacity = '0';
    setTimeout(() => group.remove(), 200);
  }
}

function escAct(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
}
