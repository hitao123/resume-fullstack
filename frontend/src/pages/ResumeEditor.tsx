import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout, Card, Tabs, Button, Space, message, Dropdown, Spin, Tag, Segmented } from 'antd';
import { DownloadOutlined, EyeOutlined, MoreOutlined, ArrowLeftOutlined, CheckCircleOutlined } from '@ant-design/icons';
import PersonalInfoForm from '@/components/resume/PersonalInfoForm';
import WorkExperienceSection from '@/components/resume/WorkExperienceSection';
import EducationSection from '@/components/resume/EducationSection';
import SkillsSection from '@/components/resume/SkillsSection';
import ProjectsSection from '@/components/resume/ProjectsSection';
import CertificationsSection from '@/components/resume/CertificationsSection';
import LanguagesSection from '@/components/resume/LanguagesSection';
import AwardsSection from '@/components/resume/AwardsSection';
import CustomSectionsSection from '@/components/resume/CustomSectionsSection';
import ResumeSettingsSection from '@/components/resume/ResumeSettingsSection';
import ResumePreview from '@/components/resume/ResumePreview';
import { usePDFExport } from '@/hooks/usePDFExport';
import { useResumeStore } from '@/store/resumeStore';
import type { Resume } from '@/types/resume.types';
import { TEMPLATE_NAMES } from '@/utils/constants';
import type { MenuProps } from 'antd';
import { useTranslation } from 'react-i18next';
import '@/components/resume/ResumeWorkspace.css';

