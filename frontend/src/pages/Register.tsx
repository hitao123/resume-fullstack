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

const benefits = [
  '注册后就能开始整理你的第一份基础母版',
  '立即体验模板、AI 优化与导出流程',
  '后续可升级解锁更多模板与岗位版本',
];

const plans = [
  { name: '免费版', detail: '1 份简历 · 3 次 AI · 普通 PDF' },
  { name: '初级会员', detail: '5 份简历 · 50 次 AI · 高清 PDF · 自定义模块' },
  { name: '高级会员', detail: '不限简历 · 300 次 AI · JD 优化 · 多语言简历' },
];

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
      <div className="auth-intro">
        <Space direction="vertical" size={10} style={{ width: '100%' }}>
          <div className="auth-eyebrow" style={{ background: 'rgba(29, 143, 111, 0.1)', color: '#166534' }}>
            <RocketFilled />
            简历工坊增长路径
          </div>
          <Title level={1} className="auth-title">
            创建账号，把简历制作从一次性操作变成可复用的工作流
          </Title>
          <Text className="auth-copy">
            一次录入经历，持续产出多个岗位版本，配合 AI 和模板导出，把更新简历这件事从“折腾”变成“复用”。
          </Text>
        </Space>
        <div className="auth-stats">
          <div className="auth-stat">
            <span className="auth-stat-value">1 份</span>
            <span className="auth-stat-label">默认起步简历</span>
          </div>
          <div className="auth-stat">
            <span className="auth-stat-value">模板 + AI</span>
            <span className="auth-stat-label">立即开始体验</span>
          </div>
          <div className="auth-stat">
            <span className="auth-stat-value">可升级</span>
            <span className="auth-stat-label">解锁更多投递版本</span>
          </div>
        </div>
      </div>

      <Card className="auth-form-card" bordered={false}>
        <Form name="register" onFinish={onFinish} autoComplete="off" layout="vertical">
          <Form.Item
            name="name"
            label={<span style={{ color: '#334155', fontWeight: 600 }}>{t('auth.register.fullName')}</span>}
            rules={[
              { required: true, message: t('auth.register.nameRequired') },
              { min: 2, message: t('auth.register.nameMin') },
            ]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#7c8aa0' }} />}
              placeholder={t('auth.register.fullName')}
              size="large"
              style={{ borderRadius: 14, minHeight: 48 }}
            />
          </Form.Item>

          <Form.Item
            name="email"
            label={<span style={{ color: '#334155', fontWeight: 600 }}>{t('auth.register.email')}</span>}
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
              prefix={<MailOutlined style={{ color: '#7c8aa0' }} />}
              placeholder={t('auth.register.email')}
              size="large"
              type="email"
              style={{ borderRadius: 14, minHeight: 48 }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={<span style={{ color: '#334155', fontWeight: 600 }}>{t('auth.register.password')}</span>}
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
              prefix={<LockOutlined style={{ color: '#7c8aa0' }} />}
              placeholder={t('auth.register.password')}
              size="large"
              style={{ borderRadius: 14, minHeight: 48 }}
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label={<span style={{ color: '#334155', fontWeight: 600 }}>{t('auth.register.confirmPassword')}</span>}
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
              prefix={<LockOutlined style={{ color: '#7c8aa0' }} />}
              placeholder={t('auth.register.confirmPassword')}
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
              loading={loading}
              style={{
                minHeight: 50,
                borderRadius: 14,
                background: 'linear-gradient(135deg, #0f6cbd 0%, #1d8f6f 100%)',
                border: 'none',
                fontWeight: 600,
              }}
            >
              {t('auth.register.signUp')}
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <Text style={{ color: '#64748b' }}>
              {t('auth.register.hasAccount')}{' '}
              <Link to="/login" style={{ color: '#0f6cbd', fontWeight: 700 }}>
                {t('auth.register.signIn')}
              </Link>
            </Text>
          </div>
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <Link to="/pricing" style={{ color: '#1d8f6f', fontWeight: 700 }}>
              先看会员方案
            </Link>
          </div>
        </Form>

        <SocialLoginButtons />
      </Card>

      <Row gutter={[14, 14]} className="auth-list">
        {benefits.map((item) => (
          <Col span={24} key={item}>
            <div className="auth-list-item">
              <CheckCircleFilled style={{ color: '#1d8f6f', marginTop: 3 }} />
              <span>{item}</span>
            </div>
          </Col>
        ))}
      </Row>

      <Card className="auth-plan-card" bordered={false} style={{ background: 'linear-gradient(135deg, #102a43 0%, #16324f 100%)' }}>
        <Title level={4} style={{ color: '#fff', marginTop: 0, marginBottom: 14 }}>
          套餐成长路径
        </Title>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          {plans.map((item) => (
            <div key={item.name} className="auth-plan-row">
              <Text style={{ display: 'block', color: '#fff', fontWeight: 600 }}>{item.name}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.72)', textAlign: 'right' }}>{item.detail}</Text>
            </div>
          ))}
        </Space>
      </Card>
    </LandingLayout>
  );
};

export default Register;
