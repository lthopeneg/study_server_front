import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../services/api'; // 방금 만든 api 인스턴스 가져오기

const Login = () => {
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');

    const login = useAuthStore((state) => state.login);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!userId || !password) {
            alert('아이디와 비밀번호를 모두 입력해주세요.');
            return;
        }

        try {
            // 플라스크 백엔드로 진짜 로그인 API 요청 보내기!
            const response = await api.post('/api/login', {
                userId,
                password
            });

            // 파이썬 서버에서 내려준 응답(status: success) 확인
            if (response.data.status === 'success') {
                login(response.data.username); // Zustand에 저장
                navigate('/'); // 메인 화면으로 리다이렉트
            }
        } catch (error) {
            console.error('로그인 에러:', error);
            alert('로그인에 실패했습니다. (서버와 연결되지 않거나 계정 정보가 틀렸습니다.)');
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '100px', fontFamily: 'sans-serif' }}>
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

            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                <span style={{ fontSize: '0.9rem', color: '#666' }}>아직 계정이 없으신가요? </span>
                <Link to="/signup" style={{ fontSize: '0.9rem', color: '#007bff', textDecoration: 'none', fontWeight: 'bold' }}>
                    회원가입 하기
                </Link>
            </div>

        </div>
    );
};

export default Login;
