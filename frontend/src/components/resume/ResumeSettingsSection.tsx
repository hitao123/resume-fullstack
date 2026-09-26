import { useEffect, useMemo, useState } from 'react';
import { Avatar, Button, Card, ColorPicker, Form, Input, List, Modal, Segmented, Space, Switch, Tag, message } from 'antd';
import { ArrowDownOutlined, ArrowUpOutlined, CopyOutlined, EyeOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { PersonalInfo, Resume, ResumeSectionConfig } from '@/types/resume.types';
import resumeService from '@/services/resumeService';
import { DEFAULT_SECTION_CONFIG, TEMPLATE_OPTIONS } from '@/utils/constants';
import { TEMPLATE_BY_ID, THEME_PRESETS, readableAccent, tint } from '../../../../packages/resume-document/src/index';
import { getErrorMessage, isFormValidateError } from '@/utils/apiError';
import { openUpgradePrompt } from '@/utils/planMessages';
import { resumeSaveCoordinator } from '@/utils/resumeSaveCoordinator';
import './ResumeWorkspace.css';

interface ResumeSettingsSectionProps {
  resume: Resume;
  onResumeChange: (resume: Resume) => void;
  onPreviewTemplateChange?: (templateId: number | null) => void;
  previewTemplateId?: number | null;
}

const templateMetaKeys: Record<number, [string, string, string]> = {
  1: ['settings.templateMetaModern.0', 'settings.templateMetaModern.1', 'settings.templateMetaModern.2'],
  2: ['settings.templateMetaClassic.0', 'settings.templateMetaClassic.1', 'settings.templateMetaClassic.2'],
  3: ['settings.templateMetaMinimal.0', 'settings.templateMetaMinimal.1', 'settings.templateMetaMinimal.2'],
};

const mergeSectionConfig = (resume: Resume): ResumeSectionConfig[] => {
  const existing = new Map((resume.sectionConfig || []).map((item) => [item.key, item]));
  return DEFAULT_SECTION_CONFIG.map((item) => existing.get(item.key) || { ...item }).sort((a, b) => a.order - b.order);
};

const TemplateThumbnail = ({ templateId, themeColor }: { templateId: number; themeColor?: string }) => {
  const accent = readableAccent(themeColor, TEMPLATE_BY_ID[templateId] || 'minimal');
  const soft = tint(accent, 0.45);

  if (templateId === 1) {
    return (
      <div className="template-thumbnail">
        <div className="template-thumbnail-page template-thumb-modern">
          <div className="template-thumb-modern-sidebar" style={{ background: accent }}>
            <div className="template-thumb-row" style={{ width: '66%', background: 'rgba(255,255,255,0.8)' }} />
            <div className="template-thumb-row" style={{ width: '84%', background: 'rgba(255,255,255,0.38)', marginTop: 18 }} />
            <div className="template-thumb-row" style={{ width: '72%', background: 'rgba(255,255,255,0.38)' }} />
            <div className="template-thumb-row" style={{ width: '78%', background: 'rgba(255,255,255,0.38)', marginTop: 20 }} />
            <div className="template-thumb-row" style={{ width: '64%', background: 'rgba(255,255,255,0.38)' }} />
          </div>
          <div className="template-thumb-modern-main">
            <div className="template-thumb-row" style={{ width: '60%', background: accent }} />
            <div className="template-thumb-row" style={{ width: '88%', marginTop: 16 }} />
            <div className="template-thumb-row" style={{ width: '94%' }} />
            <div className="template-thumb-row" style={{ width: '82%' }} />
            <div className="template-thumb-row" style={{ width: '56%', marginTop: 16, background: accent }} />
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
          <div className="template-thumb-classic-header" style={{ borderBottomColor: accent }}>
            <div className="template-thumb-row" style={{ width: '46%', background: accent, height: 12, marginInline: 'auto' }} />
            <div className="template-thumb-row" style={{ width: '82%', marginTop: 10, height: 8, marginInline: 'auto' }} />
          </div>
          <div className="template-thumb-row" style={{ width: '38%', background: accent }} />
          <div className="template-thumb-row" style={{ width: '100%', marginTop: 14 }} />
          <div className="template-thumb-row" style={{ width: '90%' }} />
          <div className="template-thumb-row" style={{ width: '42%', marginTop: 14, background: accent }} />
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
          <div className="template-thumb-row" style={{ width: '52%', height: 12, background: '#1f2933' }} />
          <div className="template-thumb-row" style={{ width: '74%', marginTop: 10, height: 8 }} />
        </div>
        <div className="template-thumb-row" style={{ width: '30%', background: soft }} />
        <div className="template-thumb-row" style={{ width: '96%', marginTop: 14 }} />
        <div className="template-thumb-row" style={{ width: '84%' }} />
        <div className="template-thumb-row" style={{ width: '30%', marginTop: 16, background: soft }} />
        <div className="template-thumb-row" style={{ width: '94%', marginTop: 14 }} />
        <div className="template-thumb-row" style={{ width: '68%' }} />
      </div>
    </div>
  );
};

const ResumeSettingsSection = ({ resume, onResumeChange, onPreviewTemplateChange, previewTemplateId }: ResumeSettingsSectionProps) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const [resumeForm] = Form.useForm();
  const [avatarForm] = Form.useForm();
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [duplicateForm] = Form.useForm();

  const sectionConfig = useMemo(() => mergeSectionConfig(resume), [resume]);
  const activeTemplateKey = TEMPLATE_BY_ID[previewTemplateId ?? resume.templateId] || 'minimal';
  const chosenColor = resume.themeColor?.toLowerCase() || '';
  const effectiveAccent = readableAccent(chosenColor, activeTemplateKey);

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
      await resumeSaveCoordinator.track(Number(id), 'resume-settings', resumeService.updateResume(Number(id), values));
      onResumeChange({ ...resume, ...values });
    } catch (error) {
      if (!openUpgradePrompt(error)) {
        message.error(getErrorMessage(error));
      }
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
    const updated = await resumeSaveCoordinator.track(Number(id), 'avatar-settings', resumeService.updatePersonalInfo(Number(id), nextPersonalInfo));
    onResumeChange({ ...resume, personalInfo: updated });
  };

  const updateSectionConfig = async (nextConfig: ResumeSectionConfig[]) => {
    if (!id) return;
    await resumeSaveCoordinator.track(Number(id), 'section-settings', resumeService.updateResume(Number(id), { sectionConfig: nextConfig }));
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
      if (isFormValidateError(error) || openUpgradePrompt(error)) return;
      message.error(t('settings.createVersionFailed', { message: getErrorMessage(error) }));
    } finally {
      setDuplicating(false);
    }
  };

  return (
    <Space direction="vertical" size="large" className="settings-stack">
      <Card className="settings-card" title={t('settings.templateSelect')}>
        <div className="template-grid">
          {TEMPLATE_OPTIONS.map((template) => {
            const isApplied = resume.templateId === template.id;
            const isPreviewing = previewTemplateId === template.id;
            const metaKeys = templateMetaKeys[template.id] || [];

            return (
              <Card
                key={template.id}
                hoverable
                className={[
                  'template-card',
                  isApplied ? 'template-card--active' : '',
                  !isApplied && isPreviewing ? 'template-card--preview' : '',
                ].join(' ')}
              >
                <div className="template-card-header">
                  <div style={{ fontWeight: 700, color: '#1c1917' }}>{t(template.nameKey)}</div>
                  <Space size={6} wrap>
                    {isApplied && <Tag color="gold">{t('settings.templateApplied')}</Tag>}
                    {!isApplied && isPreviewing && <Tag color="warning">{t('settings.templatePreviewing')}</Tag>}
                  </Space>
                </div>

                <TemplateThumbnail templateId={template.id} themeColor={resume.themeColor} />

                <div className="template-card-copy">{t(template.descriptionKey)}</div>

                <div className="template-card-meta">
                  {metaKeys.map((key) => (
                    <Tag key={key} style={{ borderRadius: 999 }}>{t(key)}</Tag>
                  ))}
                </div>

                <Space style={{ marginTop: 16 }} wrap>
                  <Button icon={<EyeOutlined />} onClick={() => onPreviewTemplateChange?.(template.id)}>
                    {t('settings.templatePreviewBtn')}
                  </Button>
                  <Button
                    type="primary"
                    disabled={isApplied}
                    onClick={() => {
                      onPreviewTemplateChange?.(null);
                      void saveResumeMeta({ templateId: template.id });
                    }}
                  >
                    {isApplied ? t('settings.templateCurrentBtn') : t('settings.templateApplyBtn')}
                  </Button>
                </Space>
              </Card>
            );
          })}
        </div>
        {previewTemplateId && previewTemplateId !== resume.templateId && (
          <div style={{ marginTop: 16 }}>
            <Tag color="warning">{t('settings.templatePreviewingUnApplied')}</Tag>
            <Button type="link" onClick={() => onPreviewTemplateChange?.(null)} style={{ paddingInline: 8, color: '#9d6b21' }}>
              {t('settings.templateBackToCurrent')}
            </Button>
          </div>
        )}
      </Card>

      <Card
        className="settings-card"
        title={t('settings.themeColor')}
        extra={chosenColor ? (
          <Button type="link" style={{ paddingInline: 0, color: '#9d6b21' }} onClick={() => { void saveResumeMeta({ themeColor: '' }); }}>
            {t('settings.themeColorReset')}
          </Button>
        ) : null}
      >
        <div className="theme-swatches">
          {THEME_PRESETS.map((preset) => (
            <button
              key={preset.key}
              type="button"
              className={`theme-swatch${chosenColor === preset.color ? ' theme-swatch--active' : ''}`}
              style={{ background: preset.color }}
              title={t(`settings.themePresets.${preset.key}`)}
              aria-label={t(`settings.themePresets.${preset.key}`)}
              aria-pressed={chosenColor === preset.color}
              onClick={() => { void saveResumeMeta({ themeColor: preset.color }); }}
            />
          ))}
          <ColorPicker
            disabledAlpha
            value={effectiveAccent}
            onChangeComplete={(color) => { void saveResumeMeta({ themeColor: color.toHexString().slice(0, 7) }); }}
          >
            <Button size="small">{t('settings.themeColorCustom')}</Button>
          </ColorPicker>
        </div>
        <div className="theme-hint">
          {!chosenColor
            ? t('settings.themeColorDefaultHint')
            : effectiveAccent !== chosenColor
            ? t('settings.themeColorAdjusted', { color: effectiveAccent })
            : t('settings.themeColorHint')}
        </div>
      </Card>

      <Card className="settings-card" title={t('settings.layoutDensity')}>
        <Segmented
          block
          value={resume.layoutDensity || 'balanced'}
          options={(['compact', 'balanced', 'spacious'] as const).map((value) => ({
            label: t(`settings.layoutDensityOptions.${value}`),
            value,
          }))}
          onChange={(value) => { void saveResumeMeta({ layoutDensity: value as Resume['layoutDensity'] }); }}
        />
        <div className="theme-hint">{t('settings.layoutDensityHint')}</div>
      </Card>

      <Card className="settings-card" title={t('settings.positionVersion')}>
        <Form form={resumeForm} layout="vertical" onValuesChange={(_, allValues) => { void saveResumeMeta(allValues); }}>
          <Form.Item label={t('settings.resumeTitleLabel')} name="title">
            <Input placeholder={t('settings.resumeTitlePlaceholder')} />
          </Form.Item>
          <Form.Item label={t('settings.versionLabelLabel')} name="versionLabel">
            <Input placeholder={t('settings.versionLabelPlaceholder')} />
          </Form.Item>
          <Form.Item label={t('settings.targetRoleLabel')} name="targetRole">
            <Input placeholder={t('settings.targetRolePlaceholder')} />
          </Form.Item>
        </Form>
        <Button
          icon={<CopyOutlined />}
          onClick={() => {
            duplicateForm.setFieldsValue({
              title: `${resume.title} - ${resume.targetRole || t('settings.defaultVersionLabel')}`,
              versionLabel: resume.versionLabel || t('settings.defaultVersionLabelValue'),
              targetRole: resume.targetRole || '',
            });
            setDuplicateOpen(true);
          }}
        >
          {t('settings.createVersionBtn')}
        </Button>
      </Card>

      <Card className="settings-card" title={t('settings.avatarSettings')}>
        <Form form={avatarForm} layout="vertical" onValuesChange={(_, allValues) => { void savePersonalInfo(allValues); }}>
          <Form.Item label={t('settings.avatarUrlLabel')} name="avatarUrl">
            <Input placeholder="https://example.com/avatar.jpg" />
          </Form.Item>
          <Form.Item label={t('settings.showAvatarLabel')} name="showAvatar" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
        <Space>
          <Avatar size={64} src={resume.personalInfo?.showAvatar ? resume.personalInfo?.avatarUrl : undefined} icon={<UserOutlined />} />
          <span style={{ color: '#666' }}>{t('settings.avatarPreviewHint')}</span>
        </Space>
      </Card>

      <Card className="settings-card" title={t('settings.sectionOrder')}>
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
              <List.Item.Meta
                title={t(`settings.sectionLabels.${item.key}`, { defaultValue: item.key })}
                description={item.visible ? t('settings.sectionVisible') : t('settings.sectionHidden')}
              />
            </List.Item>
          )}
        />
      </Card>

      <Modal title={t('settings.createVersionModal')} open={duplicateOpen} onOk={handleDuplicate} confirmLoading={duplicating} onCancel={() => setDuplicateOpen(false)}>
        <Form form={duplicateForm} layout="vertical">
          <Form.Item label={t('settings.newResumeTitleLabel')} name="title" rules={[{ required: true, message: t('settings.newResumeTitleRequired') }]}>
            <Input />
          </Form.Item>
          <Form.Item label={t('settings.versionLabelLabel')} name="versionLabel">
            <Input />
          </Form.Item>
          <Form.Item label={t('settings.targetRoleLabel')} name="targetRole">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
};

export default ResumeSettingsSection;
