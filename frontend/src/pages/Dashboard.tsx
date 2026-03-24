import { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Empty,
  Row,
  Col,
  Typography,
  Modal,
  Input,
  Form,
  Dropdown,
  Space,
  message,
  Spin,
  Progress,
  Tag,
  Divider,
  List,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  EllipsisOutlined,
  FileTextOutlined,
  ArrowRightOutlined,
  ThunderboltOutlined,
  StarOutlined,
  ExportOutlined,
  ProfileOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useResumeStore } from '@/store/resumeStore';
import { useAuth } from '@/hooks/useAuth';
import type { MenuProps } from 'antd';
import { useTranslation } from 'react-i18next';
import type { ApiError } from '@/types/api.types';
import { openUpgradePrompt } from '@/utils/planMessages';
import { TEMPLATE_NAMES } from '@/utils/constants';
import './CommercialPages.css';

const { Title, Text, Paragraph } = Typography;

const actionCards = [
  {
    key: 'new',
    icon: <PlusOutlined />,
    title: '新建简历',
    description: '从空白版本开始，快速创建新的投递版本。',
    cta: '立即创建',
  },
  {
    key: 'optimize',
    icon: <ThunderboltOutlined />,
    title: 'AI 优化内容',
    description: '把工作经历和项目亮点改写成更适合投递的表达。',
    cta: '去优化',
  },
  {
    key: 'export',
    icon: <ExportOutlined />,
    title: '导出 PDF',
    description: '导出最近版本，直接用于投递或发送给招聘方。',
    cta: '去导出',
  },
];

const planComparisons = [
  { plan: '免费版', points: '1 份简历 · 3 次 AI · 基础模板' },
  { plan: '初级会员', points: '5 份简历 · 50 次 AI · 高清 PDF · 自定义模块' },
  { plan: '高级会员', points: '不限简历 · 300 次 AI · JD 定制 · 多语言简历' },
];

