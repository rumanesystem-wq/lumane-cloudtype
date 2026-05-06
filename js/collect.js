/* ================================================================
   수집현황 드로어 — 상담 진행에 따른 항목 수집 상태 표시
================================================================ */
import { COLLECT_MAP, TOTAL_ITEMS } from './config.js';

export function toggleCollect() {
  const drawer = document.getElementById('collectDrawer');
  const isOpen = drawer.classList.contains('open');
  // 수집현황 열 때 이전상담은 닫기
  if (!isOpen) {
    document.getElementById('historyDrawer').classList.remove('open');
  }
  drawer.classList.toggle('open');
}

/**
 * demoIdx: 루마네가 몇 번째 질문까지 했는지 (0-based)
 */
export function updateCollectDrawer(demoIdx) {
  const done = COLLECT_MAP[Math.min(demoIdx, 11)] || [];
  const allChips = document.querySelectorAll('.collect-chip');

  allChips.forEach(chip => {
    const key = chip.id.replace('cc-', '');
    chip.className = done.includes(key) ? 'collect-chip done' : 'collect-chip pending';
  });

  const pct = Math.round((done.length / TOTAL_ITEMS) * 100);
  document.getElementById('collectBar').style.width = pct + '%';
  document.getElementById('collectPct').textContent = pct + '%';

  const btn = document.getElementById('collectBtn');
  if (btn) btn.textContent = `📋 ${done.length}/${TOTAL_ITEMS}`;

  // 모두 수집되면 드로어 자동 열기
  if (done.length >= TOTAL_ITEMS) {
    document.getElementById('collectDrawer').classList.add('open');
  }
}

/** 새 상담 시 수집현황 초기화 */
export function resetCollect() {
  updateCollectDrawer(0);
  document.getElementById('collectDrawer').classList.remove('open');
  const resetBtn = document.getElementById('collectBtn');
  if (resetBtn) resetBtn.textContent = '📋 수집현황';
}
