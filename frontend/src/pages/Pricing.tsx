import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, Modal, Row, Segmented, Space, Spin, Tag, Typography, message, List, Radio } from 'antd';
import { CheckCircleFilled, CrownFilled, RocketFilled, SafetyCertificateOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import billingService from '@/services/billingService';
import type { BillingOrder, BillingPlan } from '@/types/billing.types';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from 'react-i18next';
import './CommercialPages.css';

const { Title, Text, Paragraph } = Typography;

const priceLabel = (amount: number) => `¥${(amount / 100).toFixed(0)}`;

export const Pricing = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, isAuthenticated, checkAuth, setUser } = useAuthStore();
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [provider, setProvider] = useState<'mock' | 'stripe' | 'wechat' | 'alipay'>('stripe');
  const [payingPlanCode, setPayingPlanCode] = useState<string | null>(null);
  const [orders, setOrders] = useState<BillingOrder[]>([]);

  const featureListI18n = (plan: BillingPlan) => [
    plan.resumeLimit === 0 ? t('pricing.featureResumesUnlimited') : t('pricing.featureResumes', { count: plan.resumeLimit }),
    t('pricing.featureAiQuota', { count: plan.aiQuotaMonthly }),
    plan.templateLimit >= 99 ? t('pricing.featureAllTemplates') : t('pricing.featureTemplates', { count: plan.templateLimit }),
    plan.allowDuplicate ? t('pricing.featureAllowDuplicate') : t('pricing.featureNoDuplicate'),
    plan.allowCustomSections ? t('pricing.featureAllowCustom') : t('pricing.featureNoCustom'),
    plan.allowHdPdf ? t('pricing.featureHdPdf') : t('pricing.featureNormalPdf'),
    plan.allowJdOptimization ? t('pricing.featureJdOpt') : t('pricing.featureBasicAi'),
    plan.allowMultiLanguage ? t('pricing.featureMultiLang') : t('pricing.featureSingleLang'),
  ];

  useEffect(() => {
    billingService.getPlans()
      .then(setPlans)
      .catch((error) => message.error(error.message || t('pricing.loadFailed')))
      .finally(() => setLoading(false));
  }, [t]);

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
        title: t('pricing.loginToBuy'),
        content: t('pricing.loginToBuyContent'),
        okText: t('pricing.goLogin'),
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
        message.info(t('pricing.alipayOpened'));
        return;
      }

      if (provider === 'wechat' && checkout.codeUrl) {
        Modal.info({
          title: t('pricing.wechatNativeTitle'),
          content: t('pricing.wechatNativeContent', { url: checkout.codeUrl }),
        });
        return;
      }

      Modal.confirm({
        title: t('pricing.confirmPurchaseTitle', { planName: checkout.planName }),
        content: t('pricing.confirmPurchaseContent', { amount: priceLabel(checkout.amount) }),
        okText: t('pricing.confirmPay'),
        cancelText: t('pricing.cancel'),
        onOk: async () => {
          const result = await billingService.payOrder(checkout.orderId);
          setUser(result.user);
          await checkAuth();
          message.success(t('pricing.upgradeSuccess', { planName: result.user.plan?.name || checkout.planName }));
          navigate('/dashboard');
        },
      });
    } catch (error: any) {
      message.error(error.message || t('pricing.purchaseFailed'));
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
            {t('pricing.badgeText')}
          </div>
          <Title level={1} className="commerce-hero-title">
            {t('pricing.heroTitle')}
          </Title>
          <Paragraph className="commerce-hero-copy">
            {t('pricing.heroCopy')}
          </Paragraph>
          <div className="pricing-topbar">
            <Segmented
              value={billingCycle}
              onChange={(value) => setBillingCycle(value as 'monthly' | 'yearly')}
              options={[
                { label: t('pricing.billingMonthly'), value: 'monthly' },
                { label: t('pricing.billingYearly'), value: 'yearly' },
              ]}
            />
            <Radio.Group
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              optionType="button"
              buttonStyle="solid"
              options={[
                { label: 'Stripe Checkout', value: 'stripe' },
                { label: t('pricing.providerWechat'), value: 'wechat' },
                { label: t('pricing.providerAlipay'), value: 'alipay' },
                { label: 'Mock', value: 'mock' },
              ]}
            />
            {user?.plan && <Tag color="gold">{t('pricing.currentPlanLabel', { name: user.plan.name })}</Tag>}
          </div>
        </Space>
      </Card>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <Spin size="large" />
        </div>
      ) : (
        <Row gutter={[20, 20]} align="stretch" className="pricing-main-grid">
          <Col xs={24} xl={17} className="pricing-main-col">
            <Row gutter={[20, 20]} align="stretch">
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
                  <Col xs={24} md={12} xxl={8} key={plan.code} className="pricing-plan-col">
                    <Card className={`pricing-card ${isPopular ? 'pricing-card--featured' : ''}`} bordered={false}>
                      <Space direction="vertical" size={12} style={{ width: '100%' }}>
                        <div className="pricing-card-header">
                          <div className={`pricing-icon ${isPopular ? 'pricing-icon--featured' : 'pricing-icon--default'}`}>
                            {icon}
                          </div>
                          <div>
                            <Title level={3} style={{ margin: 0 }}>{plan.name}</Title>
                            <Space size={[8, 8]} wrap style={{ marginTop: 6 }}>
                              {isPopular && <Tag color="gold">{t('pricing.recommended')}</Tag>}
                              {isCurrent && <Tag color="gold">{t('pricing.currentPlan')}</Tag>}
                            </Space>
                          </div>
                        </div>
                        <div>
                          <Title level={2} style={{ marginBottom: 0 }}>{amount === 0 ? t('pricing.free') : priceLabel(amount)}</Title>
                          <Text type="secondary">{amount === 0 ? t('pricing.startNow') : billingCycle === 'yearly' ? t('pricing.billedYearly') : t('pricing.billedMonthly')}</Text>
                        </div>
                        <div className="pricing-feature-list">
                          {featureListI18n(plan).map((item) => (
                            <div key={item} className="pricing-feature-item">
                              <CheckCircleFilled style={{ color: '#c9a35f', marginTop: 3 }} />
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
                          {isCurrent ? t('pricing.currentActive') : plan.code === 'FREE' ? t('pricing.continueFree') : t('pricing.buyPlan', { name: plan.name })}
                        </Button>
                      </div>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </Col>

          <Col xs={24} xl={7} className="pricing-side-col">
            <Space direction="vertical" size="large" style={{ width: '100%' }} className="pricing-side-stack">
              <Card className="side-rail-card pricing-side-card">
                <Title level={4} style={{ marginTop: 0 }}>{t('pricing.sideAccountStatus')}</Title>
                <Space direction="vertical" size={14} style={{ width: '100%' }}>
                  <div className="pricing-provider-note">
                    <Text strong style={{ display: 'block', color: '#2a2218' }}>{t('pricing.sideCurrentPlan')}</Text>
                    <Text type="secondary">{user?.plan?.name || t('pricing.sideNotLoggedIn')}</Text>
                  </div>
                  <div className="pricing-provider-note">
                    <Text strong style={{ display: 'block', color: '#2a2218' }}>{t('pricing.sideAiUsage')}</Text>
                    <Text type="secondary">{user?.usage?.aiUsed ?? 0} / {user?.plan?.aiQuotaMonthly ?? '-'}</Text>
                  </div>
                  <div className="pricing-provider-note">
                    <Text strong style={{ display: 'block', color: '#2a2218' }}>{t('pricing.sidePaymentMethod')}</Text>
                    <Text type="secondary">{t('pricing.sidePaymentMethodDesc')}</Text>
                  </div>
                </Space>
              </Card>

              <Card className="side-rail-card side-rail-card--accent pricing-side-card">
                <Title level={4} style={{ marginTop: 0 }}>{t('pricing.sidePurchaseInfo')}</Title>
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  <Text type="secondary">{t('pricing.sidePurchaseInfoDesc1')}</Text>
                  <Text type="secondary">{t('pricing.sidePurchaseInfoDesc2')}</Text>
                </Space>
              </Card>

              <Card className="side-rail-card pricing-side-card pricing-orders-card">
                <Title level={4} style={{ marginTop: 0 }}>{t('pricing.sideRecentOrders')}</Title>
                {isAuthenticated ? (
                  <div className="pricing-orders-scroll">
                    <List
                      dataSource={orders}
                      locale={{ emptyText: t('pricing.noOrders') }}
                      renderItem={(item) => (
                        <List.Item style={{ paddingLeft: 0, paddingRight: 0 }}>
                          <List.Item.Meta
                            title={<span style={{ fontWeight: 600 }}>{item.planName}</span>}
                            description={
                              <Space direction="vertical" size={2}>
                                <Text type="secondary">{priceLabel(item.amount)} · {item.billingCycle === 'yearly' ? t('pricing.orderYearly') : t('pricing.orderMonthly')}</Text>
                                <Text type="secondary">{item.status === 'paid' ? t('pricing.orderPaid') : t('pricing.orderPending')} · {new Date(item.createdAt).toLocaleDateString('zh-CN')}</Text>
                              </Space>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  </div>
                ) : (
                  <Text type="secondary">{t('pricing.loginToViewOrders')}</Text>
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
