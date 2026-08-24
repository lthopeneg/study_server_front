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
import PracticeLayout from './pages/Dashboard/Practice/PracticeLayout';
import ProblemList from './pages/Dashboard/Practice/ProblemList';
import ProblemManagement from './pages/Dashboard/Practice/ProblemManagement';
import SecurityNews from './pages/Dashboard/SecurityNews';
import MyPage from './pages/Dashboard/MyPage';

import NotesLayout from './pages/Dashboard/ResearchNotes/NotesLayout';
import ExperimentIDE from './pages/Dashboard/ResearchNotes/ExperimentIDE';
import ResearchFileBrowser from './pages/Dashboard/ResearchNotes/ResearchFileBrowser';
import ResultsDashboard from './pages/Dashboard/ResearchNotes/ResultsDashboard';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const username = useAuthStore((state) => state.username);
  if (!username) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

function App() {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const login = useAuthStore((state) => state.login);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await api.get('/api/check-auth');
        if (response.data.status === 'success') {
          login(response.data.username, response.data.expires_at);
        }
      } catch {
        console.log("세션 만료 또는 로그인되지 않음");
      } finally {
        setIsCheckingAuth(false);
      }
    };
    verifyToken();
  }, [login]);

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
          <Route index element={<DashboardHome />} /> 
          <Route path="learning" element={<Learning />} />
          <Route path="practice" element={<PracticeLayout />}>
            <Route index element={<Navigate to="python" replace />} />
            <Route path="python" element={<ProblemList language="Python" />} />
            <Route path="csharp" element={<ProblemList language="C#" />} />
            <Route path="manage/create" element={<ProblemManagement mode="create" />} />
            <Route path="manage/edit" element={<ProblemManagement mode="edit" />} />
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
