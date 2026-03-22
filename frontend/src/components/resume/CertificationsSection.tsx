import { useEffect, useState } from 'react';
import { Button, Card, DatePicker, Empty, Form, Input, List, Modal, Space, message } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useParams } from 'react-router-dom';
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
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Certification | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const loadData = async () => {
    if (!id) return;
    try {
      onChange(await resumeService.getCertifications(Number(id)));
    } catch (error) {
      message.error(`加载证书失败：${error instanceof Error ? error.message : String(error)}`);
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
      message.error(`保存证书失败：${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Button type="dashed" icon={<PlusOutlined />} block size="large" style={{ marginBottom: 16 }} onClick={() => { form.resetFields(); setEditingItem(null); setOpen(true); }}>
        添加证书
      </Button>
      {data.length === 0 ? <Empty description="暂无证书" /> : (
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
                      title: '删除证书',
                      content: '确定删除这条证书记录吗？',
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
                {(item.issueDate || item.expiryDate) && <div style={{ marginTop: 4, color: '#999', fontSize: 12 }}>{item.issueDate || '未知'} - {item.expiryDate || '长期有效'}</div>}
                {(item.credentialId || item.credentialUrl) && <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>{item.credentialId}{item.credentialUrl ? ` · ${item.credentialUrl}` : ''}</div>}
              </div>
            </Card>
          )}
        />
      )}
      <Modal title={editingItem ? '编辑证书' : '添加证书'} open={open} onOk={handleSubmit} confirmLoading={saving} onCancel={() => setOpen(false)}>
        <Form form={form} layout="vertical">
          <Form.Item label="证书名称" name="name" rules={[{ required: true, message: '请输入证书名称' }]}>
            <Input placeholder="AWS Certified Developer" />
          </Form.Item>
          <Form.Item label="颁发机构" name="issuingOrganization">
            <Input placeholder="Amazon Web Services" />
          </Form.Item>
          <Space style={{ display: 'flex' }}>
            <Form.Item label="发证日期" name="issueDate" style={{ flex: 1 }}>
              <DatePicker picker="month" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="到期日期" name="expiryDate" style={{ flex: 1 }}>
              <DatePicker picker="month" style={{ width: '100%' }} />
            </Form.Item>
          </Space>
          <Form.Item label="证书编号" name="credentialId">
            <Input placeholder="Credential ID" />
          </Form.Item>
          <Form.Item label="证书链接" name="credentialUrl">
            <Input placeholder="https://..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CertificationsSection;
  const showUpgradeGuide = (error: ApiError) => {
    openUpgradePrompt(error);
  };
