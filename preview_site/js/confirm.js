/* ================================================================
   견적 접수 확인 화면 + 완료 화면
================================================================ */
import { esc } from './utils.js';

let pendingQuote = null;

/* ── 견적 요청 확인 화면 표시 ── */
export function showConfirm(quote) {
  document.getElementById('chatView').style.display  = 'none';
  document.getElementById('doneView').classList.remove('show');
  document.getElementById('confirmView').classList.add('show');

  pendingQuote = quote;

  const info  = quote.고객정보 || {};
  const size  = info.공간사이즈 || {};

  let sizeStr = '-';
  if (typeof info.공간사이즈 === 'string' && info.공간사이즈) {
    sizeStr = info.공간사이즈;
  } else if (size.raw && size.raw !== '-') {
    sizeStr = size.raw;
  } else if (size.가로mm && size.가로mm !== '-') {
    sizeStr = `${size.가로mm} × ${size.세로mm} × ${size.높이mm} mm`;
  }

  const opts = Array.isArray(info.추가옵션)
    ? info.추가옵션.join(', ')
    : (info.추가옵션 || null);

  function cfRow(lbl, val, badgeClass = '') {
    if (!val || val === '-' || /^없어요$|^없음$/.test(String(val).trim())) return '';
    const v = badgeClass
      ? `<span class="rc-val ${badgeClass}">${esc(String(val))}</span>`
      : `<span class="rc-val">${esc(String(val))}</span>`;
    return `<div class="rc-row"><span class="rc-lbl">${esc(String(lbl))}</span>${v}</div>`;
  }

  document.getElementById('confirmCard').innerHTML = `
    <div class="rc-head">
      <span class="rc-title">📝 견적 요청서</span>
      <span style="font-size:12px;color:var(--gray-400);font-weight:500">접수 대기</span>
    </div>

    <div class="rc-section">
      <div class="rc-section-title">기본 정보</div>
      ${cfRow('이름',     info.이름)}
      ${cfRow('연락처',   info.연락처)}
      ${cfRow('설치지역', info.설치지역)}
    </div>

    <div class="rc-section">
      <div class="rc-section-title">공간 정보</div>
      ${cfRow('공간 사이즈', sizeStr)}
      ${cfRow('드레스룸 형태', info.형태 || info.공간형태)}
    </div>

    ${(opts || info.프레임색상 || info.선반색상 || info.요청사항 || info.개인정보동의) ? `
    <div class="rc-section">
      <div class="rc-section-title">선택 정보</div>
      ${cfRow('추가 옵션',   opts)}
      ${cfRow('프레임 색상', info.프레임색상)}
      ${cfRow('선반 색상',   info.선반색상)}
      ${cfRow('요청사항',    info.요청사항)}
      ${cfRow('첨부파일',    info.첨부파일 || null)}
      ${cfRow('개인정보 동의', info.개인정보동의)}
    </div>` : ''}

    <div class="rc-section">
      <div class="rc-section-title">접수 정보</div>
      <div class="rc-row">
        <span class="rc-lbl">현재 상태</span>
        <span class="rc-val" style="color:#92400e;background:#fef3c7;padding:2px 10px;border-radius:20px;font-size:12px;font-weight:700">접수 대기</span>
      </div>
      <div class="rc-row"><span class="rc-lbl">접수 경로</span><span class="rc-val">AI 루마네 채팅상담</span></div>
      <div class="rc-row"><span class="rc-lbl">안내</span><span class="rc-val" style="font-size:12px;font-weight:500;color:var(--gray-600)">접수 후 담당자가 연락 드립니다</span></div>
    </div>`;
}

/* ── 수정하기 → 채팅 화면으로 복귀 ── */
export function confirmBack() {
  document.getElementById('confirmView').classList.remove('show');
  document.getElementById('chatView').style.display = 'flex';
  pendingQuote = null;
}

/* ── 접수하기 → 완료 화면으로 전환 ── */
export function confirmSubmit() {
  if (!pendingQuote) return;
  document.getElementById('confirmView').classList.remove('show');

  pendingQuote.접수번호 = pendingQuote.접수번호 || ('KB-' + String(Math.floor(Math.random() * 9000) + 1000));
  pendingQuote.접수시간 = new Date().toISOString();
  pendingQuote.상태     = '접수완료';

  showDone(pendingQuote);
  pendingQuote = null;
}

/* ── 완료 화면 표시 ── */
export function showDone(quote) {
  document.getElementById('chatView').style.display = 'none';
  document.getElementById('confirmView').classList.remove('show');
  document.getElementById('doneView').classList.add('show');

  const info  = quote.고객정보 || {};
  const size  = info.공간사이즈 || {};
  const now   = new Date(quote.접수시간 || Date.now()).toLocaleString('ko-KR');

  let sizeStr = '-';
  if (typeof info.공간사이즈 === 'string' && info.공간사이즈) {
    sizeStr = info.공간사이즈;
  } else if (size.가로mm) {
    sizeStr = `${size.가로mm} × ${size.세로mm} × ${size.높이mm} mm`;
  }

  const opts = Array.isArray(info.추가옵션)
    ? info.추가옵션.join(', ')
    : (info.추가옵션 || null);

  function rcRow(lbl, val, badge = false) {
    if (!val || val === '-' || val === '없음') return '';
    const v = badge
      ? `<span class="rc-val badge">${esc(String(val))}</span>`
      : `<span class="rc-val">${esc(String(val))}</span>`;
    return `<div class="rc-row"><span class="rc-lbl">${esc(String(lbl))}</span>${v}</div>`;
  }

  document.getElementById('receipt').innerHTML = `
    <div class="rc-head">
      <span class="rc-title">📋 접수 정보 요약</span>
      <span class="rc-num">${esc(String(quote.접수번호 || 'KB-0001'))}</span>
    </div>

    <div class="rc-section">
      <div class="rc-section-title">필수 항목</div>
      ${rcRow('현재상태', '접수완료', true)}
      ${rcRow('이름',       info.이름)}
      ${rcRow('연락처',     info.연락처)}
      ${rcRow('설치지역',   info.설치지역)}
      ${rcRow('공간사이즈', sizeStr)}
      ${rcRow('드레스룸 형태', info.형태 || info.공간형태)}
    </div>

    ${(opts || info.프레임색상 || info.선반색상 || info.요청사항) ? `
    <div class="rc-section">
      <div class="rc-section-title">선택 항목</div>
      ${rcRow('추가옵션',   opts)}
      ${rcRow('프레임색상', info.프레임색상)}
      ${rcRow('선반색상',   info.선반색상)}
      ${rcRow('요청사항',   info.요청사항)}
      ${rcRow('개인정보동의', info.개인정보동의)}
    </div>` : ''}

    <div class="rc-section">
      <div class="rc-section-title">접수 정보</div>
      <div class="rc-row"><span class="rc-lbl">접수번호</span><span class="rc-val">${esc(String(quote.접수번호 || 'KB-0001'))}</span></div>
      <div class="rc-row"><span class="rc-lbl">접수일시</span><span class="rc-val" style="font-size:12px;font-weight:500">${now}</span></div>
      <div class="rc-row"><span class="rc-lbl">접수경로</span><span class="rc-val">AI 루마네 채팅상담</span></div>
    </div>`;
}