export const Dashboard = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const {
    resumes,
    isLoading,
    fetchResumes,
    createResume,
    deleteResume,
    duplicateResume,
  } = useResumeStore();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchResumes().catch((error) => {
      message.error(t('dashboard.loadFailed', { message: error.message }));
    });
  }, [fetchResumes, t]);

  const showUpgradeGuide = (error: ApiError) => {
    openUpgradePrompt(error);
  };

  const handleCreateResume = async (values: { title: string }) => {
    try {
      const resume = await createResume(values.title || t('dashboard.createDefaultTitle'));
      message.success(t('dashboard.createSuccess'));
      setCreateModalOpen(false);
      form.resetFields();
      navigate(`/editor/${resume.id}`);
    } catch (error: unknown) {
      const apiError = error as ApiError;
      const msg = error instanceof Error ? error.message : String(error);
      showUpgradeGuide(apiError);
      message.error(t('dashboard.createFailed', { message: msg }));
    }
  };

  const handleDeleteResume = (id: number) => {
    Modal.confirm({
      title: t('dashboard.deleteTitle'),
      content: t('dashboard.deleteContent'),
      okText: t('dashboard.deleteOk'),
      okType: 'danger',
      onOk: async () => {
        try {
          await deleteResume(id);
          message.success(t('dashboard.deleted'));
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : String(error);
          message.error(t('dashboard.deleteFailed', { message: msg }));
        }
      },
    });
  };

  const handleDuplicateResume = async (id: number) => {
    try {
      await duplicateResume(id);
      message.success(t('dashboard.duplicated'));
    } catch (error: unknown) {
      const apiError = error as ApiError;
      const msg = error instanceof Error ? error.message : String(error);
      showUpgradeGuide(apiError);
      message.error(t('dashboard.duplicateFailed', { message: msg }));
    }
  };

  const getMenuItems = (resumeId: number): MenuProps['items'] => [
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: t('dashboard.edit'),
      onClick: () => navigate(`/editor/${resumeId}`),
    },
    {
      key: 'duplicate',
      icon: <CopyOutlined />,
      label: t('dashboard.duplicate'),
      onClick: () => handleDuplicateResume(resumeId),
    },
    {
      type: 'divider',
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: t('dashboard.delete'),
      danger: true,
      onClick: () => handleDeleteResume(resumeId),
    },
  ];

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (hours < 1) return t('dashboard.updatedJustNow');
    if (hours < 24) return t('dashboard.updatedHoursAgo', { count: hours });
    if (days < 30) return t('dashboard.updatedDaysAgo', { count: days });
    return date.toLocaleDateString(i18n.language?.startsWith('zh') ? 'zh-CN' : 'en-US');
  };

  const latestResume = resumes[0];
  const resumeLimit = user?.plan?.resumeLimit ?? 0;
  const aiLimit = user?.plan?.aiQuotaMonthly ?? 0;
  const aiUsed = user?.usage?.aiUsed ?? 0;
  const remainingResumeCount = resumeLimit === 0 ? '不限' : Math.max(resumeLimit - resumes.length, 0);
  const remainingAiCount = aiLimit === 0 ? '不限' : Math.max(aiLimit - aiUsed, 0);
  const templateSummary = user?.plan?.templateLimit && user.plan.templateLimit >= 99
    ? '全部模板'
    : `${user?.plan?.templateLimit ?? 1} 个模板`;

  if (isLoading && resumes.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" tip={t('dashboard.loading')} />
      </div>
    );
  }

  return (
    <div className="commerce-page">
      <Card className="commerce-hero" bordered={false} style={{ marginBottom: 24 }}>
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} lg={15}>
            <Space direction="vertical" size={14} style={{ width: '100%' }}>
              <div className="commerce-hero-badge">
                <StarOutlined />
                {user?.plan?.name || '简历工坊工作台'}
              </div>
              <Title level={1} className="commerce-hero-title">
                用一个工作台，持续打磨每一份更接近 Offer 的简历版本
              </Title>
              <Paragraph className="commerce-hero-copy">
                在简历工坊里管理模板、岗位版本、AI 优化和导出节奏。这里不只是存放文件，而是把每一次修改都沉淀成可复用的投递资产。
              </Paragraph>
              <Space wrap size={[12, 12]}>
                <Button
                  type="primary"
                  size="large"
                  icon={<PlusOutlined />}
                  onClick={() => setCreateModalOpen(true)}
                  style={{ minWidth: 150, borderRadius: 14, fontWeight: 600, background: '#fff', color: '#102a43', border: 'none' }}
                >
                  创建新简历
                </Button>
                {latestResume && (
                  <Button
                    size="large"
                    icon={<ArrowRightOutlined />}
                    iconPosition="end"
                    onClick={() => navigate(`/editor/${latestResume.id}`)}
                    style={{ minWidth: 160, borderRadius: 14, fontWeight: 600, background: 'rgba(255,255,255,0.08)', color: '#fff', borderColor: 'rgba(255,255,255,0.22)' }}
                  >
                    继续最近编辑
                  </Button>
                )}
              </Space>
              <div className="commerce-chip-row">
                <div className="commerce-chip">
                  <ProfileOutlined />
                  可继续创建 <strong>{remainingResumeCount}</strong> 份版本
                </div>
                <div className="commerce-chip">
                  <ThunderboltOutlined />
                  本月剩余 <strong>{remainingAiCount}</strong> 次 AI
                </div>
                <div className="commerce-chip">
                  <StarOutlined />
                  当前可用 <strong>{templateSummary}</strong>
                </div>
              </div>
            </Space>
          </Col>
          <Col xs={24} lg={9}>
            <Card bordered={false} className="commerce-hero-panel">
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <div className="commerce-metric-card">
                    <span className="commerce-metric-label">已创建简历</span>
                    <div className="commerce-metric-value">{resumes.length}</div>
                  </div>
                </Col>
                <Col span={12}>
                  <div className="commerce-metric-card">
                    <span className="commerce-metric-label">当前套餐</span>
                    <div className="commerce-metric-value" style={{ fontSize: 18 }}>
                      {user?.plan?.name || '免费版'}
                    </div>
                  </div>
                </Col>
                <Col span={24}>
                  <div className="commerce-meter">
                    <div className="commerce-meter-top">
                      <span className="commerce-meter-label">简历额度</span>
                      <span className="commerce-meter-hint">{resumes.length} / {resumeLimit === 0 ? '不限' : resumeLimit}</span>
                    </div>
                    {resumeLimit > 0 && (
                      <Progress percent={Math.min(100, Math.round((resumes.length / resumeLimit) * 100))} showInfo={false} strokeColor="#0f6cbd" />
                    )}
                  </div>
                </Col>
                <Col span={24}>
                  <div className="commerce-meter">
                    <div className="commerce-meter-top">
                      <span className="commerce-meter-label">本月 AI 用量</span>
                      <span className="commerce-meter-hint">{aiUsed} / {aiLimit || '-'}</span>
                    </div>
                    {aiLimit > 0 && (
                      <Progress percent={Math.min(100, Math.round((aiUsed / aiLimit) * 100))} showInfo={false} strokeColor="#1d8f6f" />
                    )}
                  </div>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </Card>

      <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
        {actionCards.map((item) => (
          <Col xs={24} md={8} key={item.key}>
            <Card className="action-tile" hoverable>
              <div className="action-tile-icon">
                {item.icon}
              </div>
              <Title level={4} style={{ marginTop: 0 }}>{item.title}</Title>
              <Text type="secondary" style={{ lineHeight: 1.7 }}>
                {item.description}
              </Text>
              <div style={{ marginTop: 'auto', paddingTop: 20 }}>
                <Button
                  type={item.key === 'new' ? 'primary' : 'default'}
                  onClick={() => {
                    if (item.key === 'new') setCreateModalOpen(true);
                    if ((item.key === 'optimize' || item.key === 'export') && latestResume) {
                      navigate(`/editor/${latestResume.id}`);
                    }
                  }}
                  style={{ borderRadius: 12 }}
                >
                  {item.cta}
                </Button>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[20, 20]}>
        <Col xs={24} xl={17}>
          <Card
            className="workspace-panel"
            title={
              <div className="workspace-panel-header">
                <div>
                  <Title level={3} className="workspace-panel-title">我的简历版本</Title>
                  <Text className="workspace-panel-subtitle">围绕目标岗位持续复制、优化和导出不同版本。</Text>
                </div>
              </div>
            }
            extra={
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
                新建版本
              </Button>
            }
            bodyStyle={{ paddingTop: 12 }}
          >
            {resumes.length === 0 ? (
              <div style={{ padding: '28px 0 8px' }}>
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <Space direction="vertical">
                      <Text style={{ fontSize: 16, fontWeight: 600 }}>你的工作台还没有简历版本</Text>
                      <Text type="secondary" style={{ maxWidth: 460 }}>
                        先创建一份母版，再为不同岗位复制出专门版本，最后用 AI 和模板把它们完善成可投递状态。
                      </Text>
                    </Space>
                  }
                >
                  <Space wrap>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
                      创建第一份简历
                    </Button>
                    <Button
                      onClick={() => Modal.info({
                        title: '前往会员中心',
                        content: '你可以在会员中心查看套餐并完成高级会员购买。',
                        onOk: () => navigate('/pricing'),
                      })}
                    >
                      查看套餐差异
                    </Button>
                  </Space>
                </Empty>
              </div>
            ) : (
              <Row gutter={[16, 16]}>
                {resumes.map((resume) => (
                  <Col xs={24} md={12} xxl={8} key={resume.id}>
                    <Card
                      className="resume-grid-card"
                      hoverable
                      onClick={() => navigate(`/editor/${resume.id}`)}
                      style={{ minHeight: 250 }}
                      bodyStyle={{ padding: 20 }}
                      actions={[
                        <Dropdown
                          key="actions"
                          menu={{ items: getMenuItems(resume.id) }}
                          trigger={['click']}
                        >
                          <Button
                            type="text"
                            icon={<EllipsisOutlined />}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </Dropdown>,
                      ]}
                    >
                      <div className="resume-card-top">
                        <div className="resume-card-icon">
                          <FileTextOutlined style={{ fontSize: 24, color: '#0f6cbd' }} />
                        </div>
                        <Tag color="blue">{TEMPLATE_NAMES[resume.templateId] || 'Template'}</Tag>
                      </div>
                      <Title level={5} ellipsis={{ rows: 2 }} style={{ minHeight: 46, marginBottom: 10 }}>
                        {resume.title}
                      </Title>
                      <Space wrap size={[8, 8]} style={{ marginBottom: 12 }}>
                        {resume.versionLabel && <Tag>{resume.versionLabel}</Tag>}
                        {resume.targetRole && <Tag color="cyan">{resume.targetRole}</Tag>}
                        {resume.isDefault && <Tag color="gold">默认版本</Tag>}
                      </Space>
                      <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
                        {formatRelativeTime(resume.updatedAt)}
                      </Text>
                      <Divider style={{ margin: '12px 0' }} />
                      <Space direction="vertical" size={6} style={{ width: '100%' }} className="resume-card-footer">
                        <Text style={{ color: '#475569' }}>适合继续做什么</Text>
                        <Text type="secondary">优化描述、调整模板、导出投递版 PDF</Text>
                      </Space>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </Card>
        </Col>

        <Col xs={24} xl={7}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card className="side-rail-card">
              <Title level={4} style={{ marginTop: 0 }}>升级路线</Title>
              <List
                dataSource={planComparisons}
                renderItem={(item) => (
                  <div className="plan-list-item">
                    <Text style={{ display: 'block', fontWeight: 700, color: '#102a43' }}>{item.plan}</Text>
                    <Text style={{ color: '#64748b', lineHeight: 1.7 }}>{item.points}</Text>
                  </div>
                )}
              />
              <Button
                type="primary"
                block
                style={{ marginTop: 8, borderRadius: 12 }}
                onClick={() => navigate('/pricing')}
              >
                前往会员中心
              </Button>
            </Card>

            <Card className="side-rail-card side-rail-card--accent">
              <Title level={4} style={{ marginTop: 0 }}>下一步建议</Title>
              <Space direction="vertical" size={14} style={{ width: '100%' }}>
                <div>
                  <Text strong>1. 保留一个主版本</Text>
                  <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
                    先整理一份完整母版，后续岗位简历都从它复制出来。
                  </Text>
                </div>
                <div>
                  <Text strong>2. 针对岗位拆分版本</Text>
                  <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
                    不同岗位的关键词和项目排序应该不同。
                  </Text>
                </div>
                <div>
                  <Text strong>3. 导出前最后做一轮 AI 优化</Text>
                  <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
                    特别是工作成果和项目描述，最影响投递转化。
                  </Text>
                </div>
              </Space>
            </Card>
          </Space>
        </Col>
      </Row>

      <Modal
        title={t('dashboard.modalTitle')}
        open={createModalOpen}
        onCancel={() => {
          setCreateModalOpen(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateResume}>
          <Form.Item
            label={t('dashboard.resumeTitleLabel')}
            name="title"
            rules={[
              { required: true, message: t('dashboard.resumeTitleRequired') },
              { max: 255, message: t('dashboard.resumeTitleTooLong') },
            ]}
          >
            <Input placeholder={t('dashboard.resumeTitlePlaceholder')} autoFocus />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setCreateModalOpen(false)}>{t('dashboard.cancel')}</Button>
              <Button type="primary" htmlType="submit" loading={isLoading}>
                {t('dashboard.confirmCreate')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Dashboard;
