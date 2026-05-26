import { useNavigate } from 'react-router-dom';

const DashboardHome = () => {
    const navigate = useNavigate();

    // 카드 메뉴 데이터
    const menus = [
        { id: 'learning', title: '📖 학습 (Learning)', desc: '시큐어코딩의 핵심 이론과 방어 기법을 학습합니다.', color: '#3b82f6', path: '/learning' },
        { id: 'practice', title: '💻 실습 (Practice)', desc: '다양한 웹 취약점 모의 해킹 및 방어 실습을 진행합니다.', color: '#10b981', path: '/practice' },
        { id: 'news', title: '📰 보안뉴스 (News)', desc: '최신 사이버 보안 동향과 해킹 사고 사례를 확인합니다.', color: '#f59e0b', path: '/news' },
        { id: 'mypage', title: '👤 마이페이지', desc: '내 학습 진도표 및 계정 정보를 관리합니다.', color: '#8b5cf6', path: '/mypage' }
    ];

    return (
        <div>
            <h2 style={{ marginBottom: '2rem', color: '#1e293b' }}>대시보드 메인</h2>

            {/* 카드 그리드 레이아웃 (화면 크기에 맞춰 카드가 나열됨) */}
            {/* 2x2 그리드로 깔끔하게 고정 */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '1.5rem',
                }}
            >    {menus.map((menu) => (
                <div
                    key={menu.id}
                    onClick={() => navigate(menu.path)}
                    style={{
                        backgroundColor: 'white',
                        borderTop: `4px solid ${menu.color}`,
                        borderRadius: '8px',
                        padding: '1.5rem',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        cursor: 'pointer',
                        transition: 'transform 0.2s',

                        // 추가
                        aspectRatio: '1 / 1',

                        // 내부 정렬용 (선택)
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    <h3 style={{ marginTop: 0, color: '#334155' }}>{menu.title}</h3>
                    <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: '1.5' }}>{menu.desc}</p>
                </div>
            ))}
            </div>
        </div>
    );
};

export default DashboardHome;
