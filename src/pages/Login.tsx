import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { api } from '../services/api';
// 👇 로고 이미지를 불러옵니다
import logoImg from '../assets/logo.png';

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
            const response = await api.post('/api/login', {
                userId,
                password
            });

            if (response.data.status === 'success') {
                login(response.data.username);
                navigate('/');
            }
        } catch (error) {
            console.error('로그인 에러:', error);
            alert('로그인에 실패했습니다. (서버와 연결되지 않거나 계정 정보가 틀렸습니다.)');
        }
    };

    return (
        // 전체 배경을 깨끗한 흰색으로 덮고 화면 꽉 채움 (좌우 남색 여백 강제 덮어쓰기)
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', width: '100%', backgroundColor: 'white', fontFamily: 'sans-serif' }}>
            {/* 로그인 폼 전체를 감싸는 하얀색 카드 (그림자 효과 추가) */}
            <div style={{ backgroundColor: '#f1f5f9', padding: '3rem', borderRadius: '12px', boxShadow: '0 15px 35px rgba(0,0,0,0.2)', width: '320px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {/* 상단 로고 렌더링 (높이는 48px로 설정) */}
                <img src={logoImg} alt="SECURECODE SPACE" style={{ height: '150px', marginBottom: '2.5rem', objectFit: 'contain' }} />

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%' }}>
                    <input
                        type="text"
                        placeholder="아이디"
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        style={{ padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}
                    />
                    <input
                        type="password"
                        placeholder="비밀번호"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}
                    />
                    {/* 버튼 색상을 대시보드의 푸른 톤에 맞춰 통일 + Hover 효과 */}
                    <button
                        type="submit"
                        style={{
                            padding: '12px',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '1rem',
                            marginTop: '10px',
                            transition: 'all 0.2s ease-in-out' // 부드러운 애니메이션 효과
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)'; // 위로 2px 튀어나옴
                            e.currentTarget.style.boxShadow = '0 4px 10px rgba(59, 130, 246, 0.4)'; // 버튼 색과 비슷한 파란색 그림자
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)'; // 원상복구
                            e.currentTarget.style.boxShadow = 'none'; // 그림자 제거
                        }}
                    >
                        로그인
                    </button>

                </form>

                {/* 폼 하단의 회원가입 링크 영역 (선 긋기 추가) */}
                <div style={{ marginTop: '2rem', textAlign: 'center', width: '100%', borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem' }}>
                    <span style={{ fontSize: '0.9rem', color: '#64748b' }}>아직 계정이 없으신가요? </span>
                    <Link
                        to="/signup"
                        style={{
                            fontSize: '0.9rem',
                            color: '#38bdf8',
                            textDecoration: 'none',
                            fontWeight: 'bold',
                            marginLeft: '5px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'} // 마우스 올리면 밑줄 생성
                        onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'} // 마우스 떼면 밑줄 제거
                    >
                        회원가입
                    </Link>

                </div>
            </div>

        </div>
    );
};

export default Login;
