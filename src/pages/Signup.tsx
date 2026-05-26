import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';

const Signup = () => {
    const navigate = useNavigate();

    // 입력 상태
    const [email, setEmail] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [loginId, setLoginId] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [phone, setPhone] = useState('');

    // UI 흐름 상태
    const [isCodeSent, setIsCodeSent] = useState(false);
    const [isVerified, setIsVerified] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // 에러 메시지
    const [emailError, setEmailError] = useState('');
    const [passwordError, setPasswordError] = useState('');

    // 1단계: 인증 메일 발송
    const handleSendVerification = async () => {
        if (!email) {
            setEmailError('이메일을 입력해주세요.');
            return;
        }
        setIsLoading(true);
        try {
            await api.post('/api/send-verification', { email });
            setIsCodeSent(true);
            setEmailError('');
            alert('인증번호가 발송되었습니다. 3분 내에 입력해주세요.');
        } catch (error: any) {
            setEmailError(error.response?.data?.message || '인증 메일 발송에 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    // 2단계: 인증 번호 확인
    const handleVerifyCode = async () => {
        if (!verificationCode) return;
        try {
            await api.post('/api/verify-code', { email, code: verificationCode });
            setIsVerified(true);
            alert('이메일 인증이 완료되었습니다!');
        } catch (error: any) {
            alert(error.response?.data?.message || '인증번호가 틀렸거나 만료되었습니다.');
        }
    };

    // 비밀번호 정규식 (8자리 이상, 영문+숫자+특수문자)
    const validatePassword = (pw: string) => {
        return /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(pw);
    };

    // 3단계: 최종 회원가입
    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isVerified) {
            alert('이메일 인증을 먼저 완료해주세요.');
            return;
        }
        if (password !== passwordConfirm) {
            setPasswordError('비밀번호가 일치하지 않습니다.');
            return;
        }
        if (!validatePassword(password)) {
            setPasswordError('비밀번호는 영문, 숫자, 특수문자를 포함하여 8자리 이상이어야 합니다.');
            return;
        }

        setIsLoading(true);
        try {
            await api.post('/api/signup', {
                login_id: loginId,
                password: password,
                email: email,
                phone: phone
            });
            alert('회원가입이 성공적으로 완료되었습니다! 로그인해 주세요.');
            navigate('/login');
        } catch (error: any) {
            alert(error.response?.data?.message || '회원가입에 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '400px', margin: '0 auto' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>회원가입</h2>

            <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                {/* 1단계: 이메일 인증 영역 */}
                <div style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: '8px' }}>
                    <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>이메일 인증 (필수)</label>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isVerified}
                            placeholder="example@gmail.com"
                            style={{ flex: 1, padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                        />
                        <button
                            type="button"
                            onClick={handleSendVerification}
                            disabled={isVerified || isLoading}
                            style={{ padding: '0.5rem', cursor: 'pointer', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '4px' }}
                        >
                            {isLoading ? '발송중...' : isCodeSent ? '재발송' : '인증요청'}
                        </button>
                    </div>
                    {emailError && <div style={{ color: 'red', fontSize: '0.8rem', marginTop: '0.5rem' }}>{emailError}</div>}

                    {isCodeSent && !isVerified && (
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                            <input
                                type="text"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                                placeholder="6자리 인증번호"
                                maxLength={6}
                                style={{ flex: 1, padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}
                            />
                            <button type="button" onClick={handleVerifyCode} style={{ padding: '0.5rem', cursor: 'pointer', backgroundColor: '#4ade80', border: 'none', borderRadius: '4px' }}>
                                확인
                            </button>
                        </div>
                    )}
                    {isVerified && <div style={{ color: 'green', fontSize: '0.9rem', marginTop: '0.5rem' }}>✅ 이메일 인증이 완료되었습니다.</div>}
                </div>

                {/* 2단계: 아이디/비밀번호 입력 영역 (인증 완료 시에만 노출) */}
                {isVerified && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid #ddd', padding: '1rem', borderRadius: '8px' }}>
                        <div>
                            <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>아이디</label>
                            <input
                                type="text"
                                value={loginId}
                                onChange={(e) => setLoginId(e.target.value)}
                                required
                                style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }}
                            />
                        </div>

                        <div>
                            <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>전화번호</label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                                placeholder="010-0000-0000"
                                style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }}
                            />
                        </div>

                        <div>
                            <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>비밀번호</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    if (!validatePassword(e.target.value)) setPasswordError('영문, 숫자, 특수문자 포함 8자리 이상 필수');
                                    else setPasswordError('');
                                }}
                                required
                                placeholder="영문, 숫자, 특수문자 조합 8자 이상"
                                style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }}
                            />
                        </div>

                        <div>
                            <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>비밀번호 확인</label>
                            <input
                                type="password"
                                value={passwordConfirm}
                                onChange={(e) => setPasswordConfirm(e.target.value)}
                                required
                                style={{ width: '100%', padding: '0.5rem', marginTop: '0.5rem', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #ccc' }}
                            />
                        </div>

                        {passwordError && <div style={{ color: 'red', fontSize: '0.8rem' }}>{passwordError}</div>}

                        <button type="submit" disabled={isLoading} style={{ padding: '0.75rem', marginTop: '1rem', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                            {isLoading ? '가입 처리 중...' : '가입 완료하기'}
                        </button>
                    </div>
                )}
            </form>

            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                <Link to="/login" style={{ color: '#666', textDecoration: 'none', fontSize: '0.9rem' }}>이미 계정이 있으신가요? 로그인 화면으로</Link>
            </div>
        </div>
    );
};

export default Signup;
