import React, { useEffect, useState } from 'react';
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
import Practice from './pages/Dashboard/Practice';
import SecurityNews from './pages/Dashboard/SecurityNews';
import MyPage from './pages/Dashboard/MyPage';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const username = useAuthStore((state) => state.username);
  if (!username) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

function App() {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const login = useAuthStore((state) => state.login);

  useEffect(() => {
    // [보안 핵심] 새로고침 시 즉시 백엔드에 요청하여 HttpOnly 쿠키 안에 유효한 JWT가 있는지 검사합니다.
    const verifyToken = async () => {
      try {
        const response = await api.get('/api/check-auth');
        if (response.data.status === 'success') {
          // 백엔드가 토큰을 승인하고 새 30분 타이머를 주면 상태를 복구(자동 로그인)
          login(response.data.username, response.data.expires_at);
        }

      } catch (error) {
        // 쿠키가 없거나 만료(조작)되었다면 해킹/만료로 간주하고 무시함
        console.log("세션 만료 또는 로그인되지 않음");
      } finally {
        // 검사가 끝나면 앱을 렌더링하도록 허가
        setIsCheckingAuth(false);
      }
    };
    verifyToken();
  }, [login]);

  // 서버로부터 쿠키 검증 결과를 기다리는 동안 잠깐 보여줄 화면 (깜빡임 방지용)
  if (isCheckingAuth) {
    return <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}>보안 인증 확인 중...</div>;
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
          <Route index element={<DashboardHome />} /> {/* 기본 화면을 학습으로 넘김 */}
          <Route path="learning" element={<Learning />} />
          <Route path="practice" element={<Practice />} />
          <Route path="news" element={<SecurityNews />} />
          <Route path="mypage" element={<MyPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
