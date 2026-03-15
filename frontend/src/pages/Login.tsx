import { Form, Input, Button, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from 'react-i18next';
import LandingLayout from '@/components/landing/LandingLayout';
import SocialLoginButtons from '@/components/auth/SocialLoginButtons';

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
    <LandingLayout>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <Title level={2} style={{ color: '#fff', margin: 0 }}>
          {t('auth.login.title')}
        </Title>
        <Text style={{ color: 'rgba(255,255,255,0.7)' }}>{t('auth.login.subtitle')}</Text>
      </div>

      <Form name="login" onFinish={onFinish} autoComplete="off" layout="vertical">
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
          <Button type="primary" htmlType="submit" size="large" block loading={isLoading}>
            {t('auth.login.signIn')}
          </Button>
        </Form.Item>

        <div style={{ textAlign: 'center' }}>
          <Text style={{ color: 'rgba(255,255,255,0.7)' }}>
            {t('auth.login.noAccount')}{' '}
            <Link to="/register" style={{ color: '#fff', fontWeight: 500 }}>
              {t('auth.login.signUp')}
            </Link>
          </Text>
        </div>
      </Form>

      <SocialLoginButtons />
    </LandingLayout>
  );
};

export default Login;
