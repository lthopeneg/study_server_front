import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

const fieldStyle = { width: '100%', boxSizing: 'border-box' as const, padding: '.7rem', marginTop: '.4rem' };

const Signup = () => {
    const [form, setForm] = useState({ email: '', loginId: '', password: '', passwordConfirm: '', phone: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

    const submit = async (event: React.FormEvent) => {
        event.preventDefault(); setError(''); setMessage('');
        if (form.password !== form.passwordConfirm) return setError('비밀번호가 일치하지 않습니다.');
        if (!/^(?=.*[a-zA-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(form.password)) return setError('비밀번호는 영문, 숫자, 특수문자를 포함하여 8자리 이상이어야 합니다.');
        setIsLoading(true);
        try {
            const response = await api.post('/api/signup', { login_id: form.loginId, password: form.password, email: form.email, phone: form.phone });
            setMessage(response.data.message); setForm({ email: '', loginId: '', password: '', passwordConfirm: '', phone: '' });
        } catch (requestError: unknown) {
            const responseMessage = typeof requestError === 'object' && requestError !== null && 'response' in requestError ? (requestError as { response?: { data?: { message?: string } } }).response?.data?.message : undefined;
            setError(responseMessage ?? '가입 신청에 실패했습니다.');
        } finally { setIsLoading(false); }
    };

    return <main style={{ padding: '2rem', maxWidth: '440px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '.5rem' }}>회원가입 신청</h2>
        <p style={{ color: '#64748b', textAlign: 'center' }}>관리자가 신청 내용을 확인한 후 가입을 승인합니다.</p>
        <form onSubmit={submit} style={{ display: 'grid', gap: '1rem', marginTop: '2rem', padding: '1.5rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
            <label>이메일<input type="email" required value={form.email} onChange={(e) => update('email', e.target.value)} style={fieldStyle} /></label>
            <label>아이디<input required maxLength={50} value={form.loginId} onChange={(e) => update('loginId', e.target.value)} style={fieldStyle} /></label>
            <label>전화번호<input type="tel" required value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="010-0000-0000" style={fieldStyle} /></label>
            <label>비밀번호<input type="password" required value={form.password} onChange={(e) => update('password', e.target.value)} placeholder="영문, 숫자, 특수문자 포함 8자리 이상" style={fieldStyle} /></label>
            <label>비밀번호 확인<input type="password" required value={form.passwordConfirm} onChange={(e) => update('passwordConfirm', e.target.value)} style={fieldStyle} /></label>
            {error && <div role="alert" style={{ color: '#b91c1c', background: '#fee2e2', padding: '.8rem' }}>{error}</div>}
            {message && <div role="status" style={{ color: '#166534', background: '#dcfce7', padding: '.8rem' }}>{message}</div>}
            <button type="submit" disabled={isLoading || Boolean(message)} style={{ padding: '.8rem', color: 'white', background: '#2563eb', border: 0, borderRadius: '7px' }}>{isLoading ? '신청 중...' : '가입 승인 요청'}</button>
        </form>
        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}><Link to="/login">로그인 화면으로</Link></div>
    </main>;
};

export default Signup;
