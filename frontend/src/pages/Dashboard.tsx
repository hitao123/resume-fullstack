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
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  EllipsisOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useResumeStore } from '@/store/resumeStore';
import type { MenuProps } from 'antd';
import { useTranslation } from 'react-i18next';

const { Title, Text } = Typography;

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

  // Load resumes on mount
  useEffect(() => {
    fetchResumes().catch((error) => {
      message.error(t('dashboard.loadFailed', { message: error.message }));
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
      const msg = error instanceof Error ? error.message : String(error);
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
      const msg = error instanceof Error ? error.message : String(error);
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

  if (isLoading && resumes.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" tip={t('dashboard.loading')} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <Title level={2}>{t('dashboard.title')}</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={() => setCreateModalOpen(true)}
        >
          {t('dashboard.new')}
        </Button>
      </div>

      {resumes.length === 0 ? (
        <Card>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Space direction="vertical">
                <Text>{t('dashboard.emptyTitle')}</Text>
                <Text type="secondary">{t('dashboard.emptySubtitle')}</Text>
              </Space>
            }
          >
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalOpen(true)}
            >
              {t('dashboard.create')}
            </Button>
          </Empty>
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {resumes.map((resume) => (
            <Col xs={24} sm={12} md={8} lg={6} key={resume.id}>
              <Card
                hoverable
                onClick={() => navigate(`/editor/${resume.id}`)}
                actions={[
                  <Dropdown
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
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <FileTextOutlined
                    style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }}
                  />
                  <Title level={5} ellipsis={{ rows: 1 }}>
                    {resume.title}
                  </Title>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {formatRelativeTime(resume.updatedAt)}
                  </Text>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

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
            <Input
              placeholder={t('dashboard.resumeTitlePlaceholder')}
              autoFocus
            />
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
