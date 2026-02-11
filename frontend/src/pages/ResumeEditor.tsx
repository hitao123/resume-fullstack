import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Layout, Card, Tabs, Button, Space, message, Dropdown } from 'antd';
import { SaveOutlined, DownloadOutlined, EyeOutlined, MoreOutlined } from '@ant-design/icons';
import PersonalInfoForm from '@/components/resume/PersonalInfoForm';
import WorkExperienceSection from '@/components/resume/WorkExperienceSection';
import EducationSection from '@/components/resume/EducationSection';
import SkillsSection from '@/components/resume/SkillsSection';
import ResumePreview from '@/components/resume/ResumePreview';
import { usePDFExport } from '@/hooks/usePDFExport';
import type { Resume } from '@/types/resume.types';
import type { MenuProps } from 'antd';

const { Content, Sider } = Layout;

// 初始化空简历数据
const initializeEmptyResume = (id: string): Resume => ({
  id: Number(id),
  userId: 1,
  title: '我的简历',
  templateId: 1,
  isDefault: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  personalInfo: {
    id: 0,
    resumeId: Number(id),
    fullName: '',
    email: '',
    phone: '',
    location: '',
    website: '',
    linkedin: '',
    github: '',
    summary: '',
  },
  workExperiences: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
  languages: [],
});

export const ResumeEditor = () => {
  const { id } = useParams<{ id: string }>();
  const [resume, setResume] = useState<Resume>(() => initializeEmptyResume(id || '1'));
  const [activeTab, setActiveTab] = useState('personal');
  const [previewVisible, setPreviewVisible] = useState(true);
  const [pdfTemplate, setPdfTemplate] = useState<'classic' | 'modern'>('classic');
  const { generatePDF, previewPDF, isGenerating } = usePDFExport();

  const handleSave = () => {
    // 这里后续会调用 API 保存
    message.success('简历已保存');
    console.log('保存简历:', resume);
  };

  const handleExport = async () => {
    await generatePDF(resume, pdfTemplate);
  };

  const handlePreviewPDF = async () => {
    await previewPDF(resume, pdfTemplate);
  };

  const exportMenuItems: MenuProps['items'] = [
    {
      key: 'template',
      label: '选择模板',
      children: [
        {
          key: 'classic',
          label: '经典模板',
          onClick: () => setPdfTemplate('classic'),
        },
        {
          key: 'modern',
          label: '现代模板',
          onClick: () => setPdfTemplate('modern'),
        },
      ],
    },
    {
      type: 'divider',
    },
    {
      key: 'download',
      label: `下载 PDF (${pdfTemplate === 'classic' ? '经典' : '现代'})`,
      icon: <DownloadOutlined />,
      onClick: handleExport,
    },
    {
      key: 'preview',
      label: `预览 PDF (${pdfTemplate === 'classic' ? '经典' : '现代'})`,
      icon: <EyeOutlined />,
      onClick: handlePreviewPDF,
    },
  ];

  const updatePersonalInfo = (data: any) => {
    setResume((prev) => ({
      ...prev,
      personalInfo: { ...prev.personalInfo!, ...data },
    }));
  };

  const updateWorkExperiences = (data: any[]) => {
    setResume((prev) => ({
      ...prev,
      workExperiences: data,
    }));
  };

  const updateEducation = (data: any[]) => {
    setResume((prev) => ({
      ...prev,
      education: data,
    }));
  };

  const updateSkills = (data: any[]) => {
    setResume((prev) => ({
      ...prev,
      skills: data,
    }));
  };

  const tabItems = [
    {
      key: 'personal',
      label: '个人信息',
      children: (
        <PersonalInfoForm
          data={resume.personalInfo}
          onChange={updatePersonalInfo}
        />
      ),
    },
    {
      key: 'experience',
      label: '工作经历',
      children: (
        <WorkExperienceSection
          data={resume.workExperiences || []}
          onChange={updateWorkExperiences}
        />
      ),
    },
    {
      key: 'education',
      label: '教育背景',
      children: (
        <EducationSection
          data={resume.education || []}
          onChange={updateEducation}
        />
      ),
    },
    {
      key: 'skills',
      label: '专业技能',
      children: (
        <SkillsSection
          data={resume.skills || []}
          onChange={updateSkills}
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
              <span>{resume.title}</span>
            </Space>
          }
          extra={
            <Space>
              <Button
                icon={<EyeOutlined />}
                onClick={() => setPreviewVisible(!previewVisible)}
              >
                {previewVisible ? '隐藏预览' : '显示预览'}
              </Button>
              <Button icon={<SaveOutlined />} type="primary" onClick={handleSave}>
                保存
              </Button>
              <Dropdown menu={{ items: exportMenuItems }} placement="bottomRight">
                <Button
                  icon={<DownloadOutlined />}
                  loading={isGenerating}
                  type="default"
                >
                  导出 <MoreOutlined />
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