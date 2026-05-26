import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import logoImg from '../../assets/logo.png'

const DashboardLayout = () => {
    const username = useAuthStore((state) => state.username);
    const logout = useAuthStore((state) => state.logout);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'sans-serif' }}>
            {/* 1. 상단 네비게이션 바 (Top Navbar) */}
            <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', color: '#334155', padding: '1rem 2rem', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>    <Link to="/" style={{ color: '#38bdf8', textDecoration: 'none', fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img
                    src={logoImg}
                    alt="SECURECODE SPACE Logo"
                    style={{ height: '98px', width: 'auto', objectFit: 'contain' }}
                /></Link>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <span style={{ fontSize: '0.9rem' }}>환영합니다, <strong>{username}</strong>님!</span>
                    <button
                        onClick={handleLogout}
                        style={{ padding: '0.5rem 1rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        로그아웃
                    </button>
                </div>
            </nav>

            {/* 2. 메인 콘텐츠 영역 (하위 페이지들이 열리는 곳) */}
            <main style={{ flex: 1, padding: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
                <Outlet />
            </main>
        </div>
    );
};

export default DashboardLayout;
