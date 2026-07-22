import { useState } from 'react';
import { LiveAdmin } from './features/live/LiveAdmin';
import { MigrationPanel, WorkspaceShell, type WorkspaceArea } from './workspace/WorkspaceShell';

export function AdminApp() {
  const [area, setArea] = useState<WorkspaceArea>('home');
  return <WorkspaceShell active={area} onChange={setArea}>
    {area === 'home' && <HomeArea onOpen={setArea} />}
    {area === 'conversations' && <section aria-labelledby="conversation-title"><div className="workspace-page-heading"><div><p className="eyebrow">진행 상담부터 저장 상담까지 한곳에서</p><h2 id="conversation-title">상담 workspace</h2></div><div className="workspace-tabs" aria-label="상담 보기"><button aria-selected="true" role="tab">전체 상담</button><button disabled role="tab">미확인</button><button disabled role="tab">메모 있음</button></div></div><LiveAdmin /></section>}
    {area === 'quotes' && <MigrationPanel title="견적 업무" legacyLabel="견적 열기"><p>견적 검색·상태·담당자·상세 편집·출력·Excel 내보내기를 하나의 목록/상세 workspace로 이관합니다.</p><FeatureList items={['검색과 필터 상태 유지', '상담에서 견적 등록', '상세 편집과 이력 분리', '인쇄·Excel 내보내기']} /></MigrationPanel>}
    {area === 'analytics' && <MigrationPanel title="운영 분석" legacyLabel="통계 열기"><p>대시보드에 중복된 상담 통계와 방문자·유입 소스·토큰 비용을 한 영역으로 통합합니다.</p><FeatureList items={['방문·대화·견적 전환', '유입 소스 성과', '기간별 상담 추이', 'AI 토큰과 비용']} /></MigrationPanel>}
    {area === 'data' && <MigrationPanel title="데이터 관리" legacyLabel="휴지통·백업 열기"><p>복원 가능한 삭제와 영구삭제, 전체/테이블 백업을 위험도에 맞는 확인 흐름으로 묶습니다.</p><FeatureList items={['휴지통 조회와 복원', '대상 확인 후 영구삭제', '전체 ZIP 백업', '테이블 CSV 내보내기']} /></MigrationPanel>}
  </WorkspaceShell>;
}

function HomeArea({ onOpen }: { onOpen: (area: WorkspaceArea) => void }) {
  return <section aria-labelledby="home-title"><div className="workspace-page-heading"><div><p className="eyebrow">오늘 처리할 업무</p><h2 id="home-title">운영 홈</h2></div></div><div className="work-queue"><button onClick={() => onOpen('conversations')}><strong>미확인 상담</strong><span>진행·저장 상담을 한 목록에서 확인</span></button><button onClick={() => onOpen('quotes')}><strong>견적 후속 업무</strong><span>접수 상태와 담당자별 작업 확인</span></button><button onClick={() => onOpen('data')}><strong>데이터 안전</strong><span>휴지통과 최근 백업 상태 확인</span></button></div><section className="workspace-note"><h3>재구성 기준</h3><p>대시보드의 중복 상담 목록과 상세 통계는 각 업무 영역으로 이동하고, 홈에는 지금 처리할 항목만 남깁니다.</p></section></section>;
}

function FeatureList({ items }: { items: string[] }) {
  return <ul className="feature-list">{items.map((item) => <li key={item}>{item}</li>)}</ul>;
}
