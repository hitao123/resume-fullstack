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
import './ResumeWorkspace.css';

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

const templateMetaMap: Record<number, string[]> = {
  1: ['双栏信息密度', '适合经历丰富', '视觉更现代'],
  2: ['标准商务排版', '适配大多数岗位', '阅读成本低'],
  3: ['极简留白', '突出内容本身', '适合内容精炼'],
};

const mergeSectionConfig = (resume: Resume): ResumeSectionConfig[] => {
  const existing = new Map((resume.sectionConfig || []).map((item) => [item.key, item]));
  return DEFAULT_SECTION_CONFIG.map((item) => existing.get(item.key) || { ...item }).sort((a, b) => a.order - b.order);
};

const TemplateThumbnail = ({ templateId }: { templateId: number }) => {
  if (templateId === 1) {
    return (
      <div className="template-thumbnail">
        <div className="template-thumbnail-page template-thumb-modern">
          <div className="template-thumb-modern-sidebar">
            <div className="template-thumb-row" style={{ width: '66%', background: 'rgba(255,255,255,0.72)' }} />
            <div className="template-thumb-row" style={{ width: '84%', background: 'rgba(255,255,255,0.38)', marginTop: 18 }} />
            <div className="template-thumb-row" style={{ width: '72%', background: 'rgba(255,255,255,0.38)' }} />
            <div className="template-thumb-row" style={{ width: '78%', background: 'rgba(255,255,255,0.38)', marginTop: 20 }} />
            <div className="template-thumb-row" style={{ width: '64%', background: 'rgba(255,255,255,0.38)' }} />
          </div>
          <div className="template-thumb-modern-main">
            <div className="template-thumb-row" style={{ width: '60%', background: '#d6b274' }} />
            <div className="template-thumb-row" style={{ width: '88%', marginTop: 16 }} />
            <div className="template-thumb-row" style={{ width: '94%' }} />
            <div className="template-thumb-row" style={{ width: '82%' }} />
            <div className="template-thumb-row" style={{ width: '56%', marginTop: 16, background: '#d6b274' }} />
            <div className="template-thumb-row" style={{ width: '92%' }} />
            <div className="template-thumb-row" style={{ width: '74%' }} />
          </div>
        </div>
      </div>
    );
  }

  if (templateId === 2) {
    return (
      <div className="template-thumbnail">
        <div className="template-thumbnail-page template-thumb-classic">
          <div className="template-thumb-classic-header">
            <div className="template-thumb-row" style={{ width: '56%', background: '#cbb189', height: 12 }} />
            <div className="template-thumb-row" style={{ width: '82%', marginTop: 10, height: 8 }} />
          </div>
          <div className="template-thumb-row" style={{ width: '38%', background: '#7a5419' }} />
          <div className="template-thumb-row" style={{ width: '100%', marginTop: 14 }} />
          <div className="template-thumb-row" style={{ width: '90%' }} />
          <div className="template-thumb-row" style={{ width: '42%', marginTop: 14, background: '#7a5419' }} />
          <div className="template-thumb-row" style={{ width: '96%', marginTop: 14 }} />
          <div className="template-thumb-row" style={{ width: '72%' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="template-thumbnail">
      <div className="template-thumbnail-page template-thumb-minimal">
        <div className="template-thumb-minimal-header">
          <div className="template-thumb-row" style={{ width: '52%', height: 12, background: '#4a3822' }} />
          <div className="template-thumb-row" style={{ width: '74%', marginTop: 10, height: 8 }} />
        </div>
        <div className="template-thumb-row" style={{ width: '30%', background: '#a48d67' }} />
        <div className="template-thumb-row" style={{ width: '96%', marginTop: 14 }} />
        <div className="template-thumb-row" style={{ width: '84%' }} />
        <div className="template-thumb-row" style={{ width: '30%', marginTop: 16, background: '#a48d67' }} />
        <div className="template-thumb-row" style={{ width: '94%', marginTop: 14 }} />
        <div className="template-thumb-row" style={{ width: '68%' }} />
      </div>
    </div>
  );
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
    <Space direction="vertical" size="large" className="settings-stack">
      <Card className="settings-card" title="模板选择页">
        <div className="template-grid">
          {TEMPLATE_OPTIONS.map((template) => {
            const isApplied = resume.templateId === template.id;
            const isPreviewing = previewTemplateId === template.id;
            const isLocked = template.id > templateLimit;

            return (
              <Card
                key={template.id}
                hoverable
                className={[
                  'template-card',
                  isApplied ? 'template-card--active' : '',
                  !isApplied && isPreviewing ? 'template-card--preview' : '',
                  isLocked ? 'template-card--locked' : '',
                ].join(' ')}
              >
                <div className="template-card-header">
                  <div style={{ fontWeight: 700, color: '#2a2218' }}>{template.name}</div>
                  <Space size={6} wrap>
                    {isApplied && <Tag color="gold">已应用</Tag>}
                    {!isApplied && isPreviewing && <Tag color="warning">预览中</Tag>}
                    {isLocked && <Tag color="default" icon={<LockOutlined />}>需升级</Tag>}
                  </Space>
                </div>

                <TemplateThumbnail templateId={template.id} />

                <div className="template-card-copy">{template.description}</div>

                <div className="template-card-meta">
                  {(templateMetaMap[template.id] || []).map((item) => (
                    <Tag key={item} style={{ borderRadius: 999 }}>{item}</Tag>
                  ))}
                </div>

                <Space style={{ marginTop: 16 }} wrap>
                  <Button icon={<EyeOutlined />} onClick={() => onPreviewTemplateChange?.(template.id)}>
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
          })}
        </div>
        {previewTemplateId && previewTemplateId !== resume.templateId && (
          <div style={{ marginTop: 16 }}>
            <Tag color="warning">正在预览未应用模板</Tag>
            <Button type="link" onClick={() => onPreviewTemplateChange?.(null)} style={{ paddingInline: 8, color: '#9d6b21' }}>
              返回当前模板
            </Button>
          </div>
        )}
      </Card>

      <Card className="settings-card" title="岗位版本">
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
        <Button
          icon={<CopyOutlined />}
          onClick={() => {
            duplicateForm.setFieldsValue({
              title: `${resume.title} - ${resume.targetRole || '新版本'}`,
              versionLabel: resume.versionLabel || '岗位定制版',
              targetRole: resume.targetRole || '',
            });
            setDuplicateOpen(true);
          }}
        >
          针对岗位生成多个版本
        </Button>
      </Card>

      <Card className="settings-card" title="头像开关">
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

      <Card className="settings-card" title="模块排序和隐藏">
        <List
          className="settings-section-list"
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
