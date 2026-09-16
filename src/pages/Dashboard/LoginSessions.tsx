import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';

type LoginSession = {
  session_id: string;
  ip_hash: string | null;
  device_hash: string | null;
  created_at: string;
  last_seen_at: string;
  expires_at: string;
  is_current: boolean;
};
const formatDate = (value: string) =>
  new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Seoul',
  }).format(new Date(value));

const LoginSessions = () => {
  const [sessions, setSessions] = useState<LoginSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/api/sessions');
      setSessions(response.data.data ?? []);
    } catch {
      setError('로그인 세션을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    let active = true;
    api
      .get('/api/sessions')
      .then((response) => {
        if (active) setSessions(response.data.data ?? []);
      })
      .catch(() => {
        if (active) setError('로그인 세션을 불러오지 못했습니다.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  const endSession = async (session: LoginSession) => {
    if (
      !window.confirm(
        session.is_current
          ? '현재 세션을 종료하고 로그아웃할까요?'
          : '선택한 로그인 세션을 종료할까요?',
      )
    )
      return;
    await api.delete(`/api/sessions/${session.session_id}`);
    if (session.is_current) {
      logout();
      navigate('/login');
      return;
    }
    await load();
  };
  const endAll = async () => {
    if (!window.confirm('모든 기기에서 로그아웃할까요?')) return;
    await api.delete('/api/sessions');
    logout();
    navigate('/login');
  };
  return (
    <section>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '16px',
          alignItems: 'center',
          margin: '24px 0 16px',
        }}
      >
        <div>
          <h3 style={{ margin: 0, color: '#1e293b' }}>로그인된 기기</h3>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '14px' }}>
            알 수 없는 접속이 있으면 해당 세션을 즉시 종료하세요. 접속 정보는 원문 대신 식별값으로
            표시됩니다.
          </p>
        </div>
        <button
          onClick={() => void endAll()}
          disabled={!sessions.length}
          style={{
            border: 0,
            borderRadius: '9px',
            padding: '10px 14px',
            background: '#b91c1c',
            color: '#fff',
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          전체 로그아웃
        </button>
      </div>
      {error && (
        <div
          style={{ padding: '14px', borderRadius: '10px', background: '#fee2e2', color: '#991b1b' }}
        >
          {error}
        </div>
      )}
      {loading ? (
        <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
          세션을 확인하는 중입니다.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '10px' }}>
          {sessions.map((session) => (
            <article
              key={session.session_id}
              style={{
                padding: '18px',
                border: '1px solid #e2e8f0',
                borderRadius: '13px',
                background: '#fff',
                display: 'flex',
                justifyContent: 'space-between',
                gap: '15px',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontWeight: 800, color: '#1e293b' }}>
                  {session.is_current ? '현재 기기' : '다른 로그인 기기'}{' '}
                  {session.is_current && (
                    <span
                      style={{
                        fontSize: '11px',
                        color: '#166534',
                        background: '#dcfce7',
                        padding: '3px 7px',
                        borderRadius: '999px',
                      }}
                    >
                      사용 중
                    </span>
                  )}
                </div>
                <div style={{ marginTop: '8px', fontSize: '13px', color: '#64748b' }}>
                  최근 활동 {formatDate(session.last_seen_at)} · IP {session.ip_hash ?? '-'} · 기기{' '}
                  {session.device_hash ?? '-'}
                </div>
              </div>
              <button
                onClick={() => void endSession(session)}
                style={{
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  padding: '8px 11px',
                  background: '#fff',
                  color: '#b91c1c',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                세션 종료
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
export default LoginSessions;
