import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';

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
