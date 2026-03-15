import { Form, Input, Button, Typography } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { isValidEmail, validatePassword } from '@/utils/validation';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import LandingLayout from '@/components/landing/LandingLayout';
import SocialLoginButtons from '@/components/auth/SocialLoginButtons';

const { Title, Text } = Typography;

export const Register = () => {
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const onFinish = async (values: {
    email: string;
    password: string;
    name: string;
  }) => {
    setLoading(true);
    try {
      await register(values.email, values.password, values.name);
    } catch {
      // Error is already handled in useAuth hook
    } finally {
      setLoading(false);
    }
  };

  return (
    <LandingLayout>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <Title level={2} style={{ color: '#fff', margin: 0 }}>
          {t('auth.register.title')}
        </Title>
        <Text style={{ color: 'rgba(255,255,255,0.7)' }}>{t('auth.register.subtitle')}</Text>
      </div>

      <Form name="register" onFinish={onFinish} autoComplete="off" layout="vertical">
        <Form.Item
          name="name"
          rules={[
            { required: true, message: t('auth.register.nameRequired') },
            { min: 2, message: t('auth.register.nameMin') },
          ]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder={t('auth.register.fullName')}
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="email"
          rules={[
            { required: true, message: t('auth.register.emailRequired') },
            {
              validator: (_, value) =>
                value && !isValidEmail(value)
                  ? Promise.reject(t('auth.register.emailInvalid'))
                  : Promise.resolve(),
            },
          ]}
        >
          <Input
            prefix={<MailOutlined />}
            placeholder={t('auth.register.email')}
            size="large"
            type="email"
          />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[
            { required: true, message: t('auth.register.passwordRequired') },
            {
              validator: (_, value) => {
                if (!value) return Promise.resolve();
                const validation = validatePassword(value);
                return validation.isValid
                  ? Promise.resolve()
                  : Promise.reject(validation.errors[0]);
              },
            },
          ]}
          hasFeedback
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder={t('auth.register.password')}
            size="large"
          />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          dependencies={['password']}
          rules={[
            { required: true, message: t('auth.register.confirmRequired') },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(t('auth.register.passwordMismatch'));
              },
            }),
          ]}
          hasFeedback
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder={t('auth.register.confirmPassword')}
            size="large"
          />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" size="large" block loading={loading}>
            {t('auth.register.signUp')}
          </Button>
        </Form.Item>

        <div style={{ textAlign: 'center' }}>
          <Text style={{ color: 'rgba(255,255,255,0.7)' }}>
            {t('auth.register.hasAccount')}{' '}
            <Link to="/login" style={{ color: '#fff', fontWeight: 500 }}>
              {t('auth.register.signIn')}
            </Link>
          </Text>
        </div>
      </Form>

      <SocialLoginButtons />
    </LandingLayout>
  );
};

export default Register;