const { Content, Sider } = Layout;
export const ResumeEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { currentResume, fetchResume, isLoading } = useResumeStore();
  const [resume, setResume] = useState<Resume | null>(null);
  const [activeTab, setActiveTab] = useState('personal');
  const [previewVisible, setPreviewVisible] = useState(true);
  const [previewWidth, setPreviewWidth] = useState(620);
  const [previewTemplateId, setPreviewTemplateId] = useState<number | null>(null);
  const [previewFitMode, setPreviewFitMode] = useState<'a4' | 'screen'>('screen');
  const [pdfTemplate, setPdfTemplate] = useState<'classic' | 'modern' | 'minimal'>('classic');
  const { generatePDF, previewPDF, isGenerating, exportMode, switchExportMode } = usePDFExport();
  const resizeStateRef = useRef<{ startX: number; startWidth: number } | null>(null);

  useEffect(() => {
    if (id) {
      fetchResume(Number(id))
        .then((loadedResume) => {
          setResume(loadedResume);
        })
        .catch((error) => {
          message.error(t('resumeEditor.loadFailed', { message: error.message }));
          navigate('/dashboard');
        });
    }
  }, [id, fetchResume, navigate, t]);

  useEffect(() => {
    if (currentResume && currentResume.id === Number(id)) {
      setResume(currentResume);
      setPreviewTemplateId(null);
      if (currentResume.templateId === 1) setPdfTemplate('modern');
      if (currentResume.templateId === 2) setPdfTemplate('classic');
      if (currentResume.templateId === 3) setPdfTemplate('minimal');
    }
  }, [currentResume, id]);

  const handleExport = async () => {
    if (!resume) return;
    await generatePDF({ ...resume, templateId: previewTemplateId ?? resume.templateId }, pdfTemplate);
  };

  const handlePreviewPDF = async () => {
    if (!resume) return;
    await previewPDF({ ...resume, templateId: previewTemplateId ?? resume.templateId }, pdfTemplate);
  };

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!resizeStateRef.current) return;
      const delta = resizeStateRef.current.startX - event.clientX;
      setPreviewWidth(Math.max(460, Math.min(1020, resizeStateRef.current.startWidth + delta)));
    };

    const handleMouseUp = () => {
      resizeStateRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const startResize = (event: React.MouseEvent<HTMLDivElement>) => {
    resizeStateRef.current = {
      startX: event.clientX,
      startWidth: previewWidth,
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const effectivePreviewWidth = previewFitMode === 'a4' ? 860 : previewWidth;

  const modeLabel = exportMode === 'html2canvas'
    ? t('resumeEditor.export.modeHtml2canvasShort')
    : (pdfTemplate === 'classic' ? t('resumeEditor.export.classicShort') : pdfTemplate === 'modern' ? t('resumeEditor.export.modernShort') : '极简');

  const exportMenuItems: MenuProps['items'] = [
    {
      key: 'exportMode',
      label: t('resumeEditor.export.exportMode'),
      children: [
        {
          key: 'mode-react-pdf',
          label: (
            <Space>
              {t('resumeEditor.export.modeReactPdf')}
              {exportMode === 'react-pdf' && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
            </Space>
          ),
          onClick: () => switchExportMode('react-pdf'),
        },
        {
          key: 'mode-html2canvas',
          label: (
            <Space>
              {t('resumeEditor.export.modeHtml2canvas')}
              {exportMode === 'html2canvas' && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
            </Space>
          ),
          onClick: () => switchExportMode('html2canvas'),
        },
      ],
    },
    ...(exportMode === 'react-pdf' ? [{
      key: 'template',
      label: t('resumeEditor.export.chooseTemplate'),
      children: [
        {
          key: 'classic',
          label: (
            <Space>
              {t('resumeEditor.export.classic')}
              {pdfTemplate === 'classic' && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
            </Space>
          ),
          onClick: () => setPdfTemplate('classic'),
        },
        {
          key: 'modern',
          label: (
            <Space>
              {t('resumeEditor.export.modern')}
              {pdfTemplate === 'modern' && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
            </Space>
          ),
          onClick: () => setPdfTemplate('modern'),
        },
        {
          key: 'minimal',
          label: (
            <Space>
              极简模板
              {pdfTemplate === 'minimal' && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
            </Space>
          ),
          onClick: () => setPdfTemplate('minimal'),
        },
      ],
    }] : []),
    {
      type: 'divider' as const,
    },
    {
      key: 'download',
      label: t('resumeEditor.export.downloadPdf', { template: modeLabel }),
      icon: <DownloadOutlined />,
      onClick: handleExport,
    },
    {
      key: 'preview',
      label: t('resumeEditor.export.previewPdf', { template: modeLabel }),
      icon: <EyeOutlined />,
      onClick: handlePreviewPDF,
    },
  ];

  const updatePersonalInfo = (data: any) => {
    setResume((prev) => (prev ? { ...prev, personalInfo: { ...prev.personalInfo!, ...data } } : prev));
  };

  const updateWorkExperiences = (data: any[]) => {
    setResume((prev) => (prev ? { ...prev, workExperiences: data } : prev));
  };

  const updateEducation = (data: any[]) => {
    setResume((prev) => (prev ? { ...prev, education: data } : prev));
  };

  const updateSkills = (data: any[]) => {
    setResume((prev) => (prev ? { ...prev, skills: data } : prev));
  };

  const updateProjects = (data: any[]) => {
    setResume((prev) => (prev ? { ...prev, projects: data } : prev));
  };

  const updateCertifications = (data: any[]) => {
    setResume((prev) => (prev ? { ...prev, certifications: data } : prev));
  };

  const updateLanguages = (data: any[]) => {
    setResume((prev) => (prev ? { ...prev, languages: data } : prev));
  };

  const updateAwards = (data: any[]) => {
    setResume((prev) => (prev ? { ...prev, awards: data } : prev));
  };

  const updateCustomSections = (data: any[]) => {
    setResume((prev) => (prev ? { ...prev, customSections: data } : prev));
  };

  if (isLoading || !resume) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" tip={t('resumeEditor.loading')} />
      </div>
    );
  }

  const currentTemplateName = TEMPLATE_NAMES[resume.templateId] || 'Template';
  const previewTemplateName = previewTemplateId ? TEMPLATE_NAMES[previewTemplateId] : currentTemplateName;

  const tabItems = [
    {
      key: 'personal',
      label: t('resumeEditor.tabs.personal'),
      children: <PersonalInfoForm data={resume.personalInfo} onChange={updatePersonalInfo} />,
    },
    {
      key: 'experience',
      label: t('resumeEditor.tabs.experience'),
      children: <WorkExperienceSection data={resume.workExperiences || []} onChange={updateWorkExperiences} />,
    },
    {
      key: 'education',
      label: t('resumeEditor.tabs.education'),
      children: <EducationSection data={resume.education || []} onChange={updateEducation} />,
    },
    {
      key: 'skills',
      label: t('resumeEditor.tabs.skills'),
      children: <SkillsSection data={resume.skills || []} onChange={updateSkills} />,
    },
    {
      key: 'projects',
      label: t('resumeEditor.tabs.projects'),
      children: <ProjectsSection data={resume.projects || []} onChange={updateProjects} />,
    },
    {
      key: 'certifications',
      label: '证书',
      children: <CertificationsSection data={resume.certifications || []} onChange={updateCertifications} />,
    },
    {
      key: 'languages',
      label: '语言',
      children: <LanguagesSection data={resume.languages || []} onChange={updateLanguages} />,
    },
    {
      key: 'awards',
      label: '奖项',
      children: <AwardsSection data={resume.awards || []} onChange={updateAwards} />,
    },
    {
      key: 'custom',
      label: '自定义模块',
      children: <CustomSectionsSection data={resume.customSections || []} onChange={updateCustomSections} />,
    },
    {
      key: 'layout',
      label: '布局与版本',
      children: (
        <ResumeSettingsSection
          resume={resume}
          onResumeChange={setResume}
          previewTemplateId={previewTemplateId}
          onPreviewTemplateChange={setPreviewTemplateId}
        />
      ),
    },
  ];

  return (
    <Layout className="resume-editor-layout">
      <Content className="resume-editor-content">
        <Card
          className="resume-editor-shell"
          title={
            <div className="resume-editor-titlebar">
              <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/dashboard')} />
              <div className="resume-editor-title">
                <strong>{resume.title}</strong>
                <span>
                  {resume.versionLabel || '当前编辑版本'}
                  {resume.targetRole ? ` · ${resume.targetRole}` : ''}
                </span>
              </div>
              <span className="resume-editor-status">
                <CheckCircleOutlined />
                {t('resumeEditor.autoSave')}
              </span>
            </div>
          }
          extra={
            <Space wrap>
              <Tag color={exportMode === 'html2canvas' ? 'green' : 'gold'}>
                {exportMode === 'html2canvas' ? 'HTML 预览导出' : 'React PDF'}
              </Tag>
              {previewVisible && (
                <Segmented
                  size="middle"
                  value={previewFitMode}
                  onChange={(value) => setPreviewFitMode(value as 'a4' | 'screen')}
                  options={[
                    { label: '适配 A4', value: 'a4' },
                    { label: '适配屏幕', value: 'screen' },
                  ]}
                />
              )}
              <Button icon={<EyeOutlined />} onClick={() => setPreviewVisible(!previewVisible)}>
                {previewVisible ? t('resumeEditor.hidePreview') : t('resumeEditor.showPreview')}
              </Button>
              <Dropdown menu={{ items: exportMenuItems }} placement="bottomRight">
                <Button icon={<DownloadOutlined />} loading={isGenerating} type="primary">
                  {t('resumeEditor.export.button')} <MoreOutlined />
                </Button>
              </Dropdown>
            </Space>
          }
        >
          <Tabs className="resume-editor-tabs" activeKey={activeTab} onChange={setActiveTab} items={tabItems} size="large" />
        </Card>
      </Content>

      {previewVisible && (
        <>
          <div
            onMouseDown={previewFitMode === 'screen' ? startResize : undefined}
            className="resume-preview-handle"
            style={{
              cursor: previewFitMode === 'screen' ? 'col-resize' : 'default',
              opacity: previewFitMode === 'screen' ? 1 : 0.45,
              pointerEvents: previewFitMode === 'screen' ? 'auto' : 'none',
            }}
            title="拖拽调整预览宽度"
          >
            <div className="resume-preview-handle-line" />
          </div>
          <Sider width={effectivePreviewWidth} className="resume-preview-sider">
            <div className="resume-preview-toolbar">
              <div className="resume-preview-toolbar-title">
                <strong>{previewTemplateName} 预览</strong>
                <span>
                  {previewTemplateId && previewTemplateId !== resume.templateId
                    ? `正在预览未应用模板，当前保存模板为 ${currentTemplateName}`
                    : `当前模板：${currentTemplateName}`}
                </span>
              </div>
              <Space size={[8, 8]} wrap>
                <Tag color="gold">{previewFitMode === 'a4' ? 'A4 视图' : '屏幕视图'}</Tag>
                {previewTemplateId && previewTemplateId !== resume.templateId && <Tag color="warning">临时预览</Tag>}
              </Space>
            </div>
            <div className="resume-preview-stage">
              <ResumePreview resume={{ ...resume, templateId: previewTemplateId ?? resume.templateId }} />
            </div>
          </Sider>
        </>
      )}
    </Layout>
  );
};

export default ResumeEditor;
