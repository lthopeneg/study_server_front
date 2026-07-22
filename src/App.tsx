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

import NotesLayout from './pages/Dashboard/ResearchNotes/NotesLayout';
import NotesDashboard from './pages/Dashboard/ResearchNotes/NotesDashboard';
import ExperimentIDE from './pages/Dashboard/ResearchNotes/ExperimentIDE';
import MetricsDashboard from './pages/Dashboard/ResearchNotes/MetricsDashboard';
import ProblemBank from './pages/Dashboard/ResearchNotes/ProblemBank';
import PromptList from './pages/Dashboard/ResearchNotes/PromptList';

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
      } catch (error) {
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
          <Route path="practice" element={<Practice />} />
          <Route path="news" element={<SecurityNews />} />
          <Route path="mypage" element={<MyPage />} />
          
          {/* 연구 노트 라우트 */}
          <Route path="notes" element={<NotesLayout />}>
            {/* 1. 대시보드 */}
            <Route path="executive_summary" element={<NotesDashboard filePath="Reports/executive_summary.md" />} />
            <Route path="metrics" element={<MetricsDashboard />} />
            <Route path="evaluation_records" element={<NotesDashboard filePath="Reports/cumulative_evaluation_records.csv" />} />
            
            {/* 2. 연구 및 실험 */}
            <Route path="timeline" element={<NotesDashboard filePath="Reports/weekly_artifact_index.md" />} />
            <Route path="experiments" element={<ExperimentIDE />} />

            {/* 3. 프롬프트 관리 */}
            <Route path="prompt_list" element={<PromptList />} />
            <Route path="versions" element={<NotesDashboard filePath="Prompts/history/prompt_version_history.md" />} />

            {/* 4. 산출물 및 보고서 */}
            <Route path="problem_bank" element={<ProblemBank />} />
            <Route path="reviewer_scorecard" element={<NotesDashboard filePath="Evaluation/reviewer_scorecard.md" />} />
            <Route path="architecture" element={<NotesDashboard filePath="Reports/system_architecture_diagram.md" />} />
            <Route path="manifest" element={<NotesDashboard filePath="Reports/artifact_manifest.json" />} />

            {/* 매칭되지 않는 주소는 요약 화면으로 */}
            <Route path="*" element={<Navigate to="executive_summary" replace />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
