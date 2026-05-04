/* ================================================================
   공통 유틸리티 함수
================================================================ */

/** HTML 특수문자 이스케이프 (텍스트 노드용, \n → <br>) */
export function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
}

/** HTML 속성값 이스케이프 (onclick/href 등 속성 안에 넣을 때 사용, \n 변환 없음) */
export function escAttr(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function _fmt(d) {
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h < 12 ? '오전' : '오후'} ${h % 12 || 12}:${m}`;
}

/** ISO 문자열 또는 Date → 오전/오후 H:MM 문자열 (카톡 스타일) */
export function tsToStr(dt) {
  try {
    const d = (dt instanceof Date) ? dt : new Date(dt);
    return isNaN(d.getTime()) ? _fmt(new Date()) : _fmt(d);
  } catch {
    return _fmt(new Date());
  }
}

/** 현재 시각 오전/오후 H:MM 문자열 (카톡 스타일) */
export function nowStr() { return _fmt(new Date()); }

/** 오늘 날짜 'YYYY년 M월 D일' 문자열 */
export function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}
