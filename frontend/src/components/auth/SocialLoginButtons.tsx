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
      <Divider style={{ color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.15)' }}>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
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
            background: 'rgba(255,255,255,0.08)',
            borderColor: 'rgba(255,255,255,0.2)',
            color: '#fff',
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
            background: 'rgba(255,255,255,0.08)',
            borderColor: 'rgba(255,255,255,0.2)',
            color: '#fff',
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
            background: 'rgba(255,255,255,0.08)',
            borderColor: 'rgba(255,255,255,0.2)',
            color: '#fff',
          }}
        >
          {t('auth.oauth.wechat')}
        </Button>
      </div>
    </div>
  );
};

export default SocialLoginButtons;
