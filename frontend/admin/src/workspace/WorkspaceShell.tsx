import { useState, type ReactNode } from 'react';

export type WorkspaceArea = 'home' | 'conversations' | 'quotes' | 'analytics' | 'data';

const areas: Array<{ id: WorkspaceArea; label: string; description: string }> = [
  { id: 'home', label: '홈', description: '처리할 업무와 오늘 현황' },
  { id: 'conversations', label: '상담', description: '진행·저장 상담과 고객 응대' },
  { id: 'quotes', label: '견적', description: '접수·편집·출력·내보내기' },
  { id: 'analytics', label: '분석', description: '방문·전환·유입·AI 비용' },
  { id: 'data', label: '데이터 관리', description: '휴지통·복원·백업' },
];

export function WorkspaceShell({ active, children, onChange }: { active: WorkspaceArea; children: ReactNode; onChange: (area: WorkspaceArea) => void }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const current = areas.find((area) => area.id === active)!;
  const select = (area: WorkspaceArea) => { onChange(area); setMobileOpen(false); };
  return <div className="workspace-shell">
    <aside className={`workspace-sidebar ${mobileOpen ? 'is-open' : ''}`} aria-label="관리자 업무 영역">
      <div className="workspace-brand"><strong>Kate Blanc</strong><span>관리자 workspace</span></div>
      <nav>{areas.map((area) => <button key={area.id} aria-current={active === area.id ? 'page' : undefined} onClick={() => select(area.id)}><strong>{area.label}</strong><span>{area.description}</span></button>)}</nav>
      <div className="workspace-sidebar__footer"><a href="/admin">기존 관리자 화면</a></div>
    </aside>
    {mobileOpen && <button className="workspace-backdrop" aria-label="메뉴 닫기" onClick={() => setMobileOpen(false)} />}
    <div className="workspace-main">
      <header className="workspace-header"><button className="workspace-menu" aria-label="메뉴 열기" onClick={() => setMobileOpen(true)}>☰</button><div><p className="eyebrow">{current.description}</p><h1>{current.label}</h1></div><div className="workspace-header__actions"><a href="/chat.html" target="_blank" rel="noreferrer">고객 채팅</a><a href="/" target="_blank" rel="noreferrer">사이트 보기</a></div></header>
      <main id="workspace-content" className="workspace-content">{children}</main>
    </div>
  </div>;
}

export function MigrationPanel({ children, legacyLabel, title }: { children: ReactNode; legacyLabel: string; title: string }) {
  return <section className="migration-panel"><div><p className="eyebrow">기능 정리 중</p><h2>{title}</h2>{children}</div><a className="button button--secondary" href="/admin">기존 화면에서 {legacyLabel}</a></section>;
}
