import { Outlet, Link, useLocation } from 'react-router-dom';

const NotesLayout = () => {
    const location = useLocation();

    // 사이드바 메뉴 데이터
    const menus = [
        {
            category: "대시보드",
            items: [
                { title: "연구 요약", path: "/notes/executive_summary" },
                { title: "핵심 품질 지표", path: "/notes/metrics" },
                { title: "품질 평가 결과", path: "/notes/evaluation_records" },
            ]
        },
        {
            category: "연구 및 실험",
            items: [
                { title: "주차별 타임라인", path: "/notes/timeline" },
                { title: "AI 실험 이력", path: "/notes/experiments" },
            ]
        },
        {
            category: "프롬프트 관리",
            items: [
                { title: "프롬프트 목록", path: "/notes/prompt_list" },
                { title: "버전 변경 이력", path: "/notes/versions" },
            ]
        },
        {
            category: "산출물 및 보고서",
            items: [
                { title: "시큐어코딩 문제 은행", path: "/notes/problem_bank" },
                { title: "Reviewer 평가 기준", path: "/notes/reviewer_scorecard" },
                { title: "시스템 구조도", path: "/notes/architecture" },
                { title: "전체 산출물 탐색기", path: "/notes/manifest" },
            ]
        }
    ];

    return (
        <div style={{ display: 'flex', gap: '2rem', minHeight: 'calc(100vh - 120px)' }}>
            {/* 좌측 슬림 사이드바 */}
            <aside style={{
                width: '240px',
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '1.5rem 1rem',
                boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
                flexShrink: 0
            }}>
                <h3 style={{ margin: '0 0 1rem 0.5rem', color: '#1e293b', fontSize: '1.2rem' }}>📝 연구 노트</h3>
                
                {menus.map((section, idx) => (
                    <div key={idx}>
                        <h4 style={{ margin: '0 0 0.5rem 0.5rem', color: '#94a3b8', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                            {section.category}
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            {section.items.map((item) => {
                                const isActive = location.pathname === item.path || (item.path !== '/notes' && location.pathname.startsWith(item.path));
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        style={{
                                            textDecoration: 'none',
                                            padding: '0.6rem 0.8rem',
                                            borderRadius: '6px',
                                            color: isActive ? '#ef4444' : '#475569',
                                            backgroundColor: isActive ? '#fef2f2' : 'transparent',
                                            fontWeight: isActive ? 'bold' : 'normal',
                                            fontSize: '0.95rem',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isActive) e.currentTarget.style.backgroundColor = '#f1f5f9';
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                                        }}
                                    >
                                        {item.title}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </aside>

            {/* 우측 메인 콘텐츠 영역 (Web IDE 등) */}
            <section style={{ flex: 1, backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <Outlet />
            </section>
        </div>
    );
};

export default NotesLayout;
