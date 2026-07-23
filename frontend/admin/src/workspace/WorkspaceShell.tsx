import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

export type WorkspaceArea = 'home' | 'conversations' | 'quotes' | 'analytics' | 'data';

const areas: Array<{ id: WorkspaceArea; label: string; description: string }> = [
  { id: 'home', label: '홈', description: '처리할 업무와 오늘 현황' },
  { id: 'conversations', label: '상담', description: '진행 중 상담과 고객 응대' },
  { id: 'quotes', label: '견적', description: '접수·편집·출력·내보내기' },
  { id: 'analytics', label: '분석', description: '방문·전환·유입·AI 비용' },
  { id: 'data', label: '데이터 관리', description: '휴지통·복원·백업' },
];

export function WorkspaceShell({ active, children, onChange }: { active: WorkspaceArea; children: ReactNode; onChange: (area: WorkspaceArea) => void }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia?.('(max-width: 768px)').matches ?? false);
  const sidebarRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const current = areas.find((area) => area.id === active)!;
  const select = (area: WorkspaceArea) => { onChange(area); setMobileOpen(false); };

  useEffect(() => {
    if (!window.matchMedia) return;
    const media = window.matchMedia('(max-width: 768px)');
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    document.body.classList.add('has-mobile-menu');
    sidebarRef.current?.querySelector<HTMLElement>('button, a')?.focus();
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.classList.remove('has-mobile-menu');
      document.removeEventListener('keydown', closeOnEscape);
      menuButtonRef.current?.focus();
    };
  }, [mobileOpen]);

  const trapSidebarFocus = (event: KeyboardEvent<HTMLElement>) => {
    if (!mobileOpen || event.key !== 'Tab') return;
    const focusable = [...event.currentTarget.querySelectorAll<HTMLElement>('button, a[href]')];
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  };

  return <div className="workspace-shell">
    <aside ref={sidebarRef} id="workspace-navigation" className={`workspace-sidebar ${mobileOpen ? 'is-open' : ''}`} aria-label="관리자 업무 영역" aria-modal={isMobile && mobileOpen ? true : undefined} inert={isMobile && !mobileOpen ? true : undefined} onKeyDown={trapSidebarFocus} role={isMobile && mobileOpen ? 'dialog' : undefined}>
      <div className="workspace-brand"><strong>Kate Blanc</strong><span>관리자 workspace</span></div>
      <nav>{areas.map((area) => <button key={area.id} aria-current={active === area.id ? 'page' : undefined} onClick={() => select(area.id)}><strong>{area.label}</strong><span>{area.description}</span></button>)}</nav>
      <div className="workspace-sidebar__footer"><a href="/admin">기존 관리자 화면</a></div>
    </aside>
    {mobileOpen && <button className="workspace-backdrop" aria-label="메뉴 닫기" onClick={() => setMobileOpen(false)} />}
    <div className="workspace-main">
      <header className="workspace-header"><button ref={menuButtonRef} className="workspace-menu" aria-label="메뉴 열기" aria-controls="workspace-navigation" aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)}>☰</button><div><p className="eyebrow">{current.description}</p><h1>{current.label}</h1></div><div className="workspace-header__actions"><a href="/chat.html" target="_blank" rel="noreferrer">고객 채팅</a><a href="/" target="_blank" rel="noreferrer">사이트 보기</a></div></header>
      <main id="workspace-content" className="workspace-content">{children}</main>
    </div>
  </div>;
}

export function MigrationPanel({ children, legacyHref, legacyLabel, title }: { children: ReactNode; legacyHref: string; legacyLabel: string; title: string }) {
  return <section className="migration-panel"><div><p className="eyebrow">기능 정리 중</p><h2>{title}</h2>{children}</div><a className="button button--secondary" href={legacyHref}>기존 화면에서 {legacyLabel}</a></section>;
}
