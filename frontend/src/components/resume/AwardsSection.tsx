import { useEffect, useState } from 'react';
import { Button, Card, DatePicker, Empty, Form, Input, List, Modal, Space, message } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useParams } from 'react-router-dom';
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
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Award | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const loadData = async () => {
    if (!id) return;
    try {
      onChange(await resumeService.getAwards(Number(id)));
    } catch (error) {
      message.error(`加载奖项失败：${error instanceof Error ? error.message : String(error)}`);
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
      message.error(`保存奖项失败：${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Button type="dashed" icon={<PlusOutlined />} block size="large" style={{ marginBottom: 16 }} onClick={() => { form.resetFields(); setEditingItem(null); setOpen(true); }}>
        添加奖项
      </Button>
      {data.length === 0 ? <Empty description="暂无奖项" /> : (
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
                      title: '删除奖项',
                      content: '确定删除这条奖项记录吗？',
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
      <Modal title={editingItem ? '编辑奖项' : '添加奖项'} open={open} onOk={handleSubmit} confirmLoading={saving} onCancel={() => setOpen(false)} width={640}>
        <Form form={form} layout="vertical">
          <Form.Item label="奖项名称" name="title" rules={[{ required: true, message: '请输入奖项名称' }]}>
            <Input placeholder="国家奖学金 / 最佳员工" />
          </Form.Item>
          <Form.Item label="颁发机构" name="issuer">
            <Input placeholder="学校 / 公司 / 组织" />
          </Form.Item>
          <Form.Item label="获奖时间" name="issueDate">
            <DatePicker picker="month" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="奖项说明" name="description">
            <RichTextEditor placeholder="补充获奖背景、含金量或评选范围" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AwardsSection;
  const showUpgradeGuide = (error: ApiError) => {
    openUpgradePrompt(error);
  };
