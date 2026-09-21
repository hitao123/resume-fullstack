import { useState, useEffect, useRef, useCallback } from 'react';
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
import MinimalDocument from '@/components/pdf/MinimalDocument';
import PdfPreviewModal from '@/components/pdf/PdfPreviewModal';
import { usePDFExport } from '@/hooks/usePDFExport';
import { useStablePdfExport } from '@/hooks/useStablePdfExport';
import { useResumeStore } from '@/store/resumeStore';
import resumeService from '@/services/resumeService';
import type { Resume } from '@/types/resume.types';
import { TEMPLATE_NAME_KEYS } from '@/utils/constants';
import { normalizeResume } from '../../../packages/resume-document/src/index';
import { resumeSaveCoordinator } from '@/utils/resumeSaveCoordinator';
import type { MenuProps } from 'antd';
import { useTranslation } from 'react-i18next';
import '@/components/resume/ResumeWorkspace.css';

const { Content, Sider } = Layout;
export const ResumeEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { currentResume, fetchResume, isLoading } = useResumeStore();
  const [resume, setResume] = useState<Resume | null>(null);
  const [activeTab, setActiveTab] = useState('personal');
  const [previewVisible, setPreviewVisible] = useState(true);
  const [previewWidth, setPreviewWidth] = useState(620);
  const [previewTemplateId, setPreviewTemplateId] = useState<number | null>(null);
  const [previewFitMode, setPreviewFitMode] = useState<'a4' | 'screen'>('screen');
  const [pdfTemplate, setPdfTemplate] = useState<'classic' | 'modern' | 'minimal'>('classic');
  const [stablePreviewOpen, setStablePreviewOpen] = useState(false);
  const { generatePDF, previewPDF, isGenerating, exportMode, switchExportMode } = usePDFExport();
  const stablePdf = useStablePdfExport();
  const { markStale } = stablePdf;
  const resizeStateRef = useRef<{ startX: number; startWidth: number } | null>(null);
  const exportRevisionRef = useRef(0);

  const invalidateExport = useCallback(() => {
    exportRevisionRef.current += 1;
    markStale();
  }, [markStale]);

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

  const effectiveTemplateId = previewTemplateId ?? resume?.templateId;
  const isMinimalV2 = effectiveTemplateId === 3 && import.meta.env.VITE_MINIMAL_V2_ENABLED !== 'false';
  const canGenerateStablePdf = resume?.templateId === 3 && previewTemplateId === null;

  // The section forms persist independently. Wait through the longest local
  // debounce, then reload the server snapshot. If the draft remains different,
  // fail explicitly instead of exporting a stale server copy.
  const freshServerResume = async (revision: number): Promise<Resume | undefined> => {
    if (!resume || !id) return undefined;
    await resumeSaveCoordinator.flush(Number(id));
    if (revision !== exportRevisionRef.current) return undefined;
    const serverResume = await resumeService.getResume(Number(id));
    const normalizedServer = normalizeResume(serverResume, { locale: i18n.language });
    const normalizedDraft = normalizeResume(resume, { locale: i18n.language });
    if (revision !== exportRevisionRef.current || JSON.stringify(normalizedServer) !== JSON.stringify(normalizedDraft)) {
      message.warning(t('resumeEditor.export.stableSaving'));
      return undefined;
    }
    return serverResume;
  };

  const generateStablePdf = async (openPreview: boolean): Promise<string | undefined> => {
    if (!canGenerateStablePdf) {
      message.warning(t('resumeEditor.export.stableTemplatePending'));
      return undefined;
    }
    const revision = exportRevisionRef.current;
    let serverResume: Resume | undefined;
    try {
      serverResume = await freshServerResume(revision);
    } catch (error) {
      message.warning(error instanceof Error ? error.message : t('resumeEditor.export.stableSaving'));
      return undefined;
    }
    if (!serverResume) return undefined;
    const result = await stablePdf.generate(serverResume.id, i18n.language);
    if (revision !== exportRevisionRef.current) return undefined;
    const { url } = result;
    if (url && openPreview) setStablePreviewOpen(true);
    if (result.error) message.error(result.error);
    return url;
  };

  const handleExport = async () => {
    if (!resume) return;
    if (isMinimalV2) {
      const url = await generateStablePdf(false);
      if (url) {
        const link = document.createElement('a');
        link.href = url;
        link.download = 'resume-minimal-v2.pdf';
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
      return;
    }
    await generatePDF({ ...resume, templateId: previewTemplateId ?? resume.templateId }, pdfTemplate);
  };

  const handlePreviewPDF = async () => {
    if (!resume) return;
    if (isMinimalV2) {
      await generateStablePdf(true);
      return;
    }
    await previewPDF({ ...resume, templateId: previewTemplateId ?? resume.templateId }, pdfTemplate);
  };

  useEffect(() => { invalidateExport(); }, [i18n.language, invalidateExport]);

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

  const modeLabel = isMinimalV2
    ? 'minimal-v2'
    : exportMode === 'html2canvas'
    ? t('resumeEditor.export.modeHtml2canvasShort')
    : (pdfTemplate === 'classic' ? t('resumeEditor.export.classicShort') : pdfTemplate === 'modern' ? t('resumeEditor.export.modernShort') : t('resumeEditor.export.minimalShort'));

  const exportMenuItems: MenuProps['items'] = isMinimalV2 ? [
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
  ] : [
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
              {t('resumeEditor.export.minimal')}
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
    invalidateExport();
    setResume((prev) => (prev ? { ...prev, personalInfo: { ...prev.personalInfo!, ...data } } : prev));
  };

  const updateWorkExperiences = (data: any[]) => {
    invalidateExport();
    setResume((prev) => (prev ? { ...prev, workExperiences: data } : prev));
  };

  const updateEducation = (data: any[]) => {
    invalidateExport();
    setResume((prev) => (prev ? { ...prev, education: data } : prev));
  };

  const updateSkills = (data: any[]) => {
    invalidateExport();
    setResume((prev) => (prev ? { ...prev, skills: data } : prev));
  };

  const updateProjects = (data: any[]) => {
    invalidateExport();
    setResume((prev) => (prev ? { ...prev, projects: data } : prev));
  };

  const updateCertifications = (data: any[]) => {
    invalidateExport();
    setResume((prev) => (prev ? { ...prev, certifications: data } : prev));
  };

  const updateLanguages = (data: any[]) => {
    invalidateExport();
    setResume((prev) => (prev ? { ...prev, languages: data } : prev));
  };

  const updateAwards = (data: any[]) => {
    invalidateExport();
    setResume((prev) => (prev ? { ...prev, awards: data } : prev));
  };

  const updateCustomSections = (data: any[]) => {
    invalidateExport();
    setResume((prev) => (prev ? { ...prev, customSections: data } : prev));
  };

  if (isLoading || !resume) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" tip={t('resumeEditor.loading')} />
      </div>
    );
  }

  const currentTemplateName = t(TEMPLATE_NAME_KEYS[resume.templateId] || 'common.template');
  const previewTemplateName = previewTemplateId ? t(TEMPLATE_NAME_KEYS[previewTemplateId] || 'common.template') : currentTemplateName;

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
      label: t('resumeEditor.tabs.certifications'),
      children: <CertificationsSection data={resume.certifications || []} onChange={updateCertifications} />,
    },
    {
      key: 'languages',
      label: t('resumeEditor.tabs.languages'),
      children: <LanguagesSection data={resume.languages || []} onChange={updateLanguages} />,
    },
    {
      key: 'awards',
      label: t('resumeEditor.tabs.awards'),
      children: <AwardsSection data={resume.awards || []} onChange={updateAwards} />,
    },
    {
      key: 'custom',
      label: t('resumeEditor.tabs.custom'),
      children: <CustomSectionsSection data={resume.customSections || []} onChange={updateCustomSections} />,
    },
    {
      key: 'layout',
      label: t('resumeEditor.tabs.layout'),
      children: (
        <ResumeSettingsSection
          resume={resume}
          onResumeChange={(nextResume) => { invalidateExport(); setResume(nextResume); }}
          previewTemplateId={previewTemplateId}
          onPreviewTemplateChange={(templateId) => { invalidateExport(); setPreviewTemplateId(templateId); }}
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
                  {resume.versionLabel || t('resumeEditor.currentEditingVersion')}
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
              {isMinimalV2
                  ? `minimal-v2: ${t(`resumeEditor.export.stableStatus.${stablePdf.status}`)}`
                  : exportMode === 'html2canvas'
                  ? t('resumeEditor.export.htmlPreview')
                  : t('resumeEditor.export.modeReactPdf')}
              </Tag>
              {previewVisible && (
                <Segmented
                  size="middle"
                  value={previewFitMode}
                  onChange={(value) => setPreviewFitMode(value as 'a4' | 'screen')}
                  options={[
                    { label: t('resumeEditor.fitA4'), value: 'a4' },
                    { label: t('resumeEditor.fitScreen'), value: 'screen' },
                  ]}
                />
              )}
              <Button icon={<EyeOutlined />} onClick={() => setPreviewVisible(!previewVisible)}>
                {previewVisible ? t('resumeEditor.hidePreview') : t('resumeEditor.showPreview')}
              </Button>
              <Dropdown menu={{ items: exportMenuItems }} placement="bottomRight">
                <Button icon={<DownloadOutlined />} loading={isGenerating || stablePdf.status === 'queued' || stablePdf.status === 'rendering'} type="primary">
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
            title={t('resumeEditor.dragToResize')}
          >
            <div className="resume-preview-handle-line" />
          </div>
          <Sider width={effectivePreviewWidth} className="resume-preview-sider">
            <div className="resume-preview-toolbar">
              <div className="resume-preview-toolbar-title">
                <strong>{t('resumeEditor.previewLabel', { name: previewTemplateName })}</strong>
                <span>
                  {previewTemplateId && previewTemplateId !== resume.templateId
                    ? t('resumeEditor.previewingUnapplied', { current: currentTemplateName })
                    : t('resumeEditor.currentTemplate', { name: currentTemplateName })}
                </span>
              </div>
              <Space size={[8, 8]} wrap>
                <Tag color="gold">{previewFitMode === 'a4' ? t('resumeEditor.a4View') : t('resumeEditor.screenView')}</Tag>
                {previewTemplateId && previewTemplateId !== resume.templateId && <Tag color="warning">{t('resumeEditor.tempPreview')}</Tag>}
              </Space>
            </div>
            <div className="resume-preview-stage">
              {isMinimalV2
                ? <MinimalDocument resume={resume} locale={i18n.language} fitMode={previewFitMode} />
                : <ResumePreview resume={{ ...resume, templateId: previewTemplateId ?? resume.templateId }} />}
            </div>
          </Sider>
        </>
      )}
      <PdfPreviewModal open={stablePreviewOpen} title={t('resumeEditor.export.stablePreviewTitle')} url={stablePdf.blobUrl} loading={stablePdf.status === 'queued' || stablePdf.status === 'rendering'} onClose={() => setStablePreviewOpen(false)} />
    </Layout>
  );
};

export default ResumeEditor;
