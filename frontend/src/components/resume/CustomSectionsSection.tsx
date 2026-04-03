import { useEffect, useState } from 'react';
import { Button, Card, Empty, Form, Input, List, Modal, Space, message } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { CustomSection } from '@/types/resume.types';
import resumeService from '@/services/resumeService';
import RichTextEditor from '@/components/common/RichTextEditor';
import SafeHtmlRenderer from '@/components/common/SafeHtmlRenderer';
import type { ApiError } from '@/types/api.types';
import { openUpgradePrompt } from '@/utils/planMessages';

interface CustomSectionsSectionProps {
  data: CustomSection[];
  onChange: (data: CustomSection[]) => void;
}

const CustomSectionsSection = ({ data, onChange }: CustomSectionsSectionProps) => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CustomSection | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const showUpgradeGuide = (error: ApiError) => {
    openUpgradePrompt(error);
  };

  const loadData = async () => {
    if (!id) return;
    try {
      onChange(await resumeService.getCustomSections(Number(id)));
    } catch (error) {
      message.error(t('resume.customSections.loadFailed', { message: error instanceof Error ? error.message : String(error) }));
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleSubmit = async () => {
    if (!id) return;
    try {
      const values = await form.validateFields();
      setSaving(true);
      const payload = {
        title: values.title,
        content: values.content || '',
        displayOrder: editingItem ? editingItem.displayOrder : data.length,
      };
      if (editingItem) {
        await resumeService.updateCustomSection(Number(id), editingItem.id, payload);
      } else {
        await resumeService.createCustomSection(Number(id), payload);
      }
      await loadData();
      setOpen(false);
      form.resetFields();
      setEditingItem(null);
    } catch (error) {
      showUpgradeGuide(error as ApiError);
      message.error(t('resume.customSections.saveFailed', { message: error instanceof Error ? error.message : String(error) }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Button type="dashed" icon={<PlusOutlined />} block size="large" style={{ marginBottom: 16 }} onClick={() => { form.resetFields(); setEditingItem(null); setOpen(true); }}>
        {t('resume.customSections.addButton')}
      </Button>
      {data.length === 0 ? <Empty description={t('resume.customSections.emptyDescription')} /> : (
        <List
          dataSource={data}
          renderItem={(item) => (
            <Card
              key={item.id}
              style={{ marginBottom: 12 }}
              bodyStyle={{ padding: 16 }}
              extra={
                <Space>
                  <Button type="link" icon={<EditOutlined />} onClick={() => { setEditingItem(item); form.setFieldsValue(item); setOpen(true); }} />
                  <Button type="link" danger icon={<DeleteOutlined />} onClick={() => {
                    Modal.confirm({
                      title: t('resume.customSections.deleteTitle'),
                      content: t('resume.customSections.deleteContent'),
                      onOk: async () => {
                        if (!id) return;
                        await resumeService.deleteCustomSection(Number(id), item.id);
                        await loadData();
                      },
                    });
                  }} />
                </Space>
              }
            >
              <strong>{item.title}</strong>
              {item.content && <SafeHtmlRenderer content={item.content} style={{ marginTop: 8, lineHeight: 1.6, color: '#555' }} />}
            </Card>
          )}
        />
      )}
      <Modal title={editingItem ? t('resume.customSections.modalTitleEdit') : t('resume.customSections.modalTitleCreate')} open={open} onOk={handleSubmit} confirmLoading={saving} onCancel={() => setOpen(false)} width={700}>
        <Form form={form} layout="vertical">
          <Form.Item label={t('resume.customSections.titleLabel')} name="title" rules={[{ required: true, message: t('resume.customSections.titleRequired') }]}>
            <Input placeholder={t('resume.customSections.titlePlaceholder')} />
          </Form.Item>
          <Form.Item label={t('resume.customSections.contentLabel')} name="content">
            <RichTextEditor placeholder={t('resume.customSections.contentPlaceholder')} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CustomSectionsSection;
