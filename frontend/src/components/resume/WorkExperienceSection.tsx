import { useState } from 'react';
import { Button, List, Card, Modal, Form, Input, DatePicker, Checkbox, Space, Empty } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { WorkExperience } from '@/types/resume.types';

const { TextArea } = Input;
const { RangePicker } = DatePicker;

interface WorkExperienceSectionProps {
  data: WorkExperience[];
  onChange: (data: WorkExperience[]) => void;
}

export const WorkExperienceSection = ({ data, onChange }: WorkExperienceSectionProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [form] = Form.useForm();

  const handleAdd = () => {
    form.resetFields();
    setEditingIndex(null);
    setIsModalOpen(true);
  };

  const handleEdit = (index: number) => {
    const item = data[index];
    form.setFieldsValue({
      ...item,
      dateRange: item.startDate && !item.isCurrent
        ? [dayjs(item.startDate), item.endDate ? dayjs(item.endDate) : null]
        : item.startDate
        ? [dayjs(item.startDate), null]
        : null,
    });
    setEditingIndex(index);
    setIsModalOpen(true);
  };

  const handleDelete = (index: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条工作经历吗？',
      onOk: () => {
        const newData = data.filter((_, i) => i !== index);
        onChange(newData);
      },
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const [startDate, endDate] = values.dateRange || [null, null];

      const newItem: WorkExperience = {
        id: editingIndex !== null ? data[editingIndex].id : Date.now(),
        resumeId: 0,
        companyName: values.companyName,
        position: values.position,
        location: values.location,
        startDate: startDate ? startDate.format('YYYY-MM-DD') : '',
        endDate: values.isCurrent ? null : (endDate ? endDate.format('YYYY-MM-DD') : null),
        isCurrent: values.isCurrent || false,
        description: values.description,
        displayOrder: editingIndex !== null ? data[editingIndex].displayOrder : data.length,
      };

      let newData;
      if (editingIndex !== null) {
        newData = [...data];
        newData[editingIndex] = newItem;
      } else {
        newData = [...data, newItem];
      }

      onChange(newData);
      setIsModalOpen(false);
      form.resetFields();
    } catch (error) {
      console.error('表单验证失败:', error);
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
        添加工作经历
      </Button>

      {data.length === 0 ? (
        <Empty description="暂无工作经历" />
      ) : (
        <List
          dataSource={data}
          renderItem={(item, index) => (
            <Card
              key={item.id}
              style={{ marginBottom: 12 }}
              bodyStyle={{ padding: 16 }}
              extra={
                <Space>
                  <Button
                    type="link"
                    icon={<EditOutlined />}
                    onClick={() => handleEdit(index)}
                  />
                  <Button
                    type="link"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDelete(index)}
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
                  {item.startDate} - {item.isCurrent ? '至今' : item.endDate || '至今'}
                </div>
                {item.description && (
                  <div style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>
                    {item.description}
                  </div>
                )}
              </div>
            </Card>
          )}
        />
      )}

      <Modal
        title={editingIndex !== null ? '编辑工作经历' : '添加工作经历'}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="职位"
            name="position"
            rules={[{ required: true, message: '请输入职位' }]}
          >
            <Input placeholder="前端工程师" />
          </Form.Item>

          <Form.Item
            label="公司名称"
            name="companyName"
            rules={[{ required: true, message: '请输入公司名称' }]}
          >
            <Input placeholder="某科技公司" />
          </Form.Item>

          <Form.Item label="工作地点" name="location">
            <Input placeholder="北京" />
          </Form.Item>

          <Form.Item
            label="工作时间"
            name="dateRange"
            rules={[{ required: true, message: '请选择工作时间' }]}
          >
            <RangePicker
              style={{ width: '100%' }}
              picker="month"
              format="YYYY-MM"
              placeholder={['开始时间', '结束时间']}
            />
          </Form.Item>

          <Form.Item name="isCurrent" valuePropName="checked">
            <Checkbox>目前在职</Checkbox>
          </Form.Item>

          <Form.Item label="工作描述" name="description">
            <TextArea
              rows={4}
              placeholder="描述你的主要职责和成就..."
              maxLength={1000}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default WorkExperienceSection;