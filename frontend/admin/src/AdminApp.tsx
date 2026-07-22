import { AppShell } from './primitives';
import { LiveAdmin } from './features/live/LiveAdmin';

export function AdminApp() {
  return <AppShell navigation={{ brand: { href: '/admin', label: 'Kate Blanc' }, items: [{ href: '#live', label: '실시간 상담', current: true }] }}><header className="page-header"><div><p className="eyebrow">Admin</p><h1>상담 관리</h1><p>진행 중인 고객 상담을 확인하고 직접 응대합니다.</p></div></header><section id="live"><LiveAdmin /></section></AppShell>;
}
