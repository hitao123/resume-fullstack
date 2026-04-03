import { useEffect, useState } from 'react';
import { Button, Card, DatePicker, Empty, Form, Input, List, Modal, Space, message } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import type { Certification } from '@/types/resume.types';
import resumeService from '@/services/resumeService';
import type { ApiError } from '@/types/api.types';
import { openUpgradePrompt } from '@/utils/planMessages';

interface CertificationsSectionProps {
  data: Certification[];
  onChange: (data: Certification[]) => void;
}

const CertificationsSection = ({ data, onChange }: CertificationsSectionProps) => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Certification | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const showUpgradeGuide = (error: ApiError) => {
    openUpgradePrompt(error);
  };

  const loadData = async () => {
    if (!id) return;
    try {
      onChange(await resumeService.getCertifications(Number(id)));
    } catch (error) {
      message.error(t('resume.certifications.loadFailed', { message: error instanceof Error ? error.message : String(error) }));
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
        name: values.name,
        issuingOrganization: values.issuingOrganization || '',
        issueDate: values.issueDate ? values.issueDate.format('YYYY-MM-DD') : '',
        expiryDate: values.expiryDate ? values.expiryDate.format('YYYY-MM-DD') : '',
        credentialId: values.credentialId || '',
        credentialUrl: values.credentialUrl || '',
        displayOrder: editingItem ? editingItem.displayOrder : data.length,
      };
      if (editingItem) {
        await resumeService.updateCertification(Number(id), editingItem.id, payload);
      } else {
        await resumeService.createCertification(Number(id), payload);
      }
      await loadData();
      setOpen(false);
      form.resetFields();
      setEditingItem(null);
    } catch (error) {
      showUpgradeGuide(error as ApiError);
      message.error(t('resume.certifications.saveFailed', { message: error instanceof Error ? error.message : String(error) }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Button type="dashed" icon={<PlusOutlined />} block size="large" style={{ marginBottom: 16 }} onClick={() => { form.resetFields(); setEditingItem(null); setOpen(true); }}>
        {t('resume.certifications.addButton')}
      </Button>
      {data.length === 0 ? <Empty description={t('resume.certifications.emptyDescription')} /> : (
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
                    form.setFieldsValue({
                      ...item,
                      issueDate: item.issueDate ? dayjs(item.issueDate) : null,
                      expiryDate: item.expiryDate ? dayjs(item.expiryDate) : null,
                    });
                    setOpen(true);
                  }} />
                  <Button type="link" danger icon={<DeleteOutlined />} onClick={() => {
                    Modal.confirm({
                      title: t('resume.certifications.deleteTitle'),
                      content: t('resume.certifications.deleteContent'),
                      onOk: async () => {
                        if (!id) return;
                        await resumeService.deleteCertification(Number(id), item.id);
                        await loadData();
                      },
                    });
                  }} />
                </Space>
              }
            >
              <div>
                <strong>{item.name}</strong>
                {item.issuingOrganization && <div style={{ marginTop: 4, color: '#666' }}>{item.issuingOrganization}</div>}
                {(item.issueDate || item.expiryDate) && (
                  <div style={{ marginTop: 4, color: '#999', fontSize: 12 }}>
                    {item.issueDate || t('resume.certifications.unknownDate')} - {item.expiryDate || t('resume.certifications.noExpiry')}
                  </div>
                )}
                {(item.credentialId || item.credentialUrl) && <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>{item.credentialId}{item.credentialUrl ? ` · ${item.credentialUrl}` : ''}</div>}
              </div>
            </Card>
          )}
        />
      )}
      <Modal title={editingItem ? t('resume.certifications.modalTitleEdit') : t('resume.certifications.modalTitleCreate')} open={open} onOk={handleSubmit} confirmLoading={saving} onCancel={() => setOpen(false)}>
        <Form form={form} layout="vertical">
          <Form.Item label={t('resume.certifications.nameLabel')} name="name" rules={[{ required: true, message: t('resume.certifications.nameRequired') }]}>
            <Input placeholder="AWS Certified Developer" />
          </Form.Item>
          <Form.Item label={t('resume.certifications.issuingOrgLabel')} name="issuingOrganization">
            <Input placeholder="Amazon Web Services" />
          </Form.Item>
          <Space style={{ display: 'flex' }}>
            <Form.Item label={t('resume.certifications.issueDateLabel')} name="issueDate" style={{ flex: 1 }}>
              <DatePicker picker="month" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label={t('resume.certifications.expiryDateLabel')} name="expiryDate" style={{ flex: 1 }}>
              <DatePicker picker="month" style={{ width: '100%' }} />
            </Form.Item>
          </Space>
          <Form.Item label={t('resume.certifications.credentialIdLabel')} name="credentialId">
            <Input placeholder="Credential ID" />
          </Form.Item>
          <Form.Item label={t('resume.certifications.credentialUrlLabel')} name="credentialUrl">
            <Input placeholder="https://..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CertificationsSection;
