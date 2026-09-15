import { useEffect, useState } from 'react';
import { api } from '../../services/api';

type SignupRequest = { id: number; login_id: string; email: string; phone: string | null };

const SignupRequests = () => {
    const [requests, setRequests] = useState<SignupRequest[]>([]);
    const [message, setMessage] = useState('');
    useEffect(() => { api.get('/api/admin/signup-requests').then((response) => setRequests(response.data.data ?? [])).catch(() => setMessage('가입 신청 목록을 불러오지 못했습니다.')); }, []);
    const decide = async (id: number, action: 'approve' | 'reject') => {
        try { const response = await api.post(`/api/admin/signup-requests/${id}/${action}`); setRequests((current) => current.filter((item) => item.id !== id)); setMessage(response.data.message); }
        catch { setMessage('가입 신청을 처리하지 못했습니다.'); }
    };
    return <div style={{ maxWidth: '900px', margin: '0 auto' }}><h2>회원가입 승인</h2>{message && <p role="status">{message}</p>}{requests.length === 0 ? <p>대기 중인 가입 신청이 없습니다.</p> : requests.map((item) => <article key={item.id} style={{ padding: '1.2rem', marginBottom: '.8rem', background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px' }}><strong>{item.login_id}</strong><p>{item.email} · {item.phone || '전화번호 없음'}</p><div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end' }}><button type="button" onClick={() => void decide(item.id, 'reject')}>거절</button><button type="button" onClick={() => void decide(item.id, 'approve')} style={{ color: 'white', background: '#2563eb' }}>승인</button></div></article>)}</div>;
};
export default SignupRequests;
