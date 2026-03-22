import { useEffect, useState } from 'react';
import { Button, Card, Empty, Form, Input, List, Modal, Select, Space, message } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import type { Language } from '@/types/resume.types';
import resumeService from '@/services/resumeService';
import { LANGUAGE_PROFICIENCY_LEVELS } from '@/utils/constants';
import type { ApiError } from '@/types/api.types';
import { openUpgradePrompt } from '@/utils/planMessages';

interface LanguagesSectionProps {
  data: Language[];
  onChange: (data: Language[]) => void;
}

const LanguagesSection = ({ data, onChange }: LanguagesSectionProps) => {
  const { id } = useParams<{ id: string }>();
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Language | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const loadData = async () => {
    if (!id) return;
    try {
      onChange(await resumeService.getLanguages(Number(id)));
    } catch (error) {
      message.error(`加载语言失败：${error instanceof Error ? error.message : String(error)}`);
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
        language: values.language,
        proficiency: values.proficiency || '',
        displayOrder: editingItem ? editingItem.displayOrder : data.length,
      };
      if (editingItem) {
        await resumeService.updateLanguage(Number(id), editingItem.id, payload);
      } else {
        await resumeService.createLanguage(Number(id), payload);
      }
      await loadData();
      setOpen(false);
      form.resetFields();
      setEditingItem(null);
    } catch (error) {
      showUpgradeGuide(error as ApiError);
      message.error(`保存语言失败：${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Button type="dashed" icon={<PlusOutlined />} block size="large" style={{ marginBottom: 16 }} onClick={() => { form.resetFields(); setEditingItem(null); setOpen(true); }}>
        添加语言
      </Button>
      {data.length === 0 ? <Empty description="暂无语言能力" /> : (
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
                      title: '删除语言',
                      content: '确定删除这项语言能力吗？',
                      onOk: async () => {
                        if (!id) return;
                        await resumeService.deleteLanguage(Number(id), item.id);
                        await loadData();
                      },
                    });
                  }} />
                </Space>
              }
            >
              <strong>{item.language}</strong>
              {item.proficiency && <div style={{ marginTop: 4, color: '#666' }}>{item.proficiency}</div>}
            </Card>
          )}
        />
      )}
      <Modal title={editingItem ? '编辑语言' : '添加语言'} open={open} onOk={handleSubmit} confirmLoading={saving} onCancel={() => setOpen(false)}>
        <Form form={form} layout="vertical">
          <Form.Item label="语言" name="language" rules={[{ required: true, message: '请输入语言名称' }]}>
            <Input placeholder="英语 / 日语 / 粤语" />
          </Form.Item>
          <Form.Item label="熟练度" name="proficiency">
            <Select
              options={LANGUAGE_PROFICIENCY_LEVELS.map((item) => ({ value: item.label, label: item.label }))}
              placeholder="选择熟练度"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default LanguagesSection;
  const showUpgradeGuide = (error: ApiError) => {
    openUpgradePrompt(error);
  };
