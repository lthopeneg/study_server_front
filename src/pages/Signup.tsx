import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import logoImg from '../assets/logo.png';
import { api } from '../services/api';
import './Signup.css';

const initialForm = { email: '', loginId: '', password: '', passwordConfirm: '', phone: '' };

const Signup = () => {
    const [form, setForm] = useState(initialForm);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError('');
        setMessage('');
        if (form.password !== form.passwordConfirm) return setError('비밀번호가 일치하지 않습니다.');
        if (!/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(form.password)) return setError('비밀번호는 영문, 숫자, 특수문자를 포함하여 8자리 이상이어야 합니다.');
        setIsLoading(true);
        try {
            const response = await api.post('/api/signup', { login_id: form.loginId, password: form.password, email: form.email, phone: form.phone });
            setMessage(response.data.message);
            setForm(initialForm);
        } catch (requestError: unknown) {
            const responseMessage = typeof requestError === 'object' && requestError !== null && 'response' in requestError ? (requestError as { response?: { data?: { message?: string } } }).response?.data?.message : undefined;
            setError(responseMessage ?? '가입 신청에 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    return <main className="signup-page">
        <div className="signup-shell">
            <aside className="signup-intro">
                <Link className="signup-brand" to="/login" aria-label="로그인 화면으로 이동"><img src={logoImg} alt="SECURECODE SPACE" /></Link>
                <div className="signup-intro__content">
                    <span className="signup-kicker">SECURE LEARNING PLATFORM</span>
                    <h1>안전한 개발을 위한<br />첫걸음을 시작하세요.</h1>
                    <p>가입 신청을 보내면 관리자가 내용을 확인합니다. 승인 완료 후 등록한 이메일로 결과를 알려드립니다.</p>
                    <ol className="signup-steps">
                        <li><span>1</span><div><strong>가입 정보 입력</strong><small>필수 정보를 정확하게 입력합니다.</small></div></li>
                        <li><span>2</span><div><strong>관리자 검토</strong><small>신청은 7일 동안 유효합니다.</small></div></li>
                        <li><span>3</span><div><strong>승인 후 로그인</strong><small>결과 메일을 확인하고 학습을 시작합니다.</small></div></li>
                    </ol>
                </div>
                <p className="signup-intro__foot">SECURECODE SPACE · ACCOUNT REQUEST</p>
            </aside>

            <section className="signup-form-panel">
                <div className="signup-form-wrap">
                    {message ? <div className="signup-success" role="status">
                        <div className="signup-success__icon">✓</div>
                        <span>REQUEST RECEIVED</span>
                        <h2>가입 신청이 접수되었습니다</h2>
                        <p>{message}</p>
                        <div className="signup-success__note">승인 또는 거절 결과는 입력한 이메일로 안내됩니다.</div>
                        <Link className="signup-primary-link" to="/login">로그인 화면으로 이동</Link>
                        <button type="button" className="signup-secondary-button" onClick={() => setMessage('')}>다른 계정 신청하기</button>
                    </div> : <>
                        <header className="signup-form-header"><span>CREATE ACCOUNT</span><h2>회원가입 신청</h2><p>관리자 검토를 위해 아래 정보를 입력해 주세요.</p></header>
                        <form className="signup-form" onSubmit={submit}>
                            <div className="signup-field"><label htmlFor="signup-email">이메일</label><div className="signup-input"><span aria-hidden="true">@</span><input id="signup-email" type="email" autoComplete="email" required value={form.email} onChange={(event) => update('email', event.target.value)} placeholder="name@example.com" /></div></div>
                            <div className="signup-field"><label htmlFor="signup-id">아이디</label><div className="signup-input"><span aria-hidden="true">ID</span><input id="signup-id" autoComplete="username" required maxLength={50} value={form.loginId} onChange={(event) => update('loginId', event.target.value)} placeholder="로그인에 사용할 아이디" /></div></div>
                            <div className="signup-field"><label htmlFor="signup-phone">전화번호</label><div className="signup-input"><span aria-hidden="true">☎</span><input id="signup-phone" type="tel" autoComplete="tel" required value={form.phone} onChange={(event) => update('phone', event.target.value)} placeholder="010-0000-0000" /></div></div>
                            <div className="signup-form__row">
                                <div className="signup-field"><label htmlFor="signup-password">비밀번호</label><div className="signup-input"><span aria-hidden="true">●</span><input id="signup-password" type="password" autoComplete="new-password" required value={form.password} onChange={(event) => update('password', event.target.value)} placeholder="비밀번호 입력" /></div></div>
                                <div className="signup-field"><label htmlFor="signup-password-confirm">비밀번호 확인</label><div className="signup-input"><span aria-hidden="true">✓</span><input id="signup-password-confirm" type="password" autoComplete="new-password" required value={form.passwordConfirm} onChange={(event) => update('passwordConfirm', event.target.value)} placeholder="한 번 더 입력" /></div></div>
                            </div>
                            <div className="signup-password-guide"><span>8자 이상</span><span>영문 포함</span><span>숫자 포함</span><span>특수문자 포함</span></div>
                            {error && <div className="signup-alert" role="alert"><strong>!</strong><span>{error}</span></div>}
                            <button className="signup-submit" type="submit" disabled={isLoading}>{isLoading ? <><i /> 신청을 전달하고 있습니다</> : <>가입 승인 요청 <span>→</span></>}</button>
                        </form>
                        <p className="signup-login-link">이미 계정이 있으신가요? <Link to="/login">로그인</Link></p>
                    </>}
                </div>
            </section>
        </div>
    </main>;
};

export default Signup;
