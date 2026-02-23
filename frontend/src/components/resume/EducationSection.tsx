import { useState, useEffect } from 'react';
import { Button, List, Card, Modal, Form, Input, DatePicker, Space, Empty, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import type { Education } from '@/types/resume.types';
import resumeService from '@/services/resumeService';
import { useTranslation } from 'react-i18next';
import RichTextEditor from '@/components/common/RichTextEditor';
import SafeHtmlRenderer from '@/components/common/SafeHtmlRenderer';

const { RangePicker } = DatePicker;

interface EducationSectionProps {
  data: Education[];
  onChange: (data: Education[]) => void;
}

export const EducationSection = ({ data, onChange }: EducationSectionProps) => {
  const { id } = useParams<{ id: string }>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Education | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const { t } = useTranslation();

  // Load data when component mounts
  useEffect(() => {
    if (id) {
      loadEducation();
    }
  }, [id]);

  const loadEducation = async () => {
    if (!id) return;
    try {
      const education = await resumeService.getEducation(Number(id));
      onChange(education);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      message.error(t('resume.education.loadFailed', { message: msg }));
    }
  };

  const handleAdd = () => {
    form.resetFields();
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item: Education) => {
    form.setFieldsValue({
      ...item,
      dateRange: item.startDate
        ? [dayjs(item.startDate), item.endDate ? dayjs(item.endDate) : null]
        : null,
    });
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (item: Education) => {
    if (!id) return;

    Modal.confirm({
      title: t('resume.education.deleteConfirmTitle'),
      content: t('resume.education.deleteConfirmContent'),
      onOk: async () => {
        try {
          await resumeService.deleteEducation(Number(id), item.id);
          message.success(t('resume.education.deleteSuccess'));
          await loadEducation();
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : String(error);
          message.error(t('resume.education.deleteFailed', { message: msg }));
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

      const educationData = {
        institution: values.institution,
        degree: values.degree,
        fieldOfStudy: values.fieldOfStudy || '',
        location: values.location || '',
        startDate: startDate ? startDate.format('YYYY-MM-DD') : '',
        endDate: endDate ? endDate.format('YYYY-MM-DD') : '',
        gpa: values.gpa || '',
        description: values.description || '',
        displayOrder: editingItem ? editingItem.displayOrder : data.length,
      };

      if (editingItem) {
        // Update existing
        await resumeService.updateEducation(Number(id), editingItem.id, educationData);
        message.success(t('resume.education.updateSuccess'));
      } else {
        // Create new
        await resumeService.createEducation(Number(id), educationData);
        message.success(t('resume.education.createSuccess'));
      }

      await loadEducation();
      setIsModalOpen(false);
      form.resetFields();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      message.error(
        editingItem
          ? t('resume.education.updateFailed', { message: msg })
          : t('resume.education.createFailed', { message: msg })
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
        {t('resume.education.addButton')}
      </Button>

      {data.length === 0 ? (
        <Empty description={t('resume.education.emptyDescription')} />
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
                <strong style={{ fontSize: 16 }}>{item.institution}</strong>
                <div style={{ color: '#666', marginTop: 4 }}>
                  {item.degree} {item.fieldOfStudy && `· ${item.fieldOfStudy}`}
                </div>
                <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                  {item.startDate} - {item.endDate || t('resume.common.toPresent')}
                  {item.location && ` · ${item.location}`}
                </div>
                {item.gpa && (
                  <div style={{ marginTop: 4, color: '#666' }}>
                    {t('resume.common.gpaLabel')}: {item.gpa}
                  </div>
                )}
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
        title={editingItem ? t('resume.education.modalTitleEdit') : t('resume.education.modalTitleCreate')}
        open={isModalOpen}
        onOk={handleSubmit}
        confirmLoading={saving}
        onCancel={() => setIsModalOpen(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label={t('resume.education.institutionLabel')}
            name="institution"
            rules={[
              { required: true, message: t('resume.education.institutionRequired') },
            ]}
          >
            <Input placeholder={t('resume.education.institutionPlaceholder')} />
          </Form.Item>

          <Form.Item
            label={t('resume.education.degreeLabel')}
            name="degree"
            rules={[{ required: true, message: t('resume.education.degreeRequired') }]}
          >
            <Input placeholder={t('resume.education.degreePlaceholder')} />
          </Form.Item>

          <Form.Item label={t('resume.education.fieldLabel')} name="fieldOfStudy">
            <Input placeholder={t('resume.education.fieldPlaceholder')} />
          </Form.Item>

          <Form.Item label={t('resume.education.locationLabel')} name="location">
            <Input placeholder={t('resume.education.locationPlaceholder')} />
          </Form.Item>

          <Form.Item
            label={t('resume.education.dateRangeLabel')}
            name="dateRange"
            rules={[
              { required: true, message: t('resume.education.dateRangeRequired') },
            ]}
          >
            <RangePicker
              style={{ width: '100%' }}
              picker="month"
              format="YYYY-MM"
              placeholder={[
                t('resume.education.dateRangePlaceholderStart'),
                t('resume.education.dateRangePlaceholderEnd'),
              ]}
            />
          </Form.Item>

          <Form.Item label={t('resume.education.gpaLabel')} name="gpa">
            <Input placeholder={t('resume.education.gpaPlaceholder')} />
          </Form.Item>

          <Form.Item label={t('resume.education.descriptionLabel')} name="description">
            <RichTextEditor placeholder={t('resume.education.descriptionPlaceholder')} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EducationSection;
