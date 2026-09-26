import { Button, Card, Col, Form, Input, Row, Space, Typography } from 'antd';
import { CheckCircleFilled, LockOutlined, MailOutlined, RocketFilled, UserOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { isValidEmail, validatePassword } from '@/utils/validation';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import LandingLayout from '@/components/landing/LandingLayout';
import SocialLoginButtons from '@/components/auth/SocialLoginButtons';
import './CommercialPages.css';

const { Title, Text } = Typography;

export const Register = () => {
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const benefits = [
    t('auth.registerPage.benefits.item1'),
    t('auth.registerPage.benefits.item2'),
    t('auth.registerPage.benefits.item3'),
  ];

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
      <div className="auth-intro">
        <Space direction="vertical" size={10} style={{ width: '100%' }}>
          <div className="auth-eyebrow">
            <RocketFilled />
            {t('auth.registerPage.eyebrow')}
          </div>
          <Title level={1} className="auth-title">
            {t('auth.registerPage.title')}
          </Title>
          <Text className="auth-copy">
            {t('auth.registerPage.subtitle')}
          </Text>
        </Space>
        <div className="auth-stats">
          <div className="auth-stat">
            <span className="auth-stat-value">{t('auth.registerPage.stats.value1')}</span>
            <span className="auth-stat-label">{t('auth.registerPage.stats.label1')}</span>
          </div>
          <div className="auth-stat">
            <span className="auth-stat-value">{t('auth.registerPage.stats.value2')}</span>
            <span className="auth-stat-label">{t('auth.registerPage.stats.label2')}</span>
          </div>
          <div className="auth-stat">
            <span className="auth-stat-value">{t('auth.registerPage.stats.value3')}</span>
            <span className="auth-stat-label">{t('auth.registerPage.stats.label3')}</span>
          </div>
        </div>
      </div>

      <Card className="auth-form-card" bordered={false}>
        <Form name="register" onFinish={onFinish} autoComplete="off" layout="vertical">
          <Form.Item
            name="name"
            label={<span style={{ color: '#44403c', fontWeight: 600 }}>{t('auth.register.fullName')}</span>}
            rules={[
              { required: true, message: t('auth.register.nameRequired') },
              { min: 2, message: t('auth.register.nameMin') },
            ]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#a8a29e' }} />}
              placeholder={t('auth.register.fullName')}
              size="large"
              style={{ borderRadius: 10, minHeight: 44 }}
            />
          </Form.Item>

          <Form.Item
            name="email"
            label={<span style={{ color: '#44403c', fontWeight: 600 }}>{t('auth.register.email')}</span>}
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
              prefix={<MailOutlined style={{ color: '#a8a29e' }} />}
              placeholder={t('auth.register.email')}
              size="large"
              type="email"
              style={{ borderRadius: 10, minHeight: 44 }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={<span style={{ color: '#44403c', fontWeight: 600 }}>{t('auth.register.password')}</span>}
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
              prefix={<LockOutlined style={{ color: '#a8a29e' }} />}
              placeholder={t('auth.register.password')}
              size="large"
              style={{ borderRadius: 10, minHeight: 44 }}
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label={<span style={{ color: '#44403c', fontWeight: 600 }}>{t('auth.register.confirmPassword')}</span>}
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
              prefix={<LockOutlined style={{ color: '#a8a29e' }} />}
              placeholder={t('auth.register.confirmPassword')}
              size="large"
              style={{ borderRadius: 10, minHeight: 44 }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 12 }}>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
              style={{
                minHeight: 46,
                borderRadius: 10,
                fontWeight: 600,
              }}
            >
              {t('auth.register.signUp')}
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <Text style={{ color: '#78716c' }}>
              {t('auth.register.hasAccount')}{' '}
              <Link to="/login" style={{ color: '#9d6b21', fontWeight: 700 }}>
                {t('auth.register.signIn')}
              </Link>
            </Text>
          </div>
        </Form>

        <SocialLoginButtons />
      </Card>

      <Row gutter={[14, 14]} className="auth-list">
        {benefits.map((item) => (
          <Col span={24} key={item}>
            <div className="auth-list-item">
              <CheckCircleFilled style={{ color: '#9d6b21', marginTop: 3 }} />
              <span>{item}</span>
            </div>
          </Col>
        ))}
      </Row>

    </LandingLayout>
  );
};

export default Register;
