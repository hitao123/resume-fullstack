import { Button, Card, Col, Form, Input, Row, Space, Typography, message } from 'antd';
import { ArrowRightOutlined, CheckCircleFilled, LockOutlined, ThunderboltFilled, UserOutlined } from '@ant-design/icons';
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

const planHighlights = [
  { name: '免费版', detail: '1 份简历 · 3 次 AI · 基础模板' },
  { name: '初级会员', detail: '5 份简历 · 50 次 AI · 高清 PDF' },
  { name: '高级会员', detail: '不限简历 · 300 次 AI · JD 定制优化' },
];

const outcomeHighlights = [
  '10 分钟生成第一版可投递简历',
  '为不同岗位复制出多版本简历',
  '用 AI 优化工作经历与项目亮点',
];

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
      <div style={{ marginBottom: 28 }}>
        <Space direction="vertical" size={10} style={{ width: '100%' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 999, background: 'rgba(22, 50, 79, 0.08)', color: '#16324f', fontSize: 12, fontWeight: 600, width: 'fit-content' }}>
            <ThunderboltFilled />
            AI 简历工作台
          </div>
          <Title level={1} style={{ margin: 0, fontSize: 36, lineHeight: 1.15, color: '#0f172a' }}>
            登录后继续打磨你的下一份 Offer 简历
          </Title>
          <Text style={{ color: '#516074', fontSize: 15, lineHeight: 1.7 }}>
            从模板选择、岗位多版本到 AI 优化和 PDF 导出，所有进度都会保存在你的工作台里。
          </Text>
        </Space>
      </div>

      <Card
        bordered={false}
        style={{
          borderRadius: 24,
          boxShadow: '0 24px 60px rgba(15, 23, 42, 0.12)',
          background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)',
        }}
        bodyStyle={{ padding: 24 }}
      >
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
                background: 'linear-gradient(135deg, #0f6cbd 0%, #1d8f6f 100%)',
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
              <Link to="/register" style={{ color: '#0f6cbd', fontWeight: 700 }}>
                {t('auth.login.signUp')}
              </Link>
            </Text>
          </div>
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <Link to="/pricing" style={{ color: '#1d8f6f', fontWeight: 700 }}>
              查看会员方案
            </Link>
          </div>
        </Form>

        <SocialLoginButtons />
      </Card>

      <Row gutter={[14, 14]} style={{ marginTop: 18 }}>
        {outcomeHighlights.map((item) => (
          <Col span={24} key={item}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', color: '#334155', fontSize: 14 }}>
              <CheckCircleFilled style={{ color: '#1d8f6f', marginTop: 3 }} />
              <span>{item}</span>
            </div>
          </Col>
        ))}
      </Row>

      <Card
        bordered={false}
        style={{ marginTop: 22, borderRadius: 24, background: '#0f172a', color: '#fff' }}
        bodyStyle={{ padding: 22 }}
      >
        <Title level={4} style={{ color: '#fff', marginTop: 0, marginBottom: 14 }}>
          登录后你会立即看到
        </Title>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          {planHighlights.map((item) => (
            <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
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
