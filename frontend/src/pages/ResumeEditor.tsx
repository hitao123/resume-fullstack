import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout, Card, Tabs, Button, Space, message, Dropdown, Spin, Badge } from 'antd';
import { DownloadOutlined, EyeOutlined, MoreOutlined, ArrowLeftOutlined, CheckCircleOutlined } from '@ant-design/icons';
import PersonalInfoForm from '@/components/resume/PersonalInfoForm';
import WorkExperienceSection from '@/components/resume/WorkExperienceSection';
import EducationSection from '@/components/resume/EducationSection';
import SkillsSection from '@/components/resume/SkillsSection';
import ProjectsSection from '@/components/resume/ProjectsSection';
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
  const [pdfTemplate, setPdfTemplate] = useState<'classic' | 'modern'>('classic');
  const { generatePDF, previewPDF, isGenerating } = usePDFExport();

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
    }
  }, [currentResume, id]);

  const handleExport = async () => {
    if (!resume) return;
    await generatePDF(resume, pdfTemplate);
  };

  const handlePreviewPDF = async () => {
    if (!resume) return;
    await previewPDF(resume, pdfTemplate);
  };

  const exportMenuItems: MenuProps['items'] = [
    {
      key: 'template',
      label: t('resumeEditor.export.chooseTemplate'),
      children: [
        {
          key: 'classic',
          label: t('resumeEditor.export.classic'),
          onClick: () => setPdfTemplate('classic'),
        },
        {
          key: 'modern',
          label: t('resumeEditor.export.modern'),
          onClick: () => setPdfTemplate('modern'),
        },
      ],
    },
    {
      type: 'divider',
    },
    {
      key: 'download',
      label: t('resumeEditor.export.downloadPdf', {
        template: pdfTemplate === 'classic' ? t('resumeEditor.export.classicShort') : t('resumeEditor.export.modernShort'),
      }),
      icon: <DownloadOutlined />,
      onClick: handleExport,
    },
    {
      key: 'preview',
      label: t('resumeEditor.export.previewPdf', {
        template: pdfTemplate === 'classic' ? t('resumeEditor.export.classicShort') : t('resumeEditor.export.modernShort'),
      }),
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
        <Sider
          width={450}
          style={{
            background: '#fff',
            overflow: 'auto',
            height: 'calc(100vh - 64px)',
            position: 'sticky',
            top: 64,
            right: 0,
            borderLeft: '1px solid #f0f0f0',
          }}
        >
          <ResumePreview resume={resume} />
        </Sider>
      )}
    </Layout>
  );
};

export default ResumeEditor;