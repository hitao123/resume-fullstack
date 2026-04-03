import { useState, useEffect } from 'react';
import { Button, List, Card, Modal, Form, Input, DatePicker, Checkbox, Space, Empty, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import type { WorkExperience } from '@/types/resume.types';
import resumeService from '@/services/resumeService';
import { useTranslation } from 'react-i18next';
import RichTextEditor from '@/components/common/RichTextEditor';
import SafeHtmlRenderer from '@/components/common/SafeHtmlRenderer';
import AIAssistantButton from '@/components/ai/AIAssistantButton';
import AIResultPanel from '@/components/ai/AIResultPanel';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import { enhanceDescription } from '@/services/aiService';

const { RangePicker } = DatePicker;

interface WorkExperienceSectionProps {
  data: WorkExperience[];
  onChange: (data: WorkExperience[]) => void;
}

export const WorkExperienceSection = ({ data, onChange }: WorkExperienceSectionProps) => {
  const { id } = useParams<{ id: string }>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WorkExperience | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const { t, i18n } = useTranslation();
  const ai = useAIAssistant();

  // Load data when component mounts
  useEffect(() => {
    if (id) {
      loadWorkExperiences();
    }
  }, [id]);

  const loadWorkExperiences = async () => {
    if (!id) return;
    try {
      const experiences = await resumeService.getWorkExperiences(Number(id));
      onChange(experiences);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      message.error(t('resume.work.loadFailed', { message: msg }));
    }
  };

  const handleAdd = () => {
    form.resetFields();
    setEditingItem(null);
    ai.reset();
    setIsModalOpen(true);
  };

  const handleEdit = (item: WorkExperience) => {
    form.setFieldsValue({
      ...item,
      dateRange: item.startDate && !item.isCurrent
        ? [dayjs(item.startDate), item.endDate ? dayjs(item.endDate) : null]
        : item.startDate
        ? [dayjs(item.startDate), null]
        : null,
    });
    setEditingItem(item);
    ai.reset();
    setIsModalOpen(true);
  };

  const handleDelete = async (item: WorkExperience) => {
    if (!id) return;

    Modal.confirm({
      title: t('resume.work.deleteConfirmTitle'),
      content: t('resume.work.deleteConfirmContent'),
      onOk: async () => {
        try {
          await resumeService.deleteWorkExperience(Number(id), item.id);
          message.success(t('resume.work.deleteSuccess'));
          await loadWorkExperiences();
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : String(error);
          message.error(t('resume.work.deleteFailed', { message: msg }));
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

      const workExpData = {
        companyName: values.companyName,
        position: values.position,
        location: values.location || '',
        startDate: startDate ? startDate.format('YYYY-MM-DD') : '',
        endDate: values.isCurrent ? '' : (endDate ? endDate.format('YYYY-MM-DD') : ''),
        isCurrent: values.isCurrent || false,
        description: values.description || '',
        displayOrder: editingItem ? editingItem.displayOrder : data.length,
      };

      if (editingItem) {
        // Update existing
        await resumeService.updateWorkExperience(Number(id), editingItem.id, workExpData);
        message.success(t('resume.work.updateSuccess'));
      } else {
        // Create new
        await resumeService.createWorkExperience(Number(id), workExpData);
        message.success(t('resume.work.createSuccess'));
      }

      await loadWorkExperiences();
      setIsModalOpen(false);
      form.resetFields();
      ai.reset();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      message.error(
        editingItem
          ? t('resume.work.updateFailed', { message: msg })
          : t('resume.work.createFailed', { message: msg })
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEnhanceDescription = () => {
    const description = form.getFieldValue('description');
    if (!description) {
      message.warning(t('ai.noContent'));
      return;
    }
    const language = i18n.language.startsWith('zh') ? 'zh' : 'en';
    const position = form.getFieldValue('position') || '';
    const company = form.getFieldValue('companyName') || '';
    ai.startGeneration((callbacks, signal) => {
      enhanceDescription(description, language, callbacks, signal, position, company);
    });
  };

  const handleAcceptDescription = () => {
    form.setFieldsValue({ description: ai.content });
    ai.reset();
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
        {t('resume.work.addButton')}
      </Button>

      {data.length === 0 ? (
        <Empty description={t('resume.work.emptyDescription')} />
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
                <strong style={{ fontSize: 16 }}>{item.position}</strong>
                <div style={{ color: '#666', marginTop: 4 }}>
                  {item.companyName} {item.location && `· ${item.location}`}
                </div>
                <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                  {item.startDate} - {item.isCurrent ? t('resume.common.toPresent') : item.endDate || t('resume.common.toPresent')}
                </div>
                {item.description && (
                  <SafeHtmlRenderer
                    content={item.description}
                    style={{ marginTop: 8, fontSize: 13, color: '#555', lineHeight: 1.6 }}
                  />
                )}
              </div>
            </Card>
          )}
        />
      )}

      <Modal
        title={editingItem ? t('resume.work.modalTitleEdit') : t('resume.work.modalTitleCreate')}
        open={isModalOpen}
        onOk={handleSubmit}
        confirmLoading={saving}
        onCancel={() => { setIsModalOpen(false); ai.reset(); }}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label={t('resume.work.positionLabel')}
            name="position"
            rules={[{ required: true, message: t('resume.work.positionRequired') }]}
          >
            <Input placeholder={t('resume.work.positionPlaceholder')} />
          </Form.Item>

          <Form.Item
            label={t('resume.work.companyLabel')}
            name="companyName"
            rules={[{ required: true, message: t('resume.work.companyRequired') }]}
          >
            <Input placeholder={t('resume.work.companyPlaceholder')} />
          </Form.Item>

          <Form.Item label={t('resume.work.locationLabel')} name="location">
            <Input placeholder={t('resume.work.locationPlaceholder')} />
          </Form.Item>

          <Form.Item
            label={t('resume.work.dateRangeLabel')}
            name="dateRange"
            rules={[{ required: true, message: t('resume.work.dateRangeRequired') }]}
          >
            <RangePicker
              style={{ width: '100%' }}
              picker="month"
              format="YYYY-MM"
              placeholder={[
                t('resume.work.dateRangePlaceholderStart'),
                t('resume.work.dateRangePlaceholderEnd'),
              ]}
            />
          </Form.Item>

          <Form.Item name="isCurrent" valuePropName="checked">
            <Checkbox>{t('resume.work.isCurrentLabel')}</Checkbox>
          </Form.Item>

          <Form.Item
            label={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {t('resume.work.descriptionLabel')}
                <AIAssistantButton
                  onClick={handleEnhanceDescription}
                  loading={ai.isGenerating}
                />
              </div>
            }
            name="description"
          >
            <RichTextEditor placeholder={t('resume.work.descriptionPlaceholder')} />
          </Form.Item>

          <AIResultPanel
            content={ai.content}
            isGenerating={ai.isGenerating}
            error={ai.error}
            onAccept={handleAcceptDescription}
            onDiscard={ai.reset}
          />
        </Form>
      </Modal>
    </div>
  );
};

export default WorkExperienceSection;
