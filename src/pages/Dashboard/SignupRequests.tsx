import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../../services/api';
import './SignupRequests.css';

type RequestStatus = 'pending' | 'approved' | 'rejected' | 'expired';
type SignupRequest = { id: number; login_id: string; email: string; phone: string | null; status: RequestStatus; requested_at: string | null; decided_at: string | null; notification_status: 'not_sent' | 'sent' | 'failed' };
const statusLabel: Record<RequestStatus, string> = { pending: '검토 대기', approved: '승인', rejected: '거절', expired: '기간 만료' };
const formatDate = (value: string | null) => value ? new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Seoul' }).format(new Date(value)) : '-';

const SignupRequests = () => {
    const [requests, setRequests] = useState<SignupRequest[]>([]);
    const [tab, setTab] = useState<'pending' | 'history'>('pending');
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [confirmation, setConfirmation] = useState<{ item: SignupRequest; action: 'approve' | 'reject' } | null>(null);
    const loadRequests = useCallback(async () => {
        setIsLoading(true);
        try { const response = await api.get('/api/admin/signup-requests'); setRequests(response.data.data ?? []); }
        catch { setNotice({ type: 'error', text: '가입 신청 목록을 불러오지 못했습니다.' }); }
        finally { setIsLoading(false); }
    }, []);
    useEffect(() => {
        let active = true;
        api.get('/api/admin/signup-requests')
            .then((response) => { if (active) setRequests(response.data.data ?? []); })
            .catch(() => { if (active) setNotice({ type: 'error', text: '가입 신청 목록을 불러오지 못했습니다.' }); })
            .finally(() => { if (active) setIsLoading(false); });
        return () => { active = false; };
    }, []);
    const visibleRequests = useMemo(() => requests.filter((item) => tab === 'pending' ? item.status === 'pending' : item.status !== 'pending'), [requests, tab]);
    const pendingCount = requests.filter((item) => item.status === 'pending').length;
    const decide = async () => {
        if (!confirmation) return;
        const { item, action } = confirmation;
        setProcessingId(item.id);
        try { const response = await api.post(`/api/admin/signup-requests/${item.id}/${action}`); setNotice({ type: 'success', text: response.data.message }); setConfirmation(null); await loadRequests(); }
        catch { setNotice({ type: 'error', text: '가입 신청을 처리하지 못했습니다. 목록을 새로고침한 후 다시 시도해 주세요.' }); }
        finally { setProcessingId(null); }
    };
    return <section className="signup-admin">
        <header className="signup-admin__hero"><div><span className="signup-admin__eyebrow">ACCOUNT CONTROL</span><h1>회원가입 승인 센터</h1><p>가입 신청을 검토하고 계정 생성 여부를 결정합니다. 대기 신청은 7일 후 자동 만료됩니다.</p></div><button className="signup-admin__refresh" type="button" onClick={() => void loadRequests()} disabled={isLoading}><span aria-hidden="true">↻</span> 새로고침</button></header>
        <div className="signup-admin__summary"><div><strong>{pendingCount}</strong><span>검토 대기</span></div><div><strong>{requests.filter((item) => item.status === 'approved').length}</strong><span>최근 승인</span></div><div><strong>{requests.filter((item) => item.notification_status === 'failed').length}</strong><span>메일 확인 필요</span></div></div>
        {notice && <div className={`signup-admin__notice signup-admin__notice--${notice.type}`} role={notice.type === 'error' ? 'alert' : 'status'}>{notice.text}</div>}
        <nav className="signup-admin__tabs" aria-label="가입 신청 분류"><button className={tab === 'pending' ? 'is-active' : ''} onClick={() => setTab('pending')}>대기 중 <span>{pendingCount}</span></button><button className={tab === 'history' ? 'is-active' : ''} onClick={() => setTab('history')}>처리 이력</button></nav>
        <div className="signup-admin__list" aria-busy={isLoading}>{isLoading ? <div className="signup-admin__empty">신청 목록을 불러오는 중입니다.</div> : visibleRequests.length === 0 ? <div className="signup-admin__empty"><span>✓</span><strong>{tab === 'pending' ? '대기 중인 신청이 없습니다.' : '처리 이력이 없습니다.'}</strong></div> : visibleRequests.map((item) => <article className="signup-request-card" key={item.id}><div className="signup-request-card__avatar">{item.login_id.slice(0, 1).toUpperCase()}</div><div className="signup-request-card__content"><div className="signup-request-card__title"><strong>{item.login_id}</strong><span className={`status status--${item.status}`}>{statusLabel[item.status]}</span></div><div className="signup-request-card__details"><span>✉ {item.email}</span><span>☎ {item.phone || '전화번호 없음'}</span></div><div className="signup-request-card__meta">신청 {formatDate(item.requested_at)}{item.decided_at && ` · 처리 ${formatDate(item.decided_at)}`}{item.status !== 'pending' && <span className={`mail mail--${item.notification_status}`}> · 결과 메일 {item.notification_status === 'sent' ? '발송 완료' : item.notification_status === 'failed' ? '발송 실패' : '미발송'}</span>}</div></div>{item.status === 'pending' && <div className="signup-request-card__actions"><button className="button button--reject" onClick={() => setConfirmation({ item, action: 'reject' })} disabled={processingId !== null}>거절</button><button className="button button--approve" onClick={() => setConfirmation({ item, action: 'approve' })} disabled={processingId !== null}>승인</button></div>}</article>)}</div>
        {confirmation && <div className="signup-modal" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && processingId === null) setConfirmation(null); }}><div className="signup-modal__card" role="dialog" aria-modal="true" aria-labelledby="signup-confirm-title"><div className={`signup-modal__icon signup-modal__icon--${confirmation.action}`}>{confirmation.action === 'approve' ? '✓' : '!'}</div><h2 id="signup-confirm-title">가입 신청을 {confirmation.action === 'approve' ? '승인' : '거절'}할까요?</h2><p><strong>{confirmation.item.login_id}</strong>님의 신청을 처리하면 결과 안내 메일이 발송됩니다.</p><div><button className="button button--cancel" onClick={() => setConfirmation(null)} disabled={processingId !== null}>취소</button><button className={`button button--${confirmation.action}`} onClick={() => void decide()} disabled={processingId !== null}>{processingId !== null ? '처리 중...' : confirmation.action === 'approve' ? '승인하기' : '거절하기'}</button></div></div></div>}
    </section>;
};
export default SignupRequests;
