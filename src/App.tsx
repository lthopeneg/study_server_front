import React from 'react'; // <-- 1. 맨 윗줄에 추가
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import { useAuthStore } from './store/useAuthStore';
// 2. JSX.Element 를 React.ReactNode 로 변경
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const username = useAuthStore((state) => state.username);
  if (!username) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>; // <-- 3. 안전하게 Fragment(<>)로 한 번 감싸서 리턴
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
