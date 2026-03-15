import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spin, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import authService from '@/services/authService';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const hasRun = useRef(false);

  useEffect(() => {
    // Prevent double execution in React StrictMode
    if (hasRun.current) return;
    hasRun.current = true;

    const handleCallback = async () => {
      // Parse tokens from URL hash
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);

      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const errorMsg = params.get('error');

      if (errorMsg) {
        setError(errorMsg);
        message.error(t('auth.oauth.failed'));
        setTimeout(() => navigate('/login', { replace: true }), 2000);
        return;
      }

      if (!accessToken || !refreshToken) {
        setError('Missing tokens');
        message.error(t('auth.oauth.failed'));
        setTimeout(() => navigate('/login', { replace: true }), 2000);
        return;
      }

      // Store tokens first
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      try {
        // Fetch user info with the new token
        const user = await authService.me();
        setUser(user);
        message.success(t('auth.login.success'));
        // Use replace to prevent going back to callback page
        navigate('/dashboard', { replace: true });
      } catch (err) {
        console.error('OAuth callback - failed to fetch user info:', err);
        setError('Failed to fetch user info');
        message.error(t('auth.oauth.failed'));
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setTimeout(() => navigate('/login', { replace: true }), 2000);
      }
    };

    handleCallback();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: 16,
        background: 'linear-gradient(135deg, #0a1628 0%, #1a2332 100%)',
        color: '#fff',
      }}
    >
      {error ? (
        <div style={{ textAlign: 'center' }}>
          <p>{error}</p>
          <p style={{ color: 'rgba(255,255,255,0.5)' }}>Redirecting to login...</p>
        </div>
      ) : (
        <Spin size="large" tip="Authenticating..." />
      )}
    </div>
  );
};

export default OAuthCallback;
