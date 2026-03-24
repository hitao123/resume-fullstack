import { Avatar, Card, Divider, Space, Tag, Typography } from 'antd';
import { EnvironmentOutlined, LinkOutlined, MailOutlined, PhoneOutlined, UserOutlined } from '@ant-design/icons';
import type { Resume, Skill } from '@/types/resume.types';
import { useTranslation } from 'react-i18next';
import SafeHtmlRenderer from '@/components/common/SafeHtmlRenderer';
import { DEFAULT_SECTION_CONFIG, TEMPLATES } from '@/utils/constants';

const { Title, Text } = Typography;

interface ResumePreviewProps {
  resume: Resume;
}

const sectionTitleMap: Record<string, string> = {
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

const normalizeSections = (resume: Resume) => {
  const configMap = new Map((resume.sectionConfig || []).map((item) => [item.key, item]));
  return DEFAULT_SECTION_CONFIG
    .map((item) => configMap.get(item.key) || { ...item })
    .sort((a, b) => a.order - b.order)
    .filter((item) => item.visible);
};

export const ResumePreview = ({ resume }: ResumePreviewProps) => {
  const { personalInfo, workExperiences, education, skills, projects, certifications, languages, awards, customSections } = resume;
  const { t, i18n } = useTranslation();

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (i18n.language?.startsWith('zh')) {
      return `${date.getFullYear()}年${date.getMonth() + 1}月`;
    }
    return new Intl.DateTimeFormat(i18n.language || 'en-US', { year: 'numeric', month: 'short' }).format(date);
  };

  const formatDateRange = (start?: string, end?: string | null, isCurrent?: boolean) =>
    `${formatDate(start)} - ${isCurrent || !end ? t('resume.common.toPresent') : formatDate(end)}`;

  const groupedSkills = (skills || []).reduce((acc, skill) => {
    const key = skill.category || t('resume.skills.categories.other');
    const label =
      t(`resume.skills.categories.${key}`, {
        defaultValue: skill.category || t('resume.skills.categories.other'),
      }) || key;
    if (!acc[label]) acc[label] = [];
    acc[label].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  const renderSection = (key: string, mode: 'modern' | 'classic' | 'minimal') => {
    const headingStyle =
      mode === 'minimal'
        ? { fontSize: 11, letterSpacing: 1.6, textTransform: 'uppercase' as const, color: '#6b7280' }
        : { fontSize: 18, color: mode === 'modern' ? '#8d6630' : '#4a3822' };

    const sectionTitle = (
      <div style={{ marginBottom: mode === 'minimal' ? 10 : 14 }}>
        {mode === 'minimal' ? (
          <Text strong style={headingStyle}>{sectionTitleMap[key] || key}</Text>
        ) : (
          <>
            <Title level={5} style={{ margin: 0, ...headingStyle }}>{sectionTitleMap[key] || key}</Title>
            <div style={{ width: mode === 'modern' ? 54 : 42, height: 3, borderRadius: 999, marginTop: 8, background: mode === 'modern' ? '#c9a35f' : '#7a5419' }} />
          </>
        )}
      </div>
    );

    let content: React.ReactNode = null;
    switch (key) {
      case 'summary':
        content = personalInfo?.summary ? <SafeHtmlRenderer content={personalInfo.summary} style={{ fontSize: 13, lineHeight: 1.8, color: '#4b5563' }} /> : null;
        break;
      case 'workExperiences':
        content = workExperiences?.length ? (
          <Space direction="vertical" style={{ width: '100%' }} size={mode === 'minimal' ? 'large' : 'middle'}>
            {workExperiences.map((work) => (
              <div key={work.id} style={mode === 'minimal' ? { borderLeft: '2px solid #dbe2ea', paddingLeft: 14 } : undefined}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 4, flexWrap: 'wrap' }}>
                  <Text strong style={{ fontSize: mode === 'modern' ? 15 : 14 }}>{work.position}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>{formatDateRange(work.startDate, work.endDate, work.isCurrent)}</Text>
                </div>
                <div style={{ marginBottom: 6 }}>
                  <Text>{work.companyName}</Text>
                  {work.location && <Text type="secondary"> · {work.location}</Text>}
                </div>
                {work.description && <SafeHtmlRenderer content={work.description} style={{ fontSize: 13, color: '#5b6470', lineHeight: 1.7 }} />}
              </div>
            ))}
          </Space>
        ) : null;
        break;
      case 'education':
        content = education?.length ? (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {education.map((edu) => (
              <div key={edu.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 4, flexWrap: 'wrap' }}>
                  <Text strong>{edu.institution}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>{formatDateRange(edu.startDate, edu.endDate, false)}</Text>
                </div>
                <div>
                  <Text>{edu.degree}</Text>
                  {edu.fieldOfStudy && <Text> · {edu.fieldOfStudy}</Text>}
                  {edu.gpa && <Text type="secondary"> · GPA {edu.gpa}</Text>}
                </div>
                {edu.description && <SafeHtmlRenderer content={edu.description} style={{ fontSize: 13, color: '#666', lineHeight: 1.6, marginTop: 8 }} />}
              </div>
            ))}
          </Space>
        ) : null;
        break;
      case 'skills':
        content = skills?.length ? (
          <Space direction="vertical" style={{ width: '100%' }} size="small">
            {Object.entries(groupedSkills).map(([category, categorySkills]) => (
              <div key={category}>
                <Text strong style={{ fontSize: 13, marginRight: 8 }}>{category}</Text>
                {mode === 'minimal' ? (
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    {(categorySkills || []).map((skill) => skill.name).join(' · ')}
                  </Text>
                ) : (
                  <Space size={[4, 4]} wrap>
                    {(categorySkills || []).map((skill) => (
                      <Tag
                        key={skill.id}
                        style={{
                          borderRadius: 999,
                          paddingInline: 10,
                          background: mode === 'modern' ? '#f6ead0' : '#f4efe6',
                          borderColor: mode === 'modern' ? '#ead9b6' : '#e7decf',
                        }}
                      >
                        {skill.name}
                        {skill.proficiencyLevel ? ` · ${skill.proficiencyLevel}` : ''}
                      </Tag>
                    ))}
                  </Space>
                )}
              </div>
            ))}
          </Space>
        ) : null;
        break;
      case 'projects':
        content = projects?.length ? (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {projects.map((project) => (
              <div key={project.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 4, flexWrap: 'wrap' }}>
                  <Text strong>{project.name}</Text>
                  {project.startDate && <Text type="secondary" style={{ fontSize: 12 }}>{formatDateRange(project.startDate, project.endDate, false)}</Text>}
                </div>
                {project.technologies && (
                  <div style={{ marginBottom: 4 }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {t('resume.preview.techPrefix')}: {project.technologies}
                    </Text>
                  </div>
                )}
                {project.description && <SafeHtmlRenderer content={project.description} style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }} />}
                {(project.url || project.githubUrl) && (
                  <div style={{ marginTop: 6, fontSize: 12 }}>
                    {project.url && <a href={project.url} target="_blank" rel="noopener noreferrer" style={{ marginRight: 12 }}><LinkOutlined /> {t('resume.projects.urlText')}</a>}
                    {project.githubUrl && <a href={project.githubUrl} target="_blank" rel="noopener noreferrer"><LinkOutlined /> GitHub</a>}
                  </div>
                )}
              </div>
            ))}
          </Space>
        ) : null;
        break;
      case 'certifications':
        content = certifications?.length ? (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {certifications.map((item) => (
              <div key={item.id}>
                <Text strong>{item.name}</Text>
                <div style={{ color: '#666', marginTop: 4 }}>{[item.issuingOrganization, item.credentialId].filter(Boolean).join(' · ')}</div>
                {(item.issueDate || item.expiryDate) && <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>{formatDate(item.issueDate)} - {item.expiryDate ? formatDate(item.expiryDate) : '长期有效'}</div>}
              </div>
            ))}
          </Space>
        ) : null;
        break;
      case 'languages':
        content = languages?.length ? (
          mode === 'minimal' ? (
            <Text type="secondary" style={{ fontSize: 13 }}>{languages.map((item) => `${item.language}${item.proficiency ? ` · ${item.proficiency}` : ''}`).join(' / ')}</Text>
          ) : (
            <Space wrap size={[8, 8]}>
              {languages.map((item) => <Tag key={item.id}>{item.language}{item.proficiency ? ` · ${item.proficiency}` : ''}</Tag>)}
            </Space>
          )
        ) : null;
        break;
      case 'awards':
        content = awards?.length ? (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {awards.map((item) => (
              <div key={item.id}>
                <Text strong>{item.title}</Text>
                <div style={{ color: '#666', marginTop: 4 }}>{[item.issuer, formatDate(item.issueDate)].filter(Boolean).join(' · ')}</div>
                {item.description && <SafeHtmlRenderer content={item.description} style={{ marginTop: 8, fontSize: 13, lineHeight: 1.6, color: '#555' }} />}
              </div>
            ))}
          </Space>
        ) : null;
        break;
      case 'customSections':
        content = customSections?.length ? (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            {customSections.map((item) => (
              <div key={item.id}>
                <Text strong>{item.title}</Text>
                {item.content && <SafeHtmlRenderer content={item.content} style={{ marginTop: 8, fontSize: 13, lineHeight: 1.6, color: '#555' }} />}
              </div>
            ))}
          </Space>
        ) : null;
        break;
      default:
        content = null;
    }

    if (!content) return null;

    return (
      <div key={key} style={{ marginBottom: mode === 'minimal' ? 24 : 28 }}>
        {sectionTitle}
        {content}
      </div>
    );
  };

  const renderHeader = (mode: 'modern' | 'classic' | 'minimal') => (
    <div style={{ textAlign: mode === 'minimal' ? 'left' : 'center', marginBottom: mode === 'modern' ? 28 : 24 }}>
      {personalInfo?.showAvatar && (
        <div style={{ marginBottom: 16 }}>
          <Avatar
            size={mode === 'minimal' ? 72 : 88}
            src={personalInfo.avatarUrl}
            icon={<UserOutlined />}
            style={mode === 'modern' ? { border: '3px solid rgba(255,255,255,0.4)' } : undefined}
          />
        </div>
      )}
      <Title
        level={mode === 'minimal' ? 2 : 3}
        style={{
          marginBottom: 8,
          color: mode === 'modern' ? '#fffaf2' : mode === 'classic' ? '#4a3822' : '#2a2218',
          letterSpacing: mode === 'minimal' ? 0.6 : 0,
        }}
      >
        {personalInfo?.fullName || t('resume.preview.noName')}
      </Title>
      {(resume.versionLabel || resume.targetRole) && (
        <div style={{ marginBottom: 12 }}>
          {resume.versionLabel && <Tag color="gold">{resume.versionLabel}</Tag>}
          {resume.targetRole && <Tag color="warning">{resume.targetRole}</Tag>}
        </div>
      )}
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        {personalInfo?.email && <Text style={{ color: mode === 'modern' ? 'rgba(255,255,255,0.84)' : undefined }}><MailOutlined /> {personalInfo.email}</Text>}
        {personalInfo?.phone && <Text style={{ color: mode === 'modern' ? 'rgba(255,255,255,0.84)' : undefined }}><PhoneOutlined /> {personalInfo.phone}</Text>}
        {personalInfo?.location && <Text style={{ color: mode === 'modern' ? 'rgba(255,255,255,0.84)' : undefined }}><EnvironmentOutlined /> {personalInfo.location}</Text>}
        {personalInfo?.website && <Text style={{ fontSize: 12, color: mode === 'modern' ? 'rgba(255,255,255,0.84)' : undefined }}><LinkOutlined /> {personalInfo.website}</Text>}
        {personalInfo?.github && <Text style={{ fontSize: 12, color: mode === 'modern' ? 'rgba(255,255,255,0.84)' : undefined }}>GitHub: {personalInfo.github}</Text>}
      </Space>
    </div>
  );

  const visibleSections = normalizeSections(resume);
  const sidebarKeys = new Set(['skills', 'languages', 'certifications']);

  const renderClassic = () => (
    <Card bordered={false} style={{ background: '#ffffff', borderRadius: 20, boxShadow: '0 12px 32px rgba(15, 23, 42, 0.06)' }}>
      {renderHeader('classic')}
      {visibleSections.map((section) => renderSection(section.key, 'classic'))}
    </Card>
  );

  const renderModern = () => {
    const sidebarSections = visibleSections.filter((section) => sidebarKeys.has(section.key));
    const mainSections = visibleSections.filter((section) => !sidebarKeys.has(section.key));

    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1.02fr 1.45fr', borderRadius: 24, overflow: 'hidden', boxShadow: '0 20px 44px rgba(141, 102, 48, 0.14)' }}>
        <div style={{ background: 'linear-gradient(180deg, #8d6630 0%, #b88a47 100%)', padding: 24, color: '#fff' }}>
          {renderHeader('modern')}
          {sidebarSections.map((section) => (
            <div key={section.key} style={{ marginTop: 22 }}>
              {renderSection(section.key, 'modern')}
            </div>
          ))}
        </div>
        <div style={{ background: '#ffffff', padding: 26 }}>
          {mainSections.map((section) => renderSection(section.key, 'modern'))}
        </div>
      </div>
    );
  };

  const renderMinimal = () => (
    <Card bordered={false} style={{ background: '#ffffff', borderRadius: 10, boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)' }}>
      <div style={{ paddingBottom: 20, borderBottom: '1px solid #e5e7eb', marginBottom: 24 }}>
        {renderHeader('minimal')}
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        {visibleSections.map((section, index) => (
          <div key={section.key}>
            {renderSection(section.key, 'minimal')}
            {index !== visibleSections.length - 1 && <Divider style={{ margin: '0 0 18px', borderColor: '#eceff3' }} />}
          </div>
        ))}
      </div>
    </Card>
  );

  return (
    <div
      id="resume-preview"
      style={{
        padding: 24,
        background:
          resume.templateId === TEMPLATES.MODERN
            ? 'linear-gradient(180deg, #faf4e7 0%, #fffaf2 100%)'
            : resume.templateId === TEMPLATES.MINIMAL
              ? '#f8f5ef'
              : '#f7f1e7',
      }}
    >
      {resume.templateId === TEMPLATES.MODERN && renderModern()}
      {resume.templateId === TEMPLATES.CLASSIC && renderClassic()}
      {resume.templateId === TEMPLATES.MINIMAL && renderMinimal()}
    </div>
  );
};

export default ResumePreview;
