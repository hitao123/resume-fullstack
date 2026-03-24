import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import enUS from 'antd/locale/en_US';
import { useTranslation } from 'react-i18next';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Pricing from '@/pages/Pricing';
import OAuthCallback from '@/pages/OAuthCallback';
import Dashboard from '@/pages/Dashboard';
import ResumeEditor from '@/pages/ResumeEditor';
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

function App() {
  const { i18n } = useTranslation();
  const antdLocale = i18n.language?.startsWith('zh') ? zhCN : enUS;

  return (
    <ConfigProvider
      locale={antdLocale}
      theme={{
        token: {
          colorPrimary: '#c9a35f',
          colorInfo: '#c9a35f',
          colorSuccess: '#2f7d57',
          colorWarning: '#9d6b21',
          colorTextBase: '#2a2218',
          colorBgLayout: '#f7f1e7',
          borderRadius: 10,
          fontSize: 14,
          fontFamily: '"Segoe UI", "PingFang SC", "Noto Sans SC", sans-serif',
        },
      }}
    >
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/oauth/callback" element={<OAuthCallback />} />

          {/* Protected routes - 需要登录才能访问 */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="editor/:id" element={<ResumeEditor />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
