import { useEffect, useMemo, useState } from 'react';
import { Avatar, Button, Card, Form, Input, List, Modal, Space, Switch, Tag, message } from 'antd';
import { ArrowDownOutlined, ArrowUpOutlined, CopyOutlined, EyeOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import type { PersonalInfo, Resume, ResumeSectionConfig } from '@/types/resume.types';
import resumeService from '@/services/resumeService';
import { DEFAULT_SECTION_CONFIG, TEMPLATE_OPTIONS } from '@/utils/constants';
import type { ApiError } from '@/types/api.types';
import { openUpgradePrompt } from '@/utils/planMessages';
import { useAuth } from '@/hooks/useAuth';

interface ResumeSettingsSectionProps {
  resume: Resume;
  onResumeChange: (resume: Resume) => void;
  onPreviewTemplateChange?: (templateId: number | null) => void;
  previewTemplateId?: number | null;
}

const sectionLabels: Record<string, string> = {
  summary: '个人简介',
  workExperiences: '工作经历',
  education: '教育背景',
  skills: '专业技能',
  projects: '项目经历',
  certifications: '证书',
  languages: '语言',
  awards: '奖项',
  customSections: '自定义模块',
};

const mergeSectionConfig = (resume: Resume): ResumeSectionConfig[] => {
  const existing = new Map((resume.sectionConfig || []).map((item) => [item.key, item]));
  return DEFAULT_SECTION_CONFIG.map((item) => existing.get(item.key) || { ...item }).sort((a, b) => a.order - b.order);
};

const ResumeSettingsSection = ({ resume, onResumeChange, onPreviewTemplateChange, previewTemplateId }: ResumeSettingsSectionProps) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [resumeForm] = Form.useForm();
  const [avatarForm] = Form.useForm();
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [duplicateForm] = Form.useForm();

  const sectionConfig = useMemo(() => mergeSectionConfig(resume), [resume]);
  const templateLimit = user?.plan?.templateLimit ?? 1;
  const showUpgradeGuide = (error: ApiError) => {
    openUpgradePrompt(error);
  };

  useEffect(() => {
    resumeForm.setFieldsValue({
      title: resume.title,
      versionLabel: resume.versionLabel,
      targetRole: resume.targetRole,
    });
    avatarForm.setFieldsValue({
      avatarUrl: resume.personalInfo?.avatarUrl,
      showAvatar: resume.personalInfo?.showAvatar,
    });
  }, [resume, resumeForm, avatarForm]);

  const saveResumeMeta = async (values: Partial<Resume>) => {
    if (!id) return;
    try {
      await resumeService.updateResume(Number(id), values);
      onResumeChange({ ...resume, ...values });
    } catch (error) {
      showUpgradeGuide(error as ApiError);
      throw error;
    }
  };

  const savePersonalInfo = async (values: Partial<PersonalInfo>) => {
    if (!id) return;
    const nextPersonalInfo = {
      fullName: resume.personalInfo?.fullName || '',
      email: resume.personalInfo?.email || '',
      phone: resume.personalInfo?.phone || '',
      location: resume.personalInfo?.location || '',
      website: resume.personalInfo?.website || '',
      linkedin: resume.personalInfo?.linkedin || '',
      github: resume.personalInfo?.github || '',
      summary: resume.personalInfo?.summary || '',
      avatarUrl: values.avatarUrl ?? resume.personalInfo?.avatarUrl ?? '',
      showAvatar: values.showAvatar ?? resume.personalInfo?.showAvatar ?? false,
    };
    const updated = await resumeService.updatePersonalInfo(Number(id), nextPersonalInfo);
    onResumeChange({ ...resume, personalInfo: updated });
  };

  const updateSectionConfig = async (nextConfig: ResumeSectionConfig[]) => {
    if (!id) return;
    await resumeService.updateResume(Number(id), { sectionConfig: nextConfig });
    onResumeChange({ ...resume, sectionConfig: nextConfig });
  };

  const moveSection = async (key: string, direction: -1 | 1) => {
    const current = [...sectionConfig];
    const index = current.findIndex((item) => item.key === key);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= current.length) return;
    [current[index], current[targetIndex]] = [current[targetIndex], current[index]];
    const normalized = current.map((item, order) => ({ ...item, order }));
    await updateSectionConfig(normalized);
  };

  const toggleSectionVisible = async (key: string, visible: boolean) => {
    const normalized = sectionConfig.map((item) => item.key === key ? { ...item, visible } : item);
    await updateSectionConfig(normalized);
  };

  const handleDuplicate = async () => {
    if (!id) return;
    try {
      const values = await duplicateForm.validateFields();
      setDuplicating(true);
      const duplicated = await resumeService.duplicateResume(Number(id));
      const updated = await resumeService.updateResume(duplicated.id, {
        title: values.title,
        versionLabel: values.versionLabel,
        targetRole: values.targetRole,
      });
      setDuplicateOpen(false);
      duplicateForm.resetFields();
      navigate(`/editor/${updated.id}`);
    } catch (error) {
      showUpgradeGuide(error as ApiError);
      message.error(`创建岗位版本失败：${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setDuplicating(false);
    }
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card title="模板选择页">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {TEMPLATE_OPTIONS.map((template) => (
            (() => {
              const isApplied = resume.templateId === template.id;
              const isPreviewing = previewTemplateId === template.id;
              const isLocked = template.id > templateLimit;

              return (
                <Card
                  key={template.id}
                  hoverable
                  style={{
                    borderColor: isApplied || isPreviewing ? '#1677ff' : undefined,
                    background: isApplied ? '#f0f7ff' : isPreviewing ? '#f8fbff' : undefined,
                    opacity: isLocked ? 0.88 : 1,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 10, alignItems: 'center' }}>
                    <div style={{ fontWeight: 600 }}>{template.name}</div>
                    <Space size={6}>
                      {isApplied && <Tag color="blue">已应用</Tag>}
                      {!isApplied && isPreviewing && <Tag color="processing">预览中</Tag>}
                      {isLocked && <Tag color="default" icon={<LockOutlined />}>需升级</Tag>}
                    </Space>
                  </div>
                  <div style={{ color: '#666', fontSize: 13, lineHeight: 1.7, minHeight: 46 }}>{template.description}</div>
                  <Space style={{ marginTop: 14 }} wrap>
                    <Button
                      icon={<EyeOutlined />}
                      onClick={() => onPreviewTemplateChange?.(template.id)}
                    >
                      查看效果
                    </Button>
                    <Button
                      type="primary"
                      disabled={isApplied}
                      onClick={() => {
                        if (isLocked) {
                          openUpgradePrompt({
                            message: '当前套餐模板数量不足',
                            code: 'TEMPLATE_NOT_AVAILABLE',
                          });
                          return;
                        }
                        onPreviewTemplateChange?.(null);
                        void saveResumeMeta({ templateId: template.id });
                      }}
                    >
                      {isLocked ? '升级解锁' : isApplied ? '当前模板' : '应用模板'}
                    </Button>
                  </Space>
                </Card>
              );
            })()
          ))}
        </div>
        {previewTemplateId && previewTemplateId !== resume.templateId && (
          <div style={{ marginTop: 14 }}>
            <Tag color="processing">正在预览未应用模板</Tag>
            <Button type="link" onClick={() => onPreviewTemplateChange?.(null)} style={{ paddingInline: 8 }}>
              返回当前模板
            </Button>
          </div>
        )}
      </Card>

      <Card title="岗位版本">
        <Form form={resumeForm} layout="vertical" onValuesChange={(_, allValues) => { void saveResumeMeta(allValues); }}>
          <Form.Item label="简历标题" name="title">
            <Input placeholder="例如：前端工程师简历" />
          </Form.Item>
          <Form.Item label="版本标签" name="versionLabel">
            <Input placeholder="例如：校招版 / 海外版 / 技术岗版" />
          </Form.Item>
          <Form.Item label="目标岗位" name="targetRole">
            <Input placeholder="例如：高级前端工程师" />
          </Form.Item>
        </Form>
        <Button icon={<CopyOutlined />} onClick={() => {
          duplicateForm.setFieldsValue({
            title: `${resume.title} - ${resume.targetRole || '新版本'}`,
            versionLabel: resume.versionLabel || '岗位定制版',
            targetRole: resume.targetRole || '',
          });
          setDuplicateOpen(true);
        }}>
          针对岗位生成多个版本
        </Button>
      </Card>

      <Card title="头像开关">
        <Form form={avatarForm} layout="vertical" onValuesChange={(_, allValues) => { void savePersonalInfo(allValues); }}>
          <Form.Item label="头像链接" name="avatarUrl">
            <Input placeholder="https://example.com/avatar.jpg" />
          </Form.Item>
          <Form.Item label="在简历中显示头像" name="showAvatar" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
        <Space>
          <Avatar size={64} src={resume.personalInfo?.showAvatar ? resume.personalInfo?.avatarUrl : undefined} icon={<UserOutlined />} />
          <span style={{ color: '#666' }}>预览会根据这里的开关决定是否显示头像</span>
        </Space>
      </Card>

      <Card title="模块排序和隐藏">
        <List
          dataSource={sectionConfig}
          renderItem={(item, index) => (
            <List.Item
              actions={[
                <Switch key="switch" checked={item.visible} onChange={(checked) => { void toggleSectionVisible(item.key, checked); }} />,
                <Button key="up" icon={<ArrowUpOutlined />} disabled={index === 0} onClick={() => { void moveSection(item.key, -1); }} />,
                <Button key="down" icon={<ArrowDownOutlined />} disabled={index === sectionConfig.length - 1} onClick={() => { void moveSection(item.key, 1); }} />,
              ]}
            >
              <List.Item.Meta title={sectionLabels[item.key] || item.key} description={item.visible ? '显示中' : '已隐藏'} />
            </List.Item>
          )}
        />
      </Card>

      <Modal title="创建岗位版本" open={duplicateOpen} onOk={handleDuplicate} confirmLoading={duplicating} onCancel={() => setDuplicateOpen(false)}>
        <Form form={duplicateForm} layout="vertical">
          <Form.Item label="新简历标题" name="title" rules={[{ required: true, message: '请输入标题' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="版本标签" name="versionLabel">
            <Input />
          </Form.Item>
          <Form.Item label="目标岗位" name="targetRole">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
};

export default ResumeSettingsSection;
