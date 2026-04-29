/* ================================================================
   공통 유틸리티 함수
================================================================ */

/** HTML 특수문자 이스케이프 (XSS 방지) */
export function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
}

/** 현재 시각 오전/오후 H:MM 문자열 (카톡 스타일) */
export function nowStr() {
  const d = new Date();
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const ap = h < 12 ? '오전' : '오후';
  const h12 = h % 12 || 12;
  return `${ap} ${h12}:${m}`;
}

/** 오늘 날짜 'YYYY년 M월 D일' 문자열 */
export function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}
