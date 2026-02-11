import { useState } from 'react';
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
import type { MenuProps } from 'antd';

const { Title, Text } = Typography;

// 模拟数据
const mockResumes = [
  {
    id: 1,
    title: '软件工程师简历',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    title: '前端开发简历',
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

export const Dashboard = () => {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState(mockResumes);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [form] = Form.useForm();

  const handleCreateResume = (values: { title: string }) => {
    const newResume = {
      id: resumes.length + 1,
      title: values.title || '未命名简历',
      updatedAt: new Date().toISOString(),
    };
    setResumes([...resumes, newResume]);
    message.success('简历创建成功');
    setCreateModalOpen(false);
    form.resetFields();
    navigate(`/editor/${newResume.id}`);
  };

  const handleDeleteResume = (id: number) => {
    Modal.confirm({
      title: '删除简历',
      content: '确定要删除这份简历吗？此操作无法撤销。',
      okText: '删除',
      okType: 'danger',
      onOk: () => {
        setResumes(resumes.filter((r) => r.id !== id));
        message.success('简历已删除');
      },
    });
  };

  const handleDuplicateResume = (id: number) => {
    const original = resumes.find((r) => r.id === id);
    if (original) {
      const newResume = {
        id: resumes.length + 1,
        title: `${original.title} - 副本`,
        updatedAt: new Date().toISOString(),
      };
      setResumes([...resumes, newResume]);
      message.success('简历已复制');
    }
  };

  const getMenuItems = (resumeId: number): MenuProps['items'] => [
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: '编辑',
      onClick: () => navigate(`/editor/${resumeId}`),
    },
    {
      key: 'duplicate',
      icon: <CopyOutlined />,
      label: '复制',
      onClick: () => handleDuplicateResume(resumeId),
    },
    {
      type: 'divider',
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: '删除',
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

    if (hours < 1) return '刚刚更新';
    if (hours < 24) return `${hours} 小时前更新`;
    if (days < 30) return `${days} 天前更新`;
    return date.toLocaleDateString('zh-CN');
  };

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
        <Title level={2}>我的简历</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={() => setCreateModalOpen(true)}
        >
          新建简历
        </Button>
      </div>

      {resumes.length === 0 ? (
        <Card>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Space direction="vertical">
                <Text>你还没有任何简历</Text>
                <Text type="secondary">创建你的第一份简历开始吧</Text>
              </Space>
            }
          >
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateModalOpen(true)}
            >
              创建简历
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
        title="创建新简历"
        open={createModalOpen}
        onCancel={() => {
          setCreateModalOpen(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateResume}>
          <Form.Item
            label="简历标题"
            name="title"
            rules={[
              { required: true, message: '请输入简历标题' },
              { max: 255, message: '标题过长' },
            ]}
          >
            <Input
              placeholder="例如：软件工程师简历"
              autoFocus
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setCreateModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                创建
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Dashboard;
