import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

const Home = () => {
    const username = useAuthStore((state) => state.username);
    const logout = useAuthStore((state) => state.logout);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '100px', fontFamily: 'sans-serif' }}>
            <h1 style={{ color: '#4CAF50' }}>{username}님 환영합니다! 🎉</h1>
            <p>로그인이 성공적으로 완료되었습니다.</p>

            <button onClick={handleLogout} style={{ marginTop: '30px', padding: '10px 20px', cursor: 'pointer' }}>
                로그아웃
            </button>
        </div>
    );
};

export default Home;
