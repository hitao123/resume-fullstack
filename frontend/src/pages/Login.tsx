import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';

const { Title, Text } = Typography;

interface LoginFormValues {
  email: string;
  password: string;
}

export const Login = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const { t } = useTranslation();

  const onFinish = async (values: LoginFormValues) => {
    try {
      await login(values.email, values.password);
      message.success(t('auth.login.success'));
      navigate('/dashboard');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : undefined;
      message.error(msg || t('auth.login.failed'));
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        position: 'relative',
      }}
    >
      <div style={{ position: 'absolute', top: 16, right: 16 }}>
        <LanguageSwitcher variant="default" />
      </div>
      <Card
        style={{
          width: '100%',
          maxWidth: 400,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2}>{t('auth.login.title')}</Title>
          <Text type="secondary">{t('auth.login.subtitle')}</Text>
        </div>

        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          layout="vertical"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: t('auth.login.emailRequired') },
              { type: 'email', message: t('auth.login.emailInvalid') },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder={t('auth.login.email')}
              size="large"
              type="email"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: t('auth.login.passwordRequired') }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder={t('auth.login.password')}
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={isLoading}
            >
              {t('auth.login.signIn')}
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            <Text type="secondary">
              {t('auth.login.noAccount')} <Link to="/register">{t('auth.login.signUp')}</Link>
            </Text>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
