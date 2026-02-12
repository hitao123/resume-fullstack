import { Form, Input, Button, Card, Typography } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { isValidEmail, validatePassword } from '@/utils/validation';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';

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
          <Title level={2}>{t('auth.register.title')}</Title>
          <Text type="secondary">{t('auth.register.subtitle')}</Text>
        </div>

        <Form
          name="register"
          onFinish={onFinish}
          autoComplete="off"
          layout="vertical"
        >
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
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
            >
              {t('auth.register.signUp')}
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            <Text type="secondary">
              {t('auth.register.hasAccount')} <Link to="/login">{t('auth.register.signIn')}</Link>
            </Text>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Register;
