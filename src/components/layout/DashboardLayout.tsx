import { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../services/api';
import logoImg from '../../assets/logo.png'

const DashboardLayout = () => {
    // Zustand 스토어에서 정보 꺼내오기
    const { username, expiresAt, logout, extendSession } = useAuthStore();
    const navigate = useNavigate();

    // 남은 시간을 초(Second) 단위로 저장하는 임시 State
    const [timeLeft, setTimeLeft] = useState<number>(0);

    // [1] 매 1초마다 남은 시간을 계산하는 핵심 로직
    useEffect(() => {
        if (!expiresAt) return;

        // 1초마다 실행되는 렌더링 타이머
        const timer = setInterval(() => {
            const now = Date.now();
            const distance = Math.floor((expiresAt - now) / 1000); // 밀리초 -> 초 변환

            if (distance <= 0) {
                // 시간이 0초가 되면 즉시 타이머를 멈추고 강제 로그아웃
                clearInterval(timer);
                handleLogout();
                alert("보안을 위해 30분 세션이 만료되어 자동 로그아웃 되었습니다.");
            } else {
                setTimeLeft(distance);
            }
        }, 1000);

        // 컴포넌트가 꺼질 때(페이지 이동 등) 메모리 누수를 방지하기 위해 타이머 찌꺼기 제거
        return () => clearInterval(timer);
    }, [expiresAt]); // expiresAt 값이 바뀔 때마다(로그인/연장 누를 때마다) 타이머 새로고침

    // 초(sec)를 분:초(MM:SS) 포맷으로 예쁘게 바꿔주는 함수
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const handleLogout = async () => {
        try {
            await api.post('/api/logout');
        } catch (error) {
            console.error("로그아웃 에러:", error);
        } finally {
            logout();
            navigate('/login');
        }
    };

    // [2] 연장 버튼 클릭 시 실행되는 통신 함수
    const handleExtend = async () => {
        try {
            const response = await api.post('/api/refresh');
            if (response.data.status === 'success') {
                // 백엔드에서 받은 새로운 만료 시각(30분 뒤)으로 스토어 업데이트
                extendSession(response.data.expires_at);
            }
        } catch (error) {
            console.error("연장 에러:", error);
            alert("세션 연장에 실패했습니다. 다시 로그인해주세요.");
            handleLogout();
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'sans-serif' }}>
            <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', color: '#334155', padding: '1rem 2rem', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <Link to="/" style={{ color: '#38bdf8', textDecoration: 'none', fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src={logoImg} alt="SECURECODE SPACE Logo" style={{ height: '98px', width: 'auto', objectFit: 'contain' }} />
                </Link>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <span style={{ fontSize: '0.9rem' }}>환영합니다, <strong>{username}</strong>님!</span>

                    {/* 타이머 및 연장 버튼 UI (시간이 5분 미만이면 글씨가 빨간색으로 변함) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#f1f5f9', padding: '0.3rem 0.8rem', borderRadius: '20px' }}>
                        <span style={{ fontWeight: 'bold', color: timeLeft < 300 ? '#ef4444' : '#10b981', fontFamily: 'monospace', fontSize: '1.1rem' }}>
                            {formatTime(timeLeft)}
                        </span>
                        <button
                            onClick={handleExtend}
                            style={{ padding: '0.2rem 0.6rem', backgroundColor: '#38bdf8', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                        >
                            연장
                        </button>
                    </div>

                    <button
                        onClick={handleLogout}
                        style={{ padding: '0.5rem 1rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        로그아웃
                    </button>
                </div>
            </nav>

            <main style={{ flex: 1, padding: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
                <Outlet />
            </main>
        </div>
    );
};

export default DashboardLayout;
