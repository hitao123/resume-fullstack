import { Form, Input, Row, Col, message } from 'antd';
import { useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import type { PersonalInfo } from '@/types/resume.types';
import resumeService from '@/services/resumeService';
import { useTranslation } from 'react-i18next';
import RichTextEditor from '@/components/common/RichTextEditor';
import AIAssistantButton from '@/components/ai/AIAssistantButton';
import AIResultPanel from '@/components/ai/AIResultPanel';
import { useAIAssistant } from '@/hooks/useAIAssistant';
import { generateSummary } from '@/services/aiService';

interface PersonalInfoFormProps {
  data?: PersonalInfo;
  onChange: (data: Partial<PersonalInfo>) => void;
}

export const PersonalInfoForm = ({ data, onChange }: PersonalInfoFormProps) => {
  const { id } = useParams<{ id: string }>();
  const [form] = Form.useForm();
  const isSavingRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { t, i18n } = useTranslation();
  const ai = useAIAssistant();

  useEffect(() => {
    if (data) {
      form.setFieldsValue(data);
    }
  }, [data, form]);

  // Auto-save function with debounce
  const saveToBackend = useCallback(async (values: Partial<PersonalInfo>) => {
    if (!id || isSavingRef.current) return;

    // Clear previous timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    // Set new timer
    saveTimerRef.current = setTimeout(async () => {
      isSavingRef.current = true;
      try {
        await resumeService.updatePersonalInfo(Number(id), {
          fullName: values.fullName || '',
          email: values.email || '',
          phone: values.phone || '',
          location: values.location || '',
          website: values.website || '',
          linkedin: values.linkedin || '',
          github: values.github || '',
          avatarUrl: values.avatarUrl || '',
          showAvatar: values.showAvatar || false,
          summary: values.summary || '',
        });
        message.success(t('resume.personal.autoSaveSuccess'), 0.5);
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        message.error(t('resume.personal.autoSaveFailed', { message: msg }));
      } finally {
        isSavingRef.current = false;
      }
    }, 1000); // 1 second delay
  }, [id, t]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  const handleValuesChange = (_: unknown, allValues: Partial<PersonalInfo>) => {
    onChange(allValues);
    saveToBackend(allValues);
  };

  const handleGenerateSummary = () => {
    if (!id) return;
    const language = i18n.language.startsWith('zh') ? 'zh' : 'en';
    ai.startGeneration((callbacks, signal) => {
      generateSummary(Number(id), language, callbacks, signal);
    });
  };

  const handleAcceptSummary = () => {
    form.setFieldsValue({ summary: ai.content });
    const allValues = form.getFieldsValue();
    onChange(allValues);
    saveToBackend(allValues);
    ai.reset();
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
            label={t('resume.personal.fullNameLabel')}
            name="fullName"
            rules={[{ required: true, message: t('resume.personal.fullNameRequired') }]}
          >
            <Input placeholder={t('resume.personal.fullNamePlaceholder')} size="large" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            label={t('resume.personal.emailLabel')}
            name="email"
            rules={[
              { required: true, message: t('resume.personal.emailRequired') },
              { type: 'email', message: t('resume.personal.emailInvalid') },
            ]}
          >
            <Input placeholder={t('resume.personal.emailPlaceholder')} size="large" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            label={t('resume.personal.phoneLabel')}
            name="phone"
            rules={[{ required: true, message: t('resume.personal.phoneRequired') }]}
          >
            <Input placeholder={t('resume.personal.phonePlaceholder')} size="large" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label={t('resume.personal.locationLabel')} name="location">
            <Input placeholder={t('resume.personal.locationPlaceholder')} size="large" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label={t('resume.personal.websiteLabel')} name="website">
            <Input placeholder={t('resume.personal.websitePlaceholder')} size="large" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label={t('resume.personal.linkedinLabel')} name="linkedin">
            <Input placeholder={t('resume.personal.linkedinPlaceholder')} size="large" />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item label={t('resume.personal.githubLabel')} name="github">
        <Input placeholder={t('resume.personal.githubPlaceholder')} size="large" />
      </Form.Item>

      <Form.Item label={t('resume.personal.avatarUrlLabel')} name="avatarUrl">
        <Input placeholder="https://example.com/avatar.jpg" size="large" />
      </Form.Item>

      <Form.Item
        label={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {t('resume.personal.summaryLabel')}
            <AIAssistantButton
              onClick={handleGenerateSummary}
              loading={ai.isGenerating}
              label={t('ai.generateSummary')}
            />
          </div>
        }
        name="summary"
      >
        <RichTextEditor placeholder={t('resume.personal.summaryPlaceholder')} />
      </Form.Item>

      <AIResultPanel
        content={ai.content}
        isGenerating={ai.isGenerating}
        error={ai.error}
        onAccept={handleAcceptSummary}
        onDiscard={ai.reset}
      />
    </Form>
  );
};

export default PersonalInfoForm;
