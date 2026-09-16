import { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api';
import './AuditLogs.css';

type AuditLog = {
  id: number;
  actor_login_id: string | null;
  event_type: string;
  target_type: string | null;
  target_id: string | null;
  outcome: 'success' | 'failure';
  request_id: string | null;
  ip_hash: string | null;
  details: Record<string, unknown>;
  created_at: string | null;
};
type SecurityAlert = {
  id: number;
  category: string;
  severity: 'medium' | 'high';
  title: string;
  description: string;
  actor_login_id: string | null;
  ip_hash: string | null;
  status: 'open' | 'resolved';
  occurrence_count: number;
  last_seen_at: string;
  notified_at: string | null;
};
const labels: Record<string, string> = {
  'auth.login': '로그인',
  'account.password_change': '비밀번호 변경',
  'account.session_revoke': '세션 종료',
  'account.session_revoke_all': '전체 세션 종료',
  'security_alert.resolve': '보안 알림 확인',
  'signup.approve': '가입 승인',
  'signup.reject': '가입 거절',
  'news.ai_generate': 'AI 기사 생성',
  'news.ai_delete': 'AI 기사 삭제',
  'practice.create': '문제 생성',
  'practice.update': '문제 수정',
  'practice.delete': '문제 삭제',
  'practice.delete_batch': '문제 일괄 삭제',
  'practice.status_change': '문제 상태 변경',
};
const events = Object.keys(labels);
const formatDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat('ko-KR', {
        dateStyle: 'medium',
        timeStyle: 'medium',
        timeZone: 'Asia/Seoul',
      }).format(new Date(value))
    : '-';

const AuditLogs = () => {
  const [tab, setTab] = useState<'alerts' | 'logs'>('alerts');
  const [items, setItems] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [alertStatus, setAlertStatus] = useState('open');
  const [eventType, setEventType] = useState('');
  const [outcome, setOutcome] = useState('');
  const [actor, setActor] = useState('');
  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/admin/audit-logs', {
        params: {
          event_type: eventType || undefined,
          outcome: outcome || undefined,
          actor: actor || undefined,
          limit: 100,
        },
      });
      setItems(response.data.data ?? []);
      setTotal(response.data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [eventType, outcome, actor]);
  const loadAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/admin/security-alerts', {
        params: { status: alertStatus },
      });
      setAlerts(response.data.data ?? []);
    } finally {
      setLoading(false);
    }
  }, [alertStatus]);
  useEffect(() => {
    const timer = window.setTimeout(() => void (tab === 'alerts' ? loadAlerts() : loadLogs()), 250);
    return () => window.clearTimeout(timer);
  }, [tab, loadAlerts, loadLogs]);
  const resolveAlert = async (id: number) => {
    await api.post(`/api/admin/security-alerts/${id}/resolve`);
    await loadAlerts();
  };

  return (
    <section className="audit-page">
      <header>
        <div>
          <span>SECURITY MONITORING</span>
          <h1>보안 모니터링</h1>
          <p>위험 로그인 알림과 관리자·계정 보안 작업을 함께 확인합니다.</p>
        </div>
        <strong>{tab === 'alerts' ? `${alerts.length}건` : `${total}건`}</strong>
      </header>
      <div className="audit-tabs">
        <button className={tab === 'alerts' ? 'active' : ''} onClick={() => setTab('alerts')}>
          위험 알림
        </button>
        <button className={tab === 'logs' ? 'active' : ''} onClick={() => setTab('logs')}>
          감사 로그
        </button>
      </div>
      {tab === 'alerts' ? (
        <>
          <div className="audit-filters audit-filters--alerts">
            <select
              value={alertStatus}
              onChange={(e) => setAlertStatus(e.target.value)}
              aria-label="알림 상태"
            >
              <option value="open">확인 필요</option>
              <option value="resolved">확인 완료</option>
              <option value="all">전체</option>
            </select>
            <button onClick={() => void loadAlerts()} disabled={loading}>
              ↻ 새로고침
            </button>
          </div>
          <div className="alert-list" aria-busy={loading}>
            {loading ? (
              <div className="audit-empty">보안 알림을 불러오는 중입니다.</div>
            ) : alerts.length === 0 ? (
              <div className="audit-empty">현재 조건에 맞는 보안 알림이 없습니다.</div>
            ) : (
              alerts.map((alert) => (
                <article
                  key={alert.id}
                  className={`security-alert security-alert--${alert.severity}`}
                >
                  <div className="security-alert__head">
                    <div>
                      <span>{alert.severity === 'high' ? '위험' : '주의'}</span>
                      <strong>{alert.title}</strong>
                    </div>
                    <small>{formatDate(alert.last_seen_at)}</small>
                  </div>
                  <p>{alert.description}</p>
                  <div className="security-alert__meta">
                    <span>계정 {alert.actor_login_id ?? '-'}</span>
                    <span>IP {alert.ip_hash ?? '-'}</span>
                    <span>{alert.occurrence_count}회 감지</span>
                    {alert.notified_at && <span>관리자 메일 발송</span>}
                  </div>
                  {alert.status === 'open' && (
                    <button onClick={() => void resolveAlert(alert.id)}>확인 완료</button>
                  )}
                </article>
              ))
            )}
          </div>
        </>
      ) : (
        <>
          <div className="audit-filters">
            <input
              value={actor}
              onChange={(e) => setActor(e.target.value)}
              placeholder="사용자 아이디 검색"
              aria-label="사용자 아이디 검색"
            />
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              aria-label="작업 종류"
            >
              <option value="">모든 작업</option>
              {events.map((event) => (
                <option key={event} value={event}>
                  {labels[event]}
                </option>
              ))}
            </select>
            <select
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              aria-label="처리 결과"
            >
              <option value="">모든 결과</option>
              <option value="success">성공</option>
              <option value="failure">실패</option>
            </select>
            <button onClick={() => void loadLogs()} disabled={loading}>
              ↻ 새로고침
            </button>
          </div>
          <div className="audit-list" aria-busy={loading}>
            {loading ? (
              <div className="audit-empty">감사 로그를 불러오는 중입니다.</div>
            ) : items.length === 0 ? (
              <div className="audit-empty">조건에 맞는 감사 로그가 없습니다.</div>
            ) : (
              items.map((item) => (
                <article key={item.id}>
                  <div className={`audit-status audit-status--${item.outcome}`}>
                    {item.outcome === 'success' ? '✓' : '!'}
                  </div>
                  <div className="audit-main">
                    <div>
                      <strong>{labels[item.event_type] ?? item.event_type}</strong>
                      <span className={`audit-badge audit-badge--${item.outcome}`}>
                        {item.outcome === 'success' ? '성공' : '실패'}
                      </span>
                    </div>
                    <p>
                      {item.actor_login_id ?? '알 수 없는 사용자'}
                      {item.target_type && ` · ${item.target_type}`}
                      {item.target_id && ` #${item.target_id}`}
                    </p>
                    <small>
                      {formatDate(item.created_at)} · 요청 {item.request_id?.slice(0, 12) ?? '-'} ·
                      IP {item.ip_hash ?? '-'}
                    </small>
                    {Object.keys(item.details).length > 0 && (
                      <pre>{JSON.stringify(item.details, null, 2)}</pre>
                    )}
                  </div>
                </article>
              ))
            )}
          </div>
        </>
      )}
    </section>
  );
};
export default AuditLogs;
