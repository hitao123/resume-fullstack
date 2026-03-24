import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, Modal, Row, Segmented, Space, Spin, Tag, Typography, message, List, Radio } from 'antd';
import { CheckCircleFilled, CrownFilled, RocketFilled, SafetyCertificateOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import billingService from '@/services/billingService';
import type { BillingOrder, BillingPlan } from '@/types/billing.types';
import { useAuthStore } from '@/store/authStore';
import './CommercialPages.css';

const { Title, Text, Paragraph } = Typography;

const priceLabel = (amount: number) => `¥${(amount / 100).toFixed(0)}`;

const featureList = (plan: BillingPlan) => [
  `${plan.resumeLimit === 0 ? '不限' : plan.resumeLimit} 份简历`,
  `${plan.aiQuotaMonthly} 次 AI / 月`,
  `${plan.templateLimit >= 99 ? '全部模板' : `${plan.templateLimit} 个模板`}`,
  plan.allowDuplicate ? '支持复制简历' : '不支持复制简历',
  plan.allowCustomSections ? '支持自定义模块' : '不支持自定义模块',
  plan.allowHdPdf ? '高清 PDF 导出' : '普通 PDF 导出',
  plan.allowJdOptimization ? 'JD 定制优化' : '基础 AI 优化',
  plan.allowMultiLanguage ? '多语言简历' : '单语言简历',
];

export const Pricing = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, checkAuth, setUser } = useAuthStore();
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [provider, setProvider] = useState<'mock' | 'stripe' | 'wechat' | 'alipay'>('stripe');
  const [payingPlanCode, setPayingPlanCode] = useState<string | null>(null);
  const [orders, setOrders] = useState<BillingOrder[]>([]);

  useEffect(() => {
    billingService.getPlans()
      .then(setPlans)
      .catch((error) => message.error(error.message || '加载套餐失败'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    billingService.getOrders()
      .then(setOrders)
      .catch(() => undefined);
  }, [isAuthenticated]);

  const sortedPlans = useMemo(
    () => [...plans].sort((a, b) => a.priceMonthly - b.priceMonthly),
    [plans]
  );

  const handlePurchase = async (plan: BillingPlan) => {
    if (!isAuthenticated) {
      Modal.confirm({
        title: '登录后购买会员',
        content: '购买高级会员需要先登录账号，登录后会立即返回购买流程。',
        okText: '去登录',
        onOk: () => navigate('/login'),
      });
      return;
    }

    try {
      setPayingPlanCode(plan.code);
      const checkout = await billingService.checkout(plan.code, billingCycle, provider);

      if (provider === 'stripe' && checkout.checkoutUrl) {
        window.location.href = checkout.checkoutUrl;
        return;
      }

      if (provider === 'alipay' && checkout.formHtml) {
        const win = window.open('', '_blank');
        if (win) {
          win.document.write(checkout.formHtml);
          win.document.close();
        }
        message.info('支付宝支付页已打开');
        return;
      }

      if (provider === 'wechat' && checkout.codeUrl) {
        Modal.info({
          title: '微信 Native 支付',
          content: `当前已生成支付链接。等你给到完整微信支付配置后，这里会替换成真正的二维码。临时链接：${checkout.codeUrl}`,
        });
        return;
      }

      Modal.confirm({
        title: `确认购买 ${checkout.planName}`,
        content: `当前将使用模拟支付完成购买，金额 ${priceLabel(checkout.amount)}，支付成功后会立即升级账号套餐。`,
        okText: '确认支付',
        cancelText: '取消',
        onOk: async () => {
          const result = await billingService.payOrder(checkout.orderId);
          setUser(result.user);
          await checkAuth();
          message.success(`已成功升级到 ${result.user.plan?.name || checkout.planName}`);
          navigate('/dashboard');
        },
      });
    } catch (error: any) {
      message.error(error.message || '购买失败');
    } finally {
      setPayingPlanCode(null);
    }
  };

  return (
    <div className="pricing-shell">
      <Card className="commerce-hero" bordered={false} style={{ marginBottom: 24 }}>
        <Space direction="vertical" size={14} style={{ width: '100%' }}>
          <div className="commerce-hero-badge">
            <SafetyCertificateOutlined />
            简历工坊会员中心
          </div>
          <Title level={1} className="commerce-hero-title">
            选择适合你的会员方案，把简历制作升级成稳定的求职系统
          </Title>
          <Paragraph className="commerce-hero-copy">
            根据你的投递密度选择不同层级的模板、AI 配额和导出能力。升级后会立即刷新账号状态，继续在当前工作台里完成求职流程。
          </Paragraph>
          <div className="pricing-topbar">
            <Segmented
              value={billingCycle}
              onChange={(value) => setBillingCycle(value as 'monthly' | 'yearly')}
              options={[
                { label: '按月付费', value: 'monthly' },
                { label: '按年付费', value: 'yearly' },
              ]}
            />
            <Radio.Group
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              optionType="button"
              buttonStyle="solid"
              options={[
                { label: 'Stripe Checkout', value: 'stripe' },
                { label: '微信 Native', value: 'wechat' },
                { label: '支付宝 Page Pay', value: 'alipay' },
                { label: 'Mock', value: 'mock' },
              ]}
            />
            {user?.plan && <Tag color="blue">当前套餐：{user.plan.name}</Tag>}
          </div>
        </Space>
      </Card>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <Spin size="large" />
        </div>
      ) : (
        <Row gutter={[20, 20]}>
          <Col xs={24} xl={17}>
            <Row gutter={[20, 20]}>
              {sortedPlans.map((plan) => {
                const isCurrent = user?.plan?.code === plan.code;
                const isPopular = plan.code === 'PRO';
                const amount = billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;
                const icon = plan.code === 'FREE'
                  ? <RocketFilled />
                  : plan.code === 'STARTER'
                    ? <CheckCircleFilled />
                    : <CrownFilled />;

                return (
                  <Col xs={24} md={12} xxl={8} key={plan.code}>
                    <Card className={`pricing-card ${isPopular ? 'pricing-card--featured' : ''}`} bordered={false}>
                      <Space direction="vertical" size={12} style={{ width: '100%' }}>
                        <div className="pricing-card-header">
                          <div className={`pricing-icon ${isPopular ? 'pricing-icon--featured' : 'pricing-icon--default'}`}>
                            {icon}
                          </div>
                          <div>
                            <Title level={3} style={{ margin: 0 }}>{plan.name}</Title>
                            <Space size={[8, 8]} wrap style={{ marginTop: 6 }}>
                              {isPopular && <Tag color="gold">推荐购买</Tag>}
                              {isCurrent && <Tag color="blue">当前套餐</Tag>}
                            </Space>
                          </div>
                        </div>
                        <div>
                          <Title level={2} style={{ marginBottom: 0 }}>{amount === 0 ? '免费' : priceLabel(amount)}</Title>
                          <Text type="secondary">{amount === 0 ? '立即开始体验' : billingCycle === 'yearly' ? '按年结算' : '按月结算'}</Text>
                        </div>
                        <div className="pricing-feature-list">
                          {featureList(plan).map((item) => (
                            <div key={item} className="pricing-feature-item">
                              <CheckCircleFilled style={{ color: '#1d8f6f', marginTop: 3 }} />
                              <Text style={{ color: '#334155' }}>{item}</Text>
                            </div>
                          ))}
                        </div>
                      </Space>
                      <div style={{ marginTop: 'auto', paddingTop: 24 }}>
                        <Button
                          type={isPopular ? 'primary' : 'default'}
                          block
                          size="large"
                          loading={payingPlanCode === plan.code}
                          disabled={isCurrent}
                          onClick={() => handlePurchase(plan)}
                          style={{ borderRadius: 14, minHeight: 48, fontWeight: 600 }}
                        >
                          {isCurrent ? '当前已生效' : plan.code === 'FREE' ? '继续使用免费版' : `购买${plan.name}`}
                        </Button>
                      </div>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </Col>

          <Col xs={24} xl={7}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Card className="side-rail-card pricing-side-card">
                <Title level={4} style={{ marginTop: 0 }}>当前账号状态</Title>
                <Space direction="vertical" size={14} style={{ width: '100%' }}>
                  <div className="pricing-provider-note">
                    <Text strong style={{ display: 'block', color: '#102a43' }}>当前套餐</Text>
                    <Text type="secondary">{user?.plan?.name || '未登录'}</Text>
                  </div>
                  <div className="pricing-provider-note">
                    <Text strong style={{ display: 'block', color: '#102a43' }}>AI 用量</Text>
                    <Text type="secondary">{user?.usage?.aiUsed ?? 0} / {user?.plan?.aiQuotaMonthly ?? '-'}</Text>
                  </div>
                  <div className="pricing-provider-note">
                    <Text strong style={{ display: 'block', color: '#102a43' }}>支付方式</Text>
                    <Text type="secondary">当前支持 Stripe Checkout、微信 Native、支付宝 Page Pay 和本地 Mock 测试。</Text>
                  </div>
                </Space>
              </Card>

              <Card className="side-rail-card side-rail-card--accent pricing-side-card">
                <Title level={4} style={{ marginTop: 0 }}>购买说明</Title>
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  <Text type="secondary">升级后会立即生效，当前账号的套餐状态和权益会同步刷新。</Text>
                  <Text type="secondary">如果你暂时只想体验流程，可以先选择 Mock 支付完成本地验证。</Text>
                </Space>
              </Card>

              <Card className="side-rail-card pricing-side-card">
                <Title level={4} style={{ marginTop: 0 }}>最近订单</Title>
                {isAuthenticated ? (
                  <List
                    dataSource={orders}
                    locale={{ emptyText: '还没有订单记录' }}
                    renderItem={(item) => (
                      <List.Item style={{ paddingLeft: 0, paddingRight: 0 }}>
                        <List.Item.Meta
                          title={<span style={{ fontWeight: 600 }}>{item.planName}</span>}
                          description={
                            <Space direction="vertical" size={2}>
                              <Text type="secondary">{priceLabel(item.amount)} · {item.billingCycle === 'yearly' ? '年付' : '月付'}</Text>
                              <Text type="secondary">{item.status === 'paid' ? '已支付' : '待支付'} · {new Date(item.createdAt).toLocaleDateString('zh-CN')}</Text>
                            </Space>
                          }
                        />
                      </List.Item>
                    )}
                  />
                ) : (
                  <Text type="secondary">登录后可查看你的购买记录和当前会员状态。</Text>
                )}
              </Card>
            </Space>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default Pricing;
