import { useEffect, useState } from 'react';
import { Button, Card, DatePicker, Empty, Form, Input, List, Modal, Space, message } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import type { Award } from '@/types/resume.types';
import resumeService from '@/services/resumeService';
import RichTextEditor from '@/components/common/RichTextEditor';
import SafeHtmlRenderer from '@/components/common/SafeHtmlRenderer';
import type { ApiError } from '@/types/api.types';
import { openUpgradePrompt } from '@/utils/planMessages';

interface AwardsSectionProps {
  data: Award[];
  onChange: (data: Award[]) => void;
}

const AwardsSection = ({ data, onChange }: AwardsSectionProps) => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Award | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const showUpgradeGuide = (error: ApiError) => {
    openUpgradePrompt(error);
  };

  const loadData = async () => {
    if (!id) return;
    try {
      onChange(await resumeService.getAwards(Number(id)));
    } catch (error) {
      message.error(t('resume.awards.loadFailed', { message: error instanceof Error ? error.message : String(error) }));
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
        issuer: values.issuer || '',
        issueDate: values.issueDate ? values.issueDate.format('YYYY-MM-DD') : '',
        description: values.description || '',
        displayOrder: editingItem ? editingItem.displayOrder : data.length,
      };
      if (editingItem) {
        await resumeService.updateAward(Number(id), editingItem.id, payload);
      } else {
        await resumeService.createAward(Number(id), payload);
      }
      await loadData();
      setOpen(false);
      form.resetFields();
      setEditingItem(null);
    } catch (error) {
      showUpgradeGuide(error as ApiError);
      message.error(t('resume.awards.saveFailed', { message: error instanceof Error ? error.message : String(error) }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Button type="dashed" icon={<PlusOutlined />} block size="large" style={{ marginBottom: 16 }} onClick={() => { form.resetFields(); setEditingItem(null); setOpen(true); }}>
        {t('resume.awards.addButton')}
      </Button>
      {data.length === 0 ? <Empty description={t('resume.awards.emptyDescription')} /> : (
        <List
          dataSource={data}
          renderItem={(item) => (
            <Card
              key={item.id}
              style={{ marginBottom: 12 }}
              bodyStyle={{ padding: 16 }}
              extra={
                <Space>
                  <Button type="link" icon={<EditOutlined />} onClick={() => {
                    setEditingItem(item);
                    form.setFieldsValue({ ...item, issueDate: item.issueDate ? dayjs(item.issueDate) : null });
                    setOpen(true);
                  }} />
                  <Button type="link" danger icon={<DeleteOutlined />} onClick={() => {
                    Modal.confirm({
                      title: t('resume.awards.deleteTitle'),
                      content: t('resume.awards.deleteContent'),
                      onOk: async () => {
                        if (!id) return;
                        await resumeService.deleteAward(Number(id), item.id);
                        await loadData();
                      },
                    });
                  }} />
                </Space>
              }
            >
              <strong>{item.title}</strong>
              {(item.issuer || item.issueDate) && <div style={{ marginTop: 4, color: '#666' }}>{item.issuer}{item.issueDate ? ` · ${item.issueDate}` : ''}</div>}
              {item.description && <SafeHtmlRenderer content={item.description} style={{ marginTop: 8, lineHeight: 1.6, color: '#555' }} />}
            </Card>
          )}
        />
      )}
      <Modal title={editingItem ? t('resume.awards.modalTitleEdit') : t('resume.awards.modalTitleCreate')} open={open} onOk={handleSubmit} confirmLoading={saving} onCancel={() => setOpen(false)} width={640}>
        <Form form={form} layout="vertical">
          <Form.Item label={t('resume.awards.titleLabel')} name="title" rules={[{ required: true, message: t('resume.awards.titleRequired') }]}>
            <Input placeholder={t('resume.awards.titlePlaceholder')} />
          </Form.Item>
          <Form.Item label={t('resume.awards.issuerLabel')} name="issuer">
            <Input placeholder={t('resume.awards.issuerPlaceholder')} />
          </Form.Item>
          <Form.Item label={t('resume.awards.issueDateLabel')} name="issueDate">
            <DatePicker picker="month" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label={t('resume.awards.descriptionLabel')} name="description">
            <RichTextEditor placeholder={t('resume.awards.descriptionPlaceholder')} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AwardsSection;
