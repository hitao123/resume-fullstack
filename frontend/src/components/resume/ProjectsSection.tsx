import { useState, useEffect } from 'react';
import { Button, List, Card, Modal, Form, Input, DatePicker, Space, Empty, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import type { Project } from '@/types/resume.types';
import resumeService from '@/services/resumeService';
import { useTranslation } from 'react-i18next';
import RichTextEditor from '@/components/common/RichTextEditor';
import SafeHtmlRenderer from '@/components/common/SafeHtmlRenderer';

const { RangePicker } = DatePicker;

interface ProjectsSectionProps {
  data: Project[];
  onChange: (data: Project[]) => void;
}

export const ProjectsSection = ({ data, onChange }: ProjectsSectionProps) => {
  const { id } = useParams<{ id: string }>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Project | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const { t } = useTranslation();

  // Load data when component mounts
  useEffect(() => {
    if (id) {
      loadProjects();
    }
  }, [id]);

  const loadProjects = async () => {
    if (!id) return;
    try {
      const projects = await resumeService.getProjects(Number(id));
      onChange(projects);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      message.error(t('resume.projects.loadFailed', { message: msg }));
    }
  };

  const handleAdd = () => {
    form.resetFields();
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: Project) => {
    form.setFieldsValue({
      ...item,
      dateRange: item.startDate
        ? [dayjs(item.startDate), item.endDate ? dayjs(item.endDate) : null]
        : null,
    });
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (item: Project) => {
    if (!id) return;

    Modal.confirm({
      title: t('resume.projects.deleteConfirmTitle'),
      content: t('resume.projects.deleteConfirmContent'),
      onOk: async () => {
        try {
          await resumeService.deleteProject(Number(id), item.id);
          message.success(t('resume.projects.deleteSuccess'));
          await loadProjects();
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : String(error);
          message.error(t('resume.projects.deleteFailed', { message: msg }));
        }
      },
    });
  };

  const handleSubmit = async () => {
    if (!id) return;

    try {
      const values = await form.validateFields();
      const [startDate, endDate] = values.dateRange || [null, null];

      setSaving(true);

      const projectData = {
        name: values.name,
        description: values.description || '',
        technologies: values.technologies || '',
        url: values.url || '',
        githubUrl: values.githubUrl || '',
        startDate: startDate ? startDate.format('YYYY-MM-DD') : '',
        endDate: endDate ? endDate.format('YYYY-MM-DD') : '',
        displayOrder: editingItem ? editingItem.displayOrder : data.length,
      };

      if (editingItem) {
        // Update existing
        await resumeService.updateProject(Number(id), editingItem.id, projectData);
        message.success(t('resume.projects.updateSuccess'));
      } else {
        // Create new
        await resumeService.createProject(Number(id), projectData);
        message.success(t('resume.projects.createSuccess'));
      }

      await loadProjects();
      setIsModalOpen(false);
      form.resetFields();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      message.error(
        editingItem
          ? t('resume.projects.updateFailed', { message: msg })
          : t('resume.projects.createFailed', { message: msg })
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Button
        type="dashed"
        icon={<PlusOutlined />}
        onClick={handleAdd}
        block
        size="large"
        style={{ marginBottom: 16 }}
      >
        {t('resume.projects.addButton')}
      </Button>

      {data.length === 0 ? (
        <Empty description={t('resume.projects.emptyDescription')} />
      ) : (
        <List
          dataSource={data}
          renderItem={(item) => (
            <Card
              key={item.id}
              style={{ marginBottom: 12 }}
              bodyStyle={{ padding: 16 }}
              extra={
                <Space>
                  <Button
                    type="link"
                    icon={<EditOutlined />}
                    onClick={() => handleEdit(item)}
                  />
                  <Button
                    type="link"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDelete(item)}
                  />
                </Space>
              }
            >
              <div>
                <strong style={{ fontSize: 16 }}>{item.name}</strong>
                {item.startDate && (
                  <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                    {item.startDate} - {item.endDate || t('resume.common.toPresent')}
                  </div>
                )}
                {item.technologies && (
                  <div style={{ color: '#666', marginTop: 4 }}>
                    {t('resume.projects.techPrefix')}: {item.technologies}
                  </div>
                )}
                {item.description && (
                  <SafeHtmlRenderer
                    content={item.description}
                    style={{ marginTop: 8, fontSize: 13, color: '#555', lineHeight: 1.6 }}
                  />
                )}
                {(item.url || item.githubUrl) && (
                  <div style={{ marginTop: 8, fontSize: 12 }}>
                    {item.url && (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ marginRight: 12 }}>
                        {t('resume.projects.urlText')}
                      </a>
                    )}
                    {item.githubUrl && (
                      <a href={item.githubUrl} target="_blank" rel="noopener noreferrer">
                        GitHub
                      </a>
                    )}
                  </div>
                )}
              </div>
            </Card>
          )}
        />
      )}

      <Modal
        title={editingItem ? t('resume.projects.modalTitleEdit') : t('resume.projects.modalTitleCreate')}
        open={isModalOpen}
        onOk={handleSubmit}
        confirmLoading={saving}
        onCancel={() => setIsModalOpen(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label={t('resume.projects.nameLabel')}
            name="name"
            rules={[{ required: true, message: t('resume.projects.nameRequired') }]}
          >
            <Input placeholder={t('resume.projects.namePlaceholder')} />
          </Form.Item>

          <Form.Item label={t('resume.projects.techLabel')} name="technologies">
            <Input placeholder={t('resume.projects.techPlaceholder')} />
          </Form.Item>

          <Form.Item label={t('resume.projects.timeLabel')} name="dateRange">
            <RangePicker
              style={{ width: '100%' }}
              picker="month"
              format="YYYY-MM"
              placeholder={[
                t('resume.projects.timePlaceholderStart'),
                t('resume.projects.timePlaceholderEnd'),
              ]}
            />
          </Form.Item>

          <Form.Item label={t('resume.projects.descriptionLabel')} name="description">
            <RichTextEditor placeholder={t('resume.projects.descriptionPlaceholder')} />
          </Form.Item>

          <Form.Item label={t('resume.projects.urlLabel')} name="url">
            <Input placeholder={t('resume.projects.urlPlaceholder')} />
          </Form.Item>

          <Form.Item label={t('resume.projects.githubLabel')} name="githubUrl">
            <Input placeholder={t('resume.projects.githubPlaceholder')} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProjectsSection;
