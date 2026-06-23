import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';

interface UserProfile {
    login_id: string;
    email: string;
    phone: string;
    role: string;
    created_at: string;
}

const MyPage = () => {
    const { logout } = useAuthStore();
    const navigate = useNavigate();

    // 화면 상태 관리: 'menu'(기본 허브), 'verify'(비밀번호 확인창), 'edit'(정보 수정창)
    const [viewMode, setViewMode] = useState<'menu' | 'verify' | 'edit'>('menu');

    // [edit 화면용] 프로필 데이터 상태
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loadingProfile, setLoadingProfile] = useState(true);

    // [verify 화면용] 비밀번호 확인 상태
    const [verifyPassword, setVerifyPassword] = useState('');
    const [verifyError, setVerifyError] = useState('');

    // [edit 화면용] 비밀번호 변경 상태
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [editError, setEditError] = useState('');
    const [editSuccess, setEditSuccess] = useState('');

    // === 1. 프로필 불러오기 (edit 뷰에 진입했을 때만 늦게 호출하여 불필요한 통신 방지) ===
    useEffect(() => {
        if (viewMode === 'edit') {
            const fetchProfile = async () => {
                setLoadingProfile(true);
                try {
                    const res = await api.get('/api/user/profile');
                    if (res.data.status === 'success') {
                        setProfile(res.data.data);
                    }
                } catch (error) {
                    console.error("프로필 불러오기 실패", error);
                } finally {
                    setLoadingProfile(false);
                }
            };
            fetchProfile();
        }
    }, [viewMode]);

    // === 2. 비밀번호 재확인 제출 (verify 뷰) ===
    const handleVerifySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setVerifyError('');

        try {
            const res = await api.post('/api/user/verify-password', {
                password: verifyPassword
            });

            if (res.data.status === 'success') {
                // 검증 성공! edit 화면으로 넘어가고 입력창은 초기화
                setVerifyPassword('');
                setViewMode('edit');
            }
        } catch (error: any) {
            if (error.response && error.response.data && error.response.data.message) {
                setVerifyError(error.response.data.message);
            } else {
                setVerifyError("인증에 실패했습니다.");
            }
        }
    };

    // === 3. 비밀번호 변경 제출 (edit 뷰) ===
    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setEditError('');
        setEditSuccess('');

        if (newPassword !== confirmPassword) {
            setEditError("새 비밀번호와 확인 비밀번호가 일치하지 않습니다.");
            return;
        }

        try {
            const res = await api.put('/api/user/password', {
                current_password: currentPassword,
                new_password: newPassword
            });

            if (res.data.status === 'success') {
                setEditSuccess(res.data.message);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');

                // 보안을 위해 2초 뒤 자동 로그아웃 처리
                setTimeout(async () => {
                    await api.post('/api/logout');
                    logout();
                    navigate('/login');
                }, 2000);
            }
        } catch (error: any) {
            if (error.response && error.response.data && error.response.data.message) {
                setEditError(error.response.data.message);
            } else {
                setEditError("비밀번호 변경에 실패했습니다.");
            }
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
            <h2 style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '1rem', color: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>👤 마이페이지</span>
                {viewMode !== 'menu' && (
                    <button
                        onClick={() => {
                            setViewMode('menu');
                            setVerifyPassword('');
                            setVerifyError('');
                            setEditError('');
                            setEditSuccess('');
                        }}
                        style={{ fontSize: '0.9rem', padding: '0.4rem 0.8rem', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '6px', color: '#64748b', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        돌아가기 ↩
                    </button>
                )}
            </h2>

            {/* =========================================
                 [화면 1] 메뉴 허브 (menu)
               ========================================= */}
            {viewMode === 'menu' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginTop: '2rem' }}>

                    {/* 활성화된 버튼 */}
                    <button
                        onClick={() => setViewMode('verify')}
                        style={{ padding: '1.5rem', backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '12px', textAlign: 'left', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: '0.2s', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
                    >
                        <div>
                            <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#1e293b', marginBottom: '0.3rem' }}>🔒 회원정보 수정</div>
                            <div style={{ fontSize: '0.9rem', color: '#64748b' }}>내 프로필 확인 및 비밀번호 변경</div>
                        </div>
                        <span style={{ fontSize: '1.5rem', color: '#94a3b8' }}>→</span>
                    </button>

                    {/* 준비 중인 버튼들 (비활성화 느낌) */}
                    <button disabled style={{ padding: '1.5rem', backgroundColor: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '12px', textAlign: 'left', cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: 0.7 }}>
                        <div>
                            <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#64748b', marginBottom: '0.3rem' }}>📈 나의 학습 진도 <span style={{ fontSize: '0.8rem', backgroundColor: '#e2e8f0', padding: '0.2rem 0.5rem', borderRadius: '4px', marginLeft: '0.5rem' }}>준비중</span></div>
                            <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>완료한 퀴즈 및 학습 현황 보기</div>
                        </div>
                    </button>

                    <button disabled style={{ padding: '1.5rem', backgroundColor: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '12px', textAlign: 'left', cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: 0.7 }}>
                        <div>
                            <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#64748b', marginBottom: '0.3rem' }}>⭐ 스크랩한 뉴스 <span style={{ fontSize: '0.8rem', backgroundColor: '#e2e8f0', padding: '0.2rem 0.5rem', borderRadius: '4px', marginLeft: '0.5rem' }}>준비중</span></div>
                            <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>북마크 해둔 중요한 보안 뉴스 다시보기</div>
                        </div>
                    </button>
                </div>
            )}

            {/* =========================================
                 [화면 2] 비밀번호 확인 창 (verify)
               ========================================= */}
            {viewMode === 'verify' && (
                <div style={{ backgroundColor: 'white', padding: '2.5rem 2rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginTop: '2rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔐</div>
                    <h3 style={{ marginTop: 0, marginBottom: '0.5rem', color: '#1e293b' }}>본인 확인</h3>
                    <p style={{ color: '#64748b', marginBottom: '2rem', fontSize: '0.95rem' }}>안전한 정보 보호를 위해 현재 비밀번호를 입력해주세요.</p>

                    {verifyError && <div style={{ color: '#ef4444', backgroundColor: '#fee2e2', padding: '0.8rem', borderRadius: '6px', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: 'bold' }}>⚠️ {verifyError}</div>}

                    <form onSubmit={handleVerifySubmit}>
                        <input
                            type="password"
                            value={verifyPassword}
                            onChange={(e) => setVerifyPassword(e.target.value)}
                            placeholder="현재 비밀번호 입력"
                            required
                            autoFocus
                            style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', marginBottom: '1rem', textAlign: 'center', fontSize: '1.1rem', letterSpacing: '2px' }}
                        />
                        <button
                            type="submit"
                            style={{ width: '100%', padding: '1rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', transition: '0.2s' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
                        >
                            확인
                        </button>
                    </form>
                </div>
            )}

            {/* =========================================
                 [화면 3] 정보 수정 화면 (edit)
               ========================================= */}
            {viewMode === 'edit' && (
                <div style={{ marginTop: '2rem' }}>
                    {loadingProfile ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>프로필 정보를 불러오는 중입니다...</div>
                    ) : !profile ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#ef4444' }}>프로필 정보를 불러오지 못했습니다.</div>
                    ) : (
                        <>
                            {/* 프로필 정보 섹션 (읽기 전용 상태 - Disabled) */}
                            <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '2rem' }}>
                                <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#334155' }}>기본 정보 (수정 불가)</h3>

                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#64748b', fontWeight: 'bold', fontSize: '0.9rem' }}>아이디</label>
                                    <input type="text" value={profile.login_id} disabled style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#94a3b8' }} />
                                </div>

                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#64748b', fontWeight: 'bold', fontSize: '0.9rem' }}>이메일</label>
                                    <input type="email" value={profile.email} disabled style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#94a3b8' }} />
                                </div>

                                <div style={{ marginBottom: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#64748b', fontWeight: 'bold', fontSize: '0.9rem' }}>가입 일자</label>
                                    <input type="text" value={profile.created_at} disabled style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#94a3b8' }} />
                                </div>
                            </div>

                            {/* 비밀번호 변경 섹션 */}
                            <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                                <h3 style={{ marginTop: 0, marginBottom: '1.5rem', color: '#334155' }}>🔒 비밀번호 변경</h3>

                                {editError && <div style={{ backgroundColor: '#fee2e2', color: '#ef4444', padding: '1rem', borderRadius: '6px', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: 'bold' }}>⚠️ {editError}</div>}
                                {editSuccess && <div style={{ backgroundColor: '#dcfce3', color: '#22c55e', padding: '1rem', borderRadius: '6px', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: 'bold' }}>✅ {editSuccess}</div>}

                                <form onSubmit={handleChangePassword}>
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#475569', fontWeight: 'bold', fontSize: '0.9rem' }}>현재 비밀번호 재확인</label>
                                        <input
                                            type="password"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            placeholder="안전을 위해 한 번 더 입력해주세요"
                                            required
                                            style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}
                                        />
                                    </div>

                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#475569', fontWeight: 'bold', fontSize: '0.9rem' }}>새 비밀번호</label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="영문, 숫자, 특수기호 포함 8자리 이상"
                                            required
                                            style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}
                                        />
                                    </div>

                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#475569', fontWeight: 'bold', fontSize: '0.9rem' }}>새 비밀번호 확인</label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="변경할 비밀번호 재입력"
                                            required
                                            style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        style={{ width: '100%', padding: '1rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', transition: '0.2s' }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
                                    >
                                        비밀번호 변경하기
                                    </button>
                                </form>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default MyPage;
