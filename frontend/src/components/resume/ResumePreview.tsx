import { Card, Typography, Space, Tag, Divider } from 'antd';
import { MailOutlined, PhoneOutlined, EnvironmentOutlined, LinkOutlined } from '@ant-design/icons';
import type { Resume } from '@/types/resume.types';

const { Title, Text, Paragraph } = Typography;

interface ResumePreviewProps {
  resume: Resume;
}

export const ResumePreview = ({ resume }: ResumePreviewProps) => {
  const { personalInfo, workExperiences, education, skills } = resume;

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getFullYear()}年${date.getMonth() + 1}月`;
  };

  const formatDateRange = (
    start?: string,
    end?: string | null,
    isCurrent?: boolean
  ) => {
    return `${formatDate(start)} - ${isCurrent || !end ? '至今' : formatDate(end)}`;
  };

  // 按类别分组技能
  const groupedSkills = (skills || []).reduce((acc, skill) => {
    const category = skill.category || '其他';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(skill);
    return acc;
  }, {} as Record<string, typeof skills>);

  return (
    <div style={{ padding: 24, background: '#fff' }}>
      <Card bordered={false}>
        {/* 个人信息 */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={3} style={{ marginBottom: 8 }}>
            {personalInfo?.fullName || '未填写姓名'}
          </Title>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            {personalInfo?.email && (
              <Text type="secondary">
                <MailOutlined /> {personalInfo.email}
              </Text>
            )}
            {personalInfo?.phone && (
              <Text type="secondary">
                <PhoneOutlined /> {personalInfo.phone}
              </Text>
            )}
            {personalInfo?.location && (
              <Text type="secondary">
                <EnvironmentOutlined /> {personalInfo.location}
              </Text>
            )}
            {personalInfo?.website && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                <LinkOutlined /> {personalInfo.website}
              </Text>
            )}
            {personalInfo?.github && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                GitHub: {personalInfo.github}
              </Text>
            )}
          </Space>
          {personalInfo?.summary && (
            <Paragraph
              style={{
                marginTop: 12,
                textAlign: 'left',
                fontSize: 13,
                lineHeight: 1.6,
              }}
            >
              {personalInfo.summary}
            </Paragraph>
          )}
        </div>

        {/* 工作经历 */}
        {workExperiences && workExperiences.length > 0 && (
          <>
            <Divider orientation="left">
              <Title level={5}>工作经历</Title>
            </Divider>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {workExperiences.map((work) => (
                <div key={work.id}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: 4,
                    }}
                  >
                    <Text strong>{work.position}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {formatDateRange(work.startDate, work.endDate, work.isCurrent)}
                    </Text>
                  </div>
                  <div style={{ marginBottom: 4 }}>
                    <Text>{work.companyName}</Text>
                    {work.location && (
                      <Text type="secondary"> · {work.location}</Text>
                    )}
                  </div>
                  {work.description && (
                    <Paragraph
                      style={{
                        fontSize: 13,
                        color: '#666',
                        lineHeight: 1.6,
                        marginTop: 8,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {work.description}
                    </Paragraph>
                  )}
                </div>
              ))}
            </Space>
          </>
        )}

        {/* 教育背景 */}
        {education && education.length > 0 && (
          <>
            <Divider orientation="left">
              <Title level={5}>教育背景</Title>
            </Divider>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {education.map((edu) => (
                <div key={edu.id}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: 4,
                    }}
                  >
                    <Text strong>{edu.institution}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {formatDateRange(edu.startDate, edu.endDate, false)}
                    </Text>
                  </div>
                  <div>
                    <Text>{edu.degree}</Text>
                    {edu.fieldOfStudy && <Text> · {edu.fieldOfStudy}</Text>}
                  </div>
                  {edu.gpa && (
                    <div style={{ marginTop: 4 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        GPA: {edu.gpa}
                      </Text>
                    </div>
                  )}
                  {edu.description && (
                    <Paragraph
                      style={{
                        fontSize: 13,
                        color: '#666',
                        lineHeight: 1.6,
                        marginTop: 8,
                      }}
                    >
                      {edu.description}
                    </Paragraph>
                  )}
                </div>
              ))}
            </Space>
          </>
        )}

        {/* 专业技能 */}
        {skills && skills.length > 0 && (
          <>
            <Divider orientation="left">
              <Title level={5}>专业技能</Title>
            </Divider>
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              {Object.entries(groupedSkills).map(([category, categorySkills]) => (
                <div key={category}>
                  <Text strong style={{ fontSize: 13, marginRight: 8 }}>
                    {category}:
                  </Text>
                  <Space size={[4, 4]} wrap>
                    {(categorySkills || []).map((skill) => (
                      <Tag key={skill.id} style={{ fontSize: 12 }}>
                        {skill.name}
                        {skill.proficiencyLevel && ` · ${skill.proficiencyLevel}`}
                      </Tag>
                    ))}
                  </Space>
                </div>
              ))}
            </Space>
          </>
        )}
      </Card>
    </div>
  );
};

export default ResumePreview;