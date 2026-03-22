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
  Statistic,
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

const { Title, Text, Paragraph } = Typography;

const actionCards = [
  {
    key: 'new',
    icon: <PlusOutlined />,
    title: '新建简历',
    description: '从空白版本开始，快速创建新的投递版本',
    cta: '立即创建',
  },
  {
    key: 'optimize',
    icon: <ThunderboltOutlined />,
    title: 'AI 优化内容',
    description: '把工作经历、项目亮点优化成更适合投递的表达',
    cta: '去优化',
  },
  {
    key: 'export',
    icon: <ExportOutlined />,
    title: '导出 PDF',
    description: '导出你最近修改过的版本，用于投递或存档',
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

  if (isLoading && resumes.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" tip={t('dashboard.loading')} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1320, margin: '0 auto' }}>
      <Card
        bordered={false}
        style={{
          marginBottom: 24,
          borderRadius: 28,
          background:
            'radial-gradient(circle at top right, rgba(255,209,102,0.25), transparent 24%), linear-gradient(135deg, #102a43 0%, #16324f 46%, #1f6f78 100%)',
          boxShadow: '0 30px 80px rgba(15, 23, 42, 0.18)',
        }}
        bodyStyle={{ padding: 30 }}
      >
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} lg={15}>
            <Space direction="vertical" size={14} style={{ width: '100%' }}>
              <Tag color="gold" style={{ width: 'fit-content', border: 'none', fontWeight: 600 }}>
                {user?.plan?.name || '简历工作台'}
              </Tag>
              <Title level={1} style={{ color: '#fff', margin: 0, fontSize: 42, lineHeight: 1.05 }}>
                把每一份简历都变成可复制、可升级、可投递的资产
              </Title>
              <Paragraph style={{ color: 'rgba(255,255,255,0.78)', fontSize: 16, maxWidth: 720, marginBottom: 0 }}>
                在这里管理模板、岗位版本、AI 优化和导出节奏。你的工作台不该只是一堆文件，而是一个持续提高投递效率的系统。
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
            </Space>
          </Col>
          <Col xs={24} lg={9}>
            <Card bordered={false} style={{ borderRadius: 22, background: 'rgba(255,255,255,0.92)' }}>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Statistic title="已创建简历" value={resumes.length} prefix={<ProfileOutlined />} />
                </Col>
                <Col span={12}>
                  <Statistic title="当前套餐" value={user?.plan?.name || '免费版'} prefix={<StarOutlined />} />
                </Col>
                <Col span={24}>
                  <Text strong>简历额度</Text>
                  <div style={{ marginTop: 8 }}>
                    <Text>{resumes.length} / {resumeLimit === 0 ? '不限' : resumeLimit}</Text>
                    {resumeLimit > 0 && (
                      <Progress percent={Math.min(100, Math.round((resumes.length / resumeLimit) * 100))} showInfo={false} style={{ marginTop: 8 }} strokeColor="#0f6cbd" />
                    )}
                  </div>
                </Col>
                <Col span={24}>
                  <Text strong>本月 AI 用量</Text>
                  <div style={{ marginTop: 8 }}>
                    <Text>{aiUsed} / {aiLimit || '-'}</Text>
                    {aiLimit > 0 && (
                      <Progress percent={Math.min(100, Math.round((aiUsed / aiLimit) * 100))} showInfo={false} style={{ marginTop: 8 }} strokeColor="#1d8f6f" />
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
            <Card
              hoverable
              style={{ borderRadius: 22, minHeight: 220 }}
              bodyStyle={{ padding: 24, display: 'flex', flexDirection: 'column', height: '100%' }}
            >
              <div style={{ width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg, #dbeafe 0%, #dcfce7 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#102a43', fontSize: 20, marginBottom: 18 }}>
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
                    if (item.key === 'optimize' && latestResume) navigate(`/editor/${latestResume.id}`);
                    if (item.key === 'export' && latestResume) navigate(`/editor/${latestResume.id}`);
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
            title={<span style={{ fontWeight: 700, fontSize: 20 }}>我的简历版本</span>}
            extra={
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
                新建版本
              </Button>
            }
            style={{ borderRadius: 24 }}
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
                        从一个基础版本开始，然后为不同岗位复制出专门版本，再用 AI 和模板把它们完善成可投递状态。
                      </Text>
                    </Space>
                  }
                >
                  <Space wrap>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
                      创建第一份简历
                    </Button>
                    <Button onClick={() => Modal.info({
                      title: '前往会员中心',
                      content: '你可以在会员中心查看套餐并完成高级会员购买。',
                      onOk: () => navigate('/pricing'),
                    })}>
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
                      hoverable
                      onClick={() => navigate(`/editor/${resume.id}`)}
                      style={{ borderRadius: 20, minHeight: 250 }}
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
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                        <div style={{ width: 56, height: 56, borderRadius: 18, background: 'linear-gradient(135deg, #eff6ff 0%, #fef3c7 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                      <Space direction="vertical" size={6} style={{ width: '100%' }}>
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
            <Card style={{ borderRadius: 24 }}>
              <Title level={4} style={{ marginTop: 0 }}>升级路线</Title>
              <List
                dataSource={planComparisons}
                renderItem={(item) => (
                  <List.Item style={{ paddingLeft: 0, paddingRight: 0 }}>
                    <List.Item.Meta
                      title={<span style={{ fontWeight: 700 }}>{item.plan}</span>}
                      description={<span style={{ color: '#64748b', lineHeight: 1.7 }}>{item.points}</span>}
                    />
                  </List.Item>
                )}
              />
              <Button
                type="primary"
                block
                style={{ marginTop: 8, borderRadius: 12 }}
                onClick={() => navigate('/pricing')}
              >
                购买会员
              </Button>
            </Card>

            <Card style={{ borderRadius: 24, background: 'linear-gradient(180deg, #f8fafc 0%, #eef6ff 100%)' }}>
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
                    特别是工作成果和项目描述，最影响转化。
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
