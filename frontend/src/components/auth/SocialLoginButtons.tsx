import { Button, Divider, message } from 'antd';
import { GithubOutlined, GoogleOutlined, WechatOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import api from '@/services/api';

const SocialLoginButtons = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState<string | null>(null);

  const handleOAuth = async (provider: string) => {
    setLoading(provider);
    try {
      const response = await api.get<{ success: boolean; data: { authUrl: string } }>(
        `/auth/oauth/${provider}`
      );
      const { authUrl } = response.data.data;
      window.location.href = authUrl;
    } catch {
      message.error(t('auth.oauth.failed'));
      setLoading(null);
    }
  };

  return (
    <div style={{ marginTop: 8 }}>
      <Divider style={{ color: '#94a3b8', borderColor: '#e2e8f0' }}>
        <span style={{ color: '#64748b', fontSize: 13 }}>
          {t('auth.oauth.divider')}
        </span>
      </Divider>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Button
          icon={<GithubOutlined />}
          size="large"
          block
          loading={loading === 'github'}
          onClick={() => handleOAuth('github')}
          style={{
            background: '#fff',
            borderColor: '#dbe3ee',
            color: '#0f172a',
            borderRadius: 12,
          }}
        >
          {t('auth.oauth.github')}
        </Button>

        <Button
          icon={<GoogleOutlined />}
          size="large"
          block
          loading={loading === 'google'}
          onClick={() => handleOAuth('google')}
          style={{
            background: '#fff',
            borderColor: '#dbe3ee',
            color: '#0f172a',
            borderRadius: 12,
          }}
        >
          {t('auth.oauth.google')}
        </Button>

        <Button
          icon={<WechatOutlined />}
          size="large"
          block
          loading={loading === 'wechat'}
          onClick={() => handleOAuth('wechat')}
          style={{
            background: '#fff',
            borderColor: '#dbe3ee',
            color: '#0f172a',
            borderRadius: 12,
          }}
        >
          {t('auth.oauth.wechat')}
        </Button>
      </div>
    </div>
  );
};

export default SocialLoginButtons;
