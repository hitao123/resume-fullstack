import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout, Card, Tabs, Button, Space, message, Dropdown, Spin, Badge, Tag } from 'antd';
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
import type { MenuProps } from 'antd';
import { useTranslation } from 'react-i18next';

const { Content, Sider } = Layout;

export const ResumeEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { currentResume, fetchResume, isLoading } = useResumeStore();
  const [resume, setResume] = useState<Resume | null>(null);
  const [activeTab, setActiveTab] = useState('personal');
  const [previewVisible, setPreviewVisible] = useState(true);
  const [previewWidth, setPreviewWidth] = useState(560);
  const [previewTemplateId, setPreviewTemplateId] = useState<number | null>(null);
  const [pdfTemplate, setPdfTemplate] = useState<'classic' | 'modern' | 'minimal'>('classic');
  const { generatePDF, previewPDF, isGenerating, exportMode, switchExportMode } = usePDFExport();
  const resizeStateRef = useRef<{ startX: number; startWidth: number } | null>(null);

  // Load resume on mount
  useEffect(() => {
    if (id) {
      fetchResume(Number(id))
        .then(() => {
          if (currentResume) {
            setResume(currentResume);
          }
        })
        .catch((error) => {
          message.error(t('resumeEditor.loadFailed', { message: error.message }));
          navigate('/dashboard');
        });
    }
  }, [id, fetchResume, navigate]);

  // Update local state when currentResume changes
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
      setPreviewWidth(Math.max(420, Math.min(980, resizeStateRef.current.startWidth + delta)));
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
    setResume((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        personalInfo: { ...prev.personalInfo!, ...data },
      };
    });
  };

  const updateWorkExperiences = (data: any[]) => {
    setResume((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        workExperiences: data,
      };
    });
  };

  const updateEducation = (data: any[]) => {
    setResume((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        education: data,
      };
    });
  };

  const updateSkills = (data: any[]) => {
    setResume((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        skills: data,
      };
    });
  };

  const updateProjects = (data: any[]) => {
    setResume((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        projects: data,
      };
    });
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

  const tabItems = [
    {
      key: 'personal',
      label: t('resumeEditor.tabs.personal'),
      children: (
        <PersonalInfoForm
          data={resume.personalInfo}
          onChange={updatePersonalInfo}
        />
      ),
    },
    {
      key: 'experience',
      label: t('resumeEditor.tabs.experience'),
      children: (
        <WorkExperienceSection
          data={resume.workExperiences || []}
          onChange={updateWorkExperiences}
        />
      ),
    },
    {
      key: 'education',
      label: t('resumeEditor.tabs.education'),
      children: (
        <EducationSection
          data={resume.education || []}
          onChange={updateEducation}
        />
      ),
    },
    {
      key: 'skills',
      label: t('resumeEditor.tabs.skills'),
      children: (
        <SkillsSection
          data={resume.skills || []}
          onChange={updateSkills}
        />
      ),
    },
    {
      key: 'projects',
      label: t('resumeEditor.tabs.projects'),
      children: (
        <ProjectsSection
          data={resume.projects || []}
          onChange={updateProjects}
        />
      ),
    },
    {
      key: 'certifications',
      label: '证书',
      children: (
        <CertificationsSection
          data={resume.certifications || []}
          onChange={updateCertifications}
        />
      ),
    },
    {
      key: 'languages',
      label: '语言',
      children: (
        <LanguagesSection
          data={resume.languages || []}
          onChange={updateLanguages}
        />
      ),
    },
    {
      key: 'awards',
      label: '奖项',
      children: (
        <AwardsSection
          data={resume.awards || []}
          onChange={updateAwards}
        />
      ),
    },
    {
      key: 'custom',
      label: '自定义模块',
      children: (
        <CustomSectionsSection
          data={resume.customSections || []}
          onChange={updateCustomSections}
        />
      ),
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
    <Layout style={{ minHeight: 'calc(100vh - 64px)', background: '#f0f2f5' }}>
      {/* 左侧编辑区 */}
      <Content style={{ padding: '16px', overflow: 'auto' }}>
        <Card
          title={
            <Space>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/dashboard')}
              />
              <span>{resume.title}</span>
              <Badge
                status="success"
                text={
                  <span style={{ fontSize: '12px', color: '#52c41a' }}>
                    <CheckCircleOutlined /> {t('resumeEditor.autoSave')}
                  </span>
                }
              />
            </Space>
          }
          extra={
            <Space>
              <Tag color={exportMode === 'html2canvas' ? 'green' : 'blue'}>
                {exportMode === 'html2canvas' ? 'HTML' : 'PDF'}
              </Tag>
              <Button
                icon={<EyeOutlined />}
                onClick={() => setPreviewVisible(!previewVisible)}
              >
                {previewVisible ? t('resumeEditor.hidePreview') : t('resumeEditor.showPreview')}
              </Button>
              <Dropdown menu={{ items: exportMenuItems }} placement="bottomRight">
                <Button
                  icon={<DownloadOutlined />}
                  loading={isGenerating}
                  type="primary"
                >
                  {t('resumeEditor.export.button')} <MoreOutlined />
                </Button>
              </Dropdown>
            </Space>
          }
        >
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            size="large"
          />
        </Card>
      </Content>

      {/* 右侧预览区 */}
      {previewVisible && (
        <>
          <div
            onMouseDown={startResize}
            style={{
              width: 14,
              cursor: 'col-resize',
              position: 'relative',
              background: 'transparent',
              flex: '0 0 14px',
            }}
            title="拖拽调整预览宽度"
          >
            <div
              style={{
                position: 'absolute',
                left: 5,
                top: 24,
                bottom: 24,
                width: 4,
                borderRadius: 999,
                background: '#cbd5e1',
              }}
            />
          </div>
          <Sider
            width={previewWidth}
            style={{
              background: '#fff',
              overflow: 'auto',
              height: 'calc(100vh - 64px)',
              position: 'sticky',
              top: 64,
              right: 0,
              borderLeft: '1px solid #f0f0f0',
              maxWidth: '75vw',
            }}
          >
            <ResumePreview resume={{ ...resume, templateId: previewTemplateId ?? resume.templateId }} />
          </Sider>
        </>
      )}
    </Layout>
  );
};

export default ResumeEditor;
