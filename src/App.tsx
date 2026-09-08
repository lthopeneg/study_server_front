import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { api } from './services/api';

// 페이지 및 레이아웃 임포트
import Login from './pages/Login';
import Signup from './pages/Signup';
import DashboardLayout from './components/layout/DashboardLayout';

// 4개의 대시보드 하위 페이지 임포트
import DashboardHome from './pages/Dashboard/DashboardHome';
import Learning from './pages/Dashboard/Learning';
import PracticeLayout from './pages/Dashboard/Practice/PracticeLayout';
import ProblemList from './pages/Dashboard/Practice/ProblemList';
import ProblemManagement from './pages/Dashboard/Practice/ProblemManagement';
import ProblemSolver from './pages/Dashboard/Practice/ProblemSolver';
import ProblemEditPage from './pages/Dashboard/Practice/ProblemEditPage';
import SecurityNews from './pages/Dashboard/SecurityNews';
import MyPage from './pages/Dashboard/MyPage';
import logoImg from './assets/logo.png';

import NotesLayout from './pages/Dashboard/ResearchNotes/NotesLayout';
import ExperimentIDE from './pages/Dashboard/ResearchNotes/ExperimentIDE';
import ResearchFileBrowser from './pages/Dashboard/ResearchNotes/ResearchFileBrowser';
import ResultsDashboard from './pages/Dashboard/ResearchNotes/ResultsDashboard';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const username = useAuthStore((state) => state.username);
  if (!username) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AuthStatusScreen = ({
  error = false,
  onRetry,
}: {
  error?: boolean;
  onRetry?: () => void;
}) => (
  <main className="auth-status-page">
    <section className="auth-status-card" role={error ? 'alert' : 'status'} aria-live="polite">
      <img className="auth-status-logo" src={logoImg} alt="SECURECODE SPACE" />

      <div className={`auth-status-icon${error ? ' auth-status-icon--error' : ''}`} aria-hidden="true">
        {error ? (
          <svg viewBox="0 0 24 24">
            <path d="M12 8v5m0 3.25v.01M10.3 4.53 3.36 16.5A2 2 0 0 0 5.09 19.5h13.82a2 2 0 0 0 1.73-3L13.7 4.53a1.96 1.96 0 0 0-3.4 0Z" />
          </svg>
        ) : (
          <span className="auth-status-spinner" />
        )}
      </div>

      <h1>{error ? '서버 연결이 원활하지 않습니다' : '보안 인증 확인 중'}</h1>
      <p>
        {error
          ? '서버 응답이 지연되고 있습니다. 잠시 후 다시 연결해 주세요.'
          : '안전한 접속을 위해 로그인 상태를 확인하고 있습니다.'}
      </p>

      {error && onRetry && (
        <button className="auth-status-retry" type="button" onClick={onRetry}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20 11a8.1 8.1 0 1 0 2 5.3M20 4v7h-7" />
          </svg>
          다시 연결하기
        </button>
      )}

      <span className="auth-status-help">
        문제가 계속되면 잠시 후 페이지를 새로고침해 주세요.
      </span>
    </section>
  </main>
);

function App() {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [authError, setAuthError] = useState(false);
  const [authAttempt, setAuthAttempt] = useState(0);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    const controller = new AbortController();
    const verifyToken = async () => {
      try {
        const response = await api.get('/api/check-auth', {
          timeout: 10_000,
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        if (response.data.status !== 'success' || typeof response.data.username !== 'string'
          || typeof response.data.expires_at !== 'number') {
          throw new Error('Invalid authentication response');
        }
        login(response.data.username, response.data.expires_at);
      } catch (error) {
        if (controller.signal.aborted) return;
        // JWT 누락·만료·유효하지 않은 토큰만 비로그인으로 처리합니다.
        if (axios.isAxiosError(error) && [401, 422].includes(error.response?.status ?? 0)) {
          logout();
        } else {
          setAuthError(true);
        }
      } finally {
        if (!controller.signal.aborted) setIsCheckingAuth(false);
      }
    };
    verifyToken();
    return () => controller.abort();
  }, [login, logout, authAttempt]);

  if (isCheckingAuth) {
    return <AuthStatusScreen />;
  }

  if (authError) {
    return (
      <AuthStatusScreen
        error
        onRetry={() => {
            setAuthError(false);
            setIsCheckingAuth(true);
            setAuthAttempt((attempt) => attempt + 1);
        }}
      />
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* 대시보드 레이아웃 (로그인이 필요한 보호 구역) */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          {/* <Outlet /> 자리에 쏙쏙 들어갈 하위 라우트들 (Nested Routes) */}
          <Route index element={<DashboardHome />} /> 
          <Route path="learning" element={<Learning />} />
          <Route path="practice" element={<PracticeLayout />}>
            <Route index element={<Navigate to="python" replace />} />
            <Route path="python" element={<ProblemList language="Python" />} />
            <Route path="python/:problemId" element={<ProblemSolver />} />
            <Route path="csharp" element={<ProblemList language="C#" />} />
            <Route path="csharp/:problemId" element={<ProblemSolver />} />
            <Route path="manage/create" element={<ProblemManagement mode="create" />} />
            <Route path="manage/edit" element={<ProblemManagement mode="edit" />} />
            <Route path="manage/edit/:problemId" element={<ProblemEditPage />} />
            <Route path="manage/delete" element={<ProblemManagement mode="delete" />} />
            <Route path="*" element={<Navigate to="python" replace />} />
          </Route>
          <Route path="news" element={<SecurityNews />} />
          <Route path="mypage" element={<MyPage />} />
          
          {/* 연구 노트 라우트 */}
          <Route path="notes" element={<NotesLayout />}>
            <Route path="research" element={<ResearchFileBrowser section="notes" title="연구 노트" description="주차별 연구 기록을 선택해서 확인합니다." />} />
            <Route path="experiments" element={<ExperimentIDE />} />
            <Route path="results" element={<ResultsDashboard />} />
            <Route path="*" element={<Navigate to="research" replace />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
