import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

const Login = () => {
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');

    const login = useAuthStore((state) => state.login);
    const navigate = useNavigate();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // 가짜(Mock) 로그인: 아이디와 비밀번호가 있으면 성공으로 간주
        if (userId && password) {
            login(userId); // Zustand에 유저명 저장
            navigate('/'); // 메인 화면으로 리다이렉트
        } else {
            alert('아이디와 비밀번호를 입력해주세요.');
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '100px', fontFamily: 'sans-serif' }}>
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '300px' }}>
                <h2 style={{ textAlign: 'center' }}>로그인</h2>
                <input
                    type="text"
                    placeholder="아이디"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    style={{ padding: '10px' }}
                />
                <input
                    type="password"
                    placeholder="비밀번호"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ padding: '10px' }}
                />
                <button type="submit" style={{ padding: '10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer' }}>
                    로그인
                </button>
            </form>
        </div>
    );
};

export default Login;
