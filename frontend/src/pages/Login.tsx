import { Button, Card, Col, Form, Input, Row, Space, Typography, message } from 'antd';
import { ArrowRightOutlined, CheckCircleFilled, LockOutlined, ThunderboltFilled, UserOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from 'react-i18next';
import LandingLayout from '@/components/landing/LandingLayout';
import SocialLoginButtons from '@/components/auth/SocialLoginButtons';
import './CommercialPages.css';

const { Title, Text } = Typography;

interface LoginFormValues {
  email: string;
  password: string;
}

export const Login = () => {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const { t } = useTranslation();

  const planHighlights = [
    { name: t('dashboard.plan.free'), detail: t('dashboard.plan.freePoints') },
    { name: t('dashboard.plan.starter'), detail: t('dashboard.plan.starterPoints') },
    { name: t('dashboard.plan.pro'), detail: t('dashboard.plan.proPoints') },
  ];

  const outcomeHighlights = [
    t('auth.loginPage.outcomes.item1'),
    t('auth.loginPage.outcomes.item2'),
    t('auth.loginPage.outcomes.item3'),
  ];

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
      <div className="auth-intro">
        <Space direction="vertical" size={10} style={{ width: '100%' }}>
          <div className="auth-eyebrow">
            <ThunderboltFilled />
            {t('auth.loginPage.eyebrow')}
          </div>
          <Title level={1} className="auth-title">
            {t('auth.loginPage.title')}
          </Title>
          <Text className="auth-copy">
            {t('auth.loginPage.subtitle')}
          </Text>
        </Space>
        <div className="auth-stats">
          <div className="auth-stat">
            <span className="auth-stat-value">{t('auth.loginPage.stats.value1')}</span>
            <span className="auth-stat-label">{t('auth.loginPage.stats.label1')}</span>
          </div>
          <div className="auth-stat">
            <span className="auth-stat-value">{t('auth.loginPage.stats.value2')}</span>
            <span className="auth-stat-label">{t('auth.loginPage.stats.label2')}</span>
          </div>
          <div className="auth-stat">
            <span className="auth-stat-value">{t('auth.loginPage.stats.value3')}</span>
            <span className="auth-stat-label">{t('auth.loginPage.stats.label3')}</span>
          </div>
        </div>
      </div>

      <Card className="auth-form-card" bordered={false}>
        <Form name="login" onFinish={onFinish} autoComplete="off" layout="vertical">
          <Form.Item
            name="email"
            label={<span style={{ color: '#334155', fontWeight: 600 }}>{t('auth.login.email')}</span>}
            rules={[
              { required: true, message: t('auth.login.emailRequired') },
              { type: 'email', message: t('auth.login.emailInvalid') },
            ]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#7c8aa0' }} />}
              placeholder={t('auth.login.email')}
              size="large"
              type="email"
              style={{ borderRadius: 14, minHeight: 48 }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={<span style={{ color: '#334155', fontWeight: 600 }}>{t('auth.login.password')}</span>}
            rules={[{ required: true, message: t('auth.login.passwordRequired') }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#7c8aa0' }} />}
              placeholder={t('auth.login.password')}
              size="large"
              style={{ borderRadius: 14, minHeight: 48 }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 12 }}>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={isLoading}
              icon={<ArrowRightOutlined />}
              iconPosition="end"
              style={{
                minHeight: 50,
                borderRadius: 14,
                background: 'linear-gradient(135deg, #c9a35f 0%, #9d6b21 100%)',
                border: 'none',
                fontWeight: 600,
              }}
            >
              {t('auth.login.signIn')}
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <Text style={{ color: '#64748b' }}>
              {t('auth.login.noAccount')}{' '}
              <Link to="/register" style={{ color: '#9d6b21', fontWeight: 700 }}>
                {t('auth.login.signUp')}
              </Link>
            </Text>
          </div>
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <Link to="/pricing" style={{ color: '#c9a35f', fontWeight: 700 }}>
              {t('auth.loginPage.viewPlans')}
            </Link>
          </div>
        </Form>

        <SocialLoginButtons />
      </Card>

      <Row gutter={[14, 14]} className="auth-list">
        {outcomeHighlights.map((item) => (
          <Col span={24} key={item}>
            <div className="auth-list-item">
              <CheckCircleFilled style={{ color: '#c9a35f', marginTop: 3 }} />
              <span>{item}</span>
            </div>
          </Col>
        ))}
      </Row>

      <Card className="auth-plan-card" bordered={false} style={{ background: 'linear-gradient(135deg, #2a2218 0%, #4a3822 100%)', color: '#fff' }}>
        <Title level={4} style={{ color: '#fff', marginTop: 0, marginBottom: 14 }}>
          {t('auth.loginPage.planTitle')}
        </Title>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          {planHighlights.map((item) => (
            <div key={item.name} className="auth-plan-row">
              <Text style={{ color: '#fff', fontWeight: 600 }}>{item.name}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.72)', textAlign: 'right' }}>{item.detail}</Text>
            </div>
          ))}
        </Space>
      </Card>
    </LandingLayout>
  );
};

export default Login;
