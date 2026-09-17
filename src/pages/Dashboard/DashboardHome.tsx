import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import './DashboardHome.css';

const commonMenus = [
  { id: 'learning', title: '📖 학습 (Learning)', desc: '시큐어코딩의 핵심 이론과 방어 기법을 학습합니다.', color: '#3b82f6', path: '/learning' },
  { id: 'practice', title: '💻 실습 (Practice)', desc: '다양한 웹 취약점 모의 해킹 및 방어 실습을 진행합니다.', color: '#10b981', path: '/practice' },
  { id: 'news', title: '📰 보안뉴스 (News)', desc: '최신 사이버 보안 동향과 해킹 사고 사례를 확인합니다.', color: '#f59e0b', path: '/news' },
  { id: 'mypage', title: '👤 마이페이지', desc: '내 학습 진도표 및 계정 정보를 관리합니다.', color: '#8b5cf6', path: '/mypage' },
];

const adminMenus = [
  { id: 'notes', title: '📝 연구 노트 (Notes)', desc: '생성형 AI 시큐어코딩 출제 실험 및 실행 결과를 확인합니다.', color: '#ef4444', path: '/notes/research' },
  { id: 'signup-requests', title: '✅ 회원가입 승인', desc: '대기 중인 회원가입 신청을 확인하고 승인합니다.', color: '#0f766e', path: '/admin/signup-requests' },
  { id: 'audit-logs', title: '🛡️ 보안 감사 로그', desc: '관리자와 계정 보안 관련 주요 작업 이력을 확인합니다.', color: '#4338ca', path: '/admin/audit-logs' },
];

type DashboardMenu = (typeof commonMenus)[number];

const DashboardHome = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/api/user/profile');
        if (res.data.status === 'success') {
          setRole(res.data.data.role);
        }
      } catch (error) {
        console.error('프로필 정보(권한) 조회 실패:', error);
      }
    };
    void fetchProfile();
  }, []);

  const renderMenus = (menus: DashboardMenu[]) => (
    <div className="dashboard-home__grid">
      {menus.map((menu) => (
        <button
          className="dashboard-home__card"
          key={menu.id}
          onClick={() => navigate(menu.path)}
          style={{ borderTopColor: menu.color }}
          type="button"
        >
          <h3>{menu.title}</h3>
          <p>{menu.desc}</p>
        </button>
      ))}
    </div>
  );

  return (
    <div className="dashboard-home">
      <section aria-labelledby="dashboard-title" className="dashboard-home__section">
        <h2 id="dashboard-title">대시보드</h2>
        {renderMenus(commonMenus)}
      </section>

      {role === 'ADMIN' && (
        <section aria-labelledby="admin-dashboard-title" className="dashboard-home__section">
          <h2 id="admin-dashboard-title">대시보드 - 관리자용</h2>
          {renderMenus(adminMenus)}
        </section>
      )}
    </div>
  );
};

export default DashboardHome;
