import { Form, Input, Row, Col } from 'antd';
import { useEffect } from 'react';
import type { PersonalInfo } from '@/types/resume.types';

const { TextArea } = Input;

interface PersonalInfoFormProps {
  data?: PersonalInfo;
  onChange: (data: Partial<PersonalInfo>) => void;
}

export const PersonalInfoForm = ({ data, onChange }: PersonalInfoFormProps) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (data) {
      form.setFieldsValue(data);
    }
  }, [data, form]);

  const handleValuesChange = (_: any, allValues: any) => {
    onChange(allValues);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onValuesChange={handleValuesChange}
      initialValues={data}
    >
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="姓名"
            name="fullName"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="张三" size="large" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label="邮箱"
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input placeholder="zhangsan@example.com" size="large" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label="电话"
            name="phone"
            rules={[{ required: true, message: '请输入电话' }]}
          >
            <Input placeholder="+86 138-0000-0000" size="large" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="地址" name="location">
            <Input placeholder="北京市海淀区" size="large" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="个人网站" name="website">
            <Input placeholder="https://yourwebsite.com" size="large" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="LinkedIn" name="linkedin">
            <Input placeholder="https://linkedin.com/in/yourprofile" size="large" />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item label="GitHub" name="github">
        <Input placeholder="https://github.com/yourusername" size="large" />
      </Form.Item>

      <Form.Item label="个人简介" name="summary">
        <TextArea
          rows={4}
          placeholder="简要介绍你的职业背景、技能和目标..."
          maxLength={500}
          showCount
        />
      </Form.Item>
    </Form>
  );
};

export default PersonalInfoForm;