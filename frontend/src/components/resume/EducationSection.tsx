import { useState } from 'react';
import { Button, List, Card, Modal, Form, Input, DatePicker, Space, Empty } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Education } from '@/types/resume.types';

const { TextArea } = Input;
const { RangePicker } = DatePicker;

interface EducationSectionProps {
  data: Education[];
  onChange: (data: Education[]) => void;
}

export const EducationSection = ({ data, onChange }: EducationSectionProps) => {
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
      dateRange: item.startDate
        ? [dayjs(item.startDate), item.endDate ? dayjs(item.endDate) : null]
        : null,
    });
    setEditingIndex(index);
    setIsModalOpen(true);
  };

  const handleDelete = (index: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这条教育经历吗？',
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

      const newItem: Education = {
        id: editingIndex !== null ? data[editingIndex].id : Date.now(),
        resumeId: 0,
        institution: values.institution,
        degree: values.degree,
        fieldOfStudy: values.fieldOfStudy,
        location: values.location,
        startDate: startDate ? startDate.format('YYYY-MM-DD') : '',
        endDate: endDate ? endDate.format('YYYY-MM-DD') : null,
        gpa: values.gpa,
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
        添加教育经历
      </Button>

      {data.length === 0 ? (
        <Empty description="暂无教育经历" />
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
                <strong style={{ fontSize: 16 }}>{item.institution}</strong>
                <div style={{ color: '#666', marginTop: 4 }}>
                  {item.degree} {item.fieldOfStudy && `· ${item.fieldOfStudy}`}
                </div>
                <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                  {item.startDate} - {item.endDate || '至今'}
                  {item.location && ` · ${item.location}`}
                </div>
                {item.gpa && (
                  <div style={{ marginTop: 4, color: '#666' }}>GPA: {item.gpa}</div>
                )}
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
        title={editingIndex !== null ? '编辑教育经历' : '添加教育经历'}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="学校名称"
            name="institution"
            rules={[{ required: true, message: '请输入学校名称' }]}
          >
            <Input placeholder="清华大学" />
          </Form.Item>

          <Form.Item
            label="学位"
            name="degree"
            rules={[{ required: true, message: '请输入学位' }]}
          >
            <Input placeholder="计算机科学学士" />
          </Form.Item>

          <Form.Item label="专业" name="fieldOfStudy">
            <Input placeholder="软件工程" />
          </Form.Item>

          <Form.Item label="地点" name="location">
            <Input placeholder="北京" />
          </Form.Item>

          <Form.Item
            label="就读时间"
            name="dateRange"
            rules={[{ required: true, message: '请选择就读时间' }]}
          >
            <RangePicker
              style={{ width: '100%' }}
              picker="month"
              format="YYYY-MM"
              placeholder={['开始时间', '结束时间']}
            />
          </Form.Item>

          <Form.Item label="GPA" name="gpa">
            <Input placeholder="3.8/4.0" />
          </Form.Item>

          <Form.Item label="描述" name="description">
            <TextArea
              rows={3}
              placeholder="主修课程、获得奖项等..."
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EducationSection;