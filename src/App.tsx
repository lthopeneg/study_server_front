import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import { useAuthStore } from './store/useAuthStore';

// 로그인이 안 되어있으면 /login 으로 튕겨내는 가드 컴포넌트
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const username = useAuthStore((state) => state.username);
  if (!username) {
    return <Navigate to="/login" replace />;
  }
  return children;
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
