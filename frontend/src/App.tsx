import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { App as AntdApp, ConfigProvider } from 'antd';
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
          colorPrimary: '#9d6b21',
          colorInfo: '#9d6b21',
          colorSuccess: '#15803d',
          colorWarning: '#b45309',
          colorTextBase: '#1c1917',
          colorBgLayout: '#f7f6f3',
          colorBorder: '#dbd6cd',
          colorBorderSecondary: '#e9e6e0',
          borderRadius: 8,
          fontSize: 14,
          fontFamily: '"Segoe UI", "PingFang SC", "Noto Sans SC", sans-serif',
        },
        components: {
          Card: {
            borderRadiusLG: 12,
            boxShadowTertiary: '0 1px 2px rgba(28, 25, 23, 0.05)',
          },
          Button: {
            borderRadius: 8,
            controlHeight: 36,
          },
          Menu: {
            itemBorderRadius: 8,
          },
        },
      }}
    >
      <AntdApp component={false}>
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
      </AntdApp>
    </ConfigProvider>
  );
}

export default App;
