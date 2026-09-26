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
  Tag,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  EllipsisOutlined,
  FileTextOutlined,
  ArrowRightOutlined,
  SkinOutlined,
  StarOutlined,
  ExportOutlined,
  ProfileOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useResumeStore } from '@/store/resumeStore';
import type { MenuProps } from 'antd';
import { useTranslation } from 'react-i18next';
import { getErrorMessage } from '@/utils/apiError';
import { openUpgradePrompt } from '@/utils/planMessages';
import { TEMPLATE_NAME_KEYS, TEMPLATE_OPTIONS } from '@/utils/constants';
import './CommercialPages.css';

const { Title, Text, Paragraph } = Typography;

export const Dashboard = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
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

  const actionCards = [
    {
      key: 'new',
      icon: <PlusOutlined />,
      title: t('dashboard.actions.new.title'),
      description: t('dashboard.actions.new.description'),
      cta: t('dashboard.actions.new.cta'),
    },
    {
      key: 'layout',
      icon: <SkinOutlined />,
      title: t('dashboard.actions.layout.title'),
      description: t('dashboard.actions.layout.description'),
      cta: t('dashboard.actions.layout.cta'),
    },
    {
      key: 'export',
      icon: <ExportOutlined />,
      title: t('dashboard.actions.export.title'),
      description: t('dashboard.actions.export.description'),
      cta: t('dashboard.actions.export.cta'),
    },
  ];

  useEffect(() => {
    fetchResumes().catch((error) => {
      message.error(t('dashboard.loadFailed', { message: getErrorMessage(error) }));
    });
  }, [fetchResumes, t]);

  const handleCreateResume = async (values: { title: string }) => {
    try {
      const resume = await createResume(values.title || t('dashboard.createDefaultTitle'));
      message.success(t('dashboard.createSuccess'));
      setCreateModalOpen(false);
      form.resetFields();
      navigate(`/editor/${resume.id}`);
    } catch (error: unknown) {
      if (openUpgradePrompt(error)) {
        setCreateModalOpen(false);
        form.resetFields();
        return;
      }
      message.error(t('dashboard.createFailed', { message: getErrorMessage(error) }));
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
          message.error(t('dashboard.deleteFailed', { message: getErrorMessage(error) }));
        }
      },
    });
  };

  const handleDuplicateResume = async (id: number) => {
    try {
      await duplicateResume(id);
      message.success(t('dashboard.duplicated'));
    } catch (error: unknown) {
      if (openUpgradePrompt(error)) return;
      message.error(t('dashboard.duplicateFailed', { message: getErrorMessage(error) }));
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
  const templateSummary = t('dashboard.templateCount', { count: TEMPLATE_OPTIONS.length });

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
                {t('dashboard.workspaceName')}
              </div>
              <Title level={1} className="commerce-hero-title">
                {t('dashboard.heroTitle')}
              </Title>
              <Paragraph className="commerce-hero-copy">
                {t('dashboard.heroCopy')}
              </Paragraph>
              <Space wrap size={[12, 12]}>
                <Button
                  type="primary"
                  size="large"
                  icon={<PlusOutlined />}
                  onClick={() => setCreateModalOpen(true)}
                  style={{ minWidth: 150, borderRadius: 10, fontWeight: 600 }}
                >
                  {t('dashboard.createResumeButton')}
                </Button>
                {latestResume && (
                  <Button
                    size="large"
                    icon={<ArrowRightOutlined />}
                    iconPosition="end"
                    onClick={() => navigate(`/editor/${latestResume.id}`)}
                    style={{ minWidth: 160, borderRadius: 10, fontWeight: 600, background: '#ffffff', color: '#44403c', borderColor: '#dbd6cd' }}
                  >
                    {t('dashboard.continueLastEdit')}
                  </Button>
                )}
                <Button
                  size="large"
                  icon={<AppstoreOutlined />}
                  onClick={() => navigate('/')}
                  style={{ minWidth: 160, borderRadius: 10, fontWeight: 600, background: '#ffffff', color: '#44403c', borderColor: '#dbd6cd' }}
                >
                  {t('dashboard.browseTemplates')}
                </Button>
              </Space>
              <div className="commerce-chip-row">
                <div className="commerce-chip">
                  <ProfileOutlined />
                  {t('dashboard.chipVersions', { count: resumes.length })}
                </div>
                <div className="commerce-chip">
                  <SkinOutlined />
                  {t('dashboard.chipStyles')}
                </div>
                <div className="commerce-chip">
                  <StarOutlined />
                  {t('dashboard.chipCurrentAvailablePrefix')} <strong>{templateSummary}</strong>
                </div>
              </div>
            </Space>
          </Col>
          <Col xs={24} lg={9}>
            <Card bordered={false} className="commerce-hero-panel">
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <div className="commerce-metric-card">
                    <span className="commerce-metric-label">{t('dashboard.metrics.resumesCreated')}</span>
                    <div className="commerce-metric-value">{resumes.length}</div>
                  </div>
                </Col>
                <Col span={12}>
                  <div className="commerce-metric-card">
                    <span className="commerce-metric-label">{t('dashboard.metrics.templates')}</span>
                    <div className="commerce-metric-value" style={{ fontSize: 18 }}>
                      {TEMPLATE_OPTIONS.length}
                    </div>
                  </div>
                </Col>
                <Col span={24}>
                  <Text>{t('dashboard.layoutTip')}</Text>
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
                    if ((item.key === 'layout' || item.key === 'export') && latestResume) {
                      navigate(`/editor/${latestResume.id}`);
                    }
                  }}
                  style={{ borderRadius: 10 }}
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
                          <Title level={3} className="workspace-panel-title">{t('dashboard.workspacePanelTitle')}</Title>
                          <Text className="workspace-panel-subtitle">{t('dashboard.workspacePanelSubtitle')}</Text>
                </div>
              </div>
            }
            extra={
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
                        {t('dashboard.newVersionButton')}
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
                              <Text style={{ fontSize: 16, fontWeight: 600 }}>{t('dashboard.emptyWorkspaceTitle')}</Text>
                      <Text type="secondary" style={{ maxWidth: 460 }}>
                                {t('dashboard.emptyWorkspaceSubtitle')}
                      </Text>
                    </Space>
                  }
                >
                  <Space wrap>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
                              {t('dashboard.createFirstResumeButton')}
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
                          <FileTextOutlined style={{ fontSize: 24, color: '#9d6b21' }} />
                        </div>
                        <Tag color="gold">{t(TEMPLATE_NAME_KEYS[resume.templateId] || 'common.template')}</Tag>
                      </div>
                      <Title level={5} ellipsis={{ rows: 2 }} style={{ minHeight: 46, marginBottom: 10 }}>
                        {resume.title}
                      </Title>
                      <Space wrap size={[8, 8]} style={{ marginBottom: 12 }}>
                        {resume.versionLabel && <Tag>{resume.versionLabel}</Tag>}
                        {resume.targetRole && <Tag color="gold">{resume.targetRole}</Tag>}
                        {resume.isDefault && <Tag color="gold">{t('dashboard.defaultVersion')}</Tag>}
                      </Space>
                      <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
                        {formatRelativeTime(resume.updatedAt)}
                      </Text>
                      {/* <Divider style={{ margin: '12px 0' }} /> */}
                      <Space direction="vertical" size={6} style={{ width: '100%' }} className="resume-card-footer">
                        <Text style={{ color: '#57534e' }}>{t('dashboard.nextStepsTitle')}</Text>
                        <Text type="secondary">{t('dashboard.nextStepsHint')}</Text>
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
            <Card className="side-rail-card side-rail-card--accent">
              <Title level={4} style={{ marginTop: 0 }}>{t('dashboard.nextStepsPanelTitle')}</Title>
              <Space direction="vertical" size={14} style={{ width: '100%' }}>
                <div>
                  <Text strong>{t('dashboard.step1Title')}</Text>
                  <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
                    {t('dashboard.step1Description')}
                  </Text>
                </div>
                <div>
                  <Text strong>{t('dashboard.step2Title')}</Text>
                  <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
                    {t('dashboard.step2Description')}
                  </Text>
                </div>
                <div>
                  <Text strong>{t('dashboard.step3Title')}</Text>
                  <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
                    {t('dashboard.step3Description')}
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
