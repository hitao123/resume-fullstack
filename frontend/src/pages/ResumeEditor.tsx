import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Typography, Card, Row, Col, Divider, Tag, Space } from 'antd';
import { MailOutlined, PhoneOutlined, EnvironmentOutlined, LinkOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

// 模拟简历数据
const mockResumeData = {
  1: {
    title: '软件工程师简历',
    personalInfo: {
      fullName: '张三',
      email: 'zhangsan@example.com',
      phone: '+86 138-0000-0000',
      location: '北京市海淀区',
      website: 'https://github.com/zhangsan',
      summary: '具有5年以上全栈开发经验的软件工程师，擅长React、Node.js和云原生技术。',
    },
    workExperiences: [
      {
        id: 1,
        companyName: '某科技公司',
        position: '高级前端工程师',
        location: '北京',
        startDate: '2021-01',
        endDate: '2024-02',
        isCurrent: false,
        description: '负责公司核心产品的前端架构设计和开发，带领3人团队完成多个重要项目。',
      },
      {
        id: 2,
        companyName: '初创公司',
        position: '全栈工程师',
        location: '上海',
        startDate: '2019-06',
        endDate: '2020-12',
        isCurrent: false,
        description: '独立完成公司官网和管理后台的开发，使用React + Node.js技术栈。',
      },
    ],
    education: [
      {
        id: 1,
        institution: '清华大学',
        degree: '计算机科学学士',
        fieldOfStudy: '软件工程',
        location: '北京',
        startDate: '2015-09',
        endDate: '2019-06',
        gpa: '3.8/4.0',
      },
    ],
    skills: [
      { id: 1, category: '前端框架', name: 'React', proficiencyLevel: '精通' },
      { id: 2, category: '前端框架', name: 'Vue', proficiencyLevel: '熟练' },
      { id: 3, category: '后端技术', name: 'Node.js', proficiencyLevel: '熟练' },
      { id: 4, category: '后端技术', name: 'Go', proficiencyLevel: '了解' },
      { id: 5, category: '数据库', name: 'MySQL', proficiencyLevel: '熟练' },
      { id: 6, category: '工具', name: 'Git', proficiencyLevel: '精通' },
    ],
  },
  2: {
    title: '前端开发简历',
    personalInfo: {
      fullName: '李四',
      email: 'lisi@example.com',
      phone: '+86 139-0000-0000',
      location: '上海市浦东新区',
      summary: '专注于前端开发的工程师，对用户体验和性能优化有深入研究。',
    },
    workExperiences: [
      {
        id: 1,
        companyName: '互联网公司',
        position: '前端工程师',
        location: '上海',
        startDate: '2020-03',
        endDate: null,
        isCurrent: true,
        description: '负责公司多个产品线的前端开发工作。',
      },
    ],
    education: [
      {
        id: 1,
        institution: '复旦大学',
        degree: '软件工程学士',
        fieldOfStudy: '计算机科学',
        location: '上海',
        startDate: '2016-09',
        endDate: '2020-06',
      },
    ],
    skills: [
      { id: 1, category: '前端', name: 'React', proficiencyLevel: '精通' },
      { id: 2, category: '前端', name: 'TypeScript', proficiencyLevel: '熟练' },
      { id: 3, category: '前端', name: 'CSS', proficiencyLevel: '精通' },
    ],
  },
};

export const ResumeEditor = () => {
  const { id } = useParams<{ id: string }>();
  const [resume] = useState(mockResumeData[id as keyof typeof mockResumeData]);

  if (!resume) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Title level={3}>简历未找到</Title>
        <Text type="secondary">请返回选择其他简历</Text>
      </div>
    );
  }

  const formatDateRange = (start: string, end: string | null, isCurrent: boolean) => {
    const formatDate = (date: string) => {
      const [year, month] = date.split('-');
      return `${year}年${month}月`;
    };

    return `${formatDate(start)} - ${isCurrent || !end ? '至今' : formatDate(end)}`;
  };

  const groupedSkills = resume.skills.reduce((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = [];
    }
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<string, typeof resume.skills>);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <Card>
        {/* 个人信息 */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2} style={{ marginBottom: 8 }}>
            {resume.personalInfo.fullName}
          </Title>
          <Space size="large" wrap style={{ justifyContent: 'center' }}>
            {resume.personalInfo.email && (
              <Text>
                <MailOutlined /> {resume.personalInfo.email}
              </Text>
            )}
            {resume.personalInfo.phone && (
              <Text>
                <PhoneOutlined /> {resume.personalInfo.phone}
              </Text>
            )}
            {resume.personalInfo.location && (
              <Text>
                <EnvironmentOutlined /> {resume.personalInfo.location}
              </Text>
            )}
            {resume.personalInfo.website && (
              <Text>
                <LinkOutlined /> {resume.personalInfo.website}
              </Text>
            )}
          </Space>
          {resume.personalInfo.summary && (
            <Paragraph style={{ marginTop: 16, maxWidth: 800, margin: '16px auto 0' }}>
              {resume.personalInfo.summary}
            </Paragraph>
          )}
        </div>

        <Divider />

        {/* 工作经历 */}
        <div style={{ marginBottom: 32 }}>
          <Title level={4}>工作经历</Title>
          {resume.workExperiences.map((work) => (
            <div key={work.id} style={{ marginBottom: 24 }}>
              <Row justify="space-between" align="top">
                <Col>
                  <Title level={5} style={{ marginBottom: 4 }}>
                    {work.position}
                  </Title>
                  <Text strong>{work.companyName}</Text>
                  {work.location && <Text type="secondary"> · {work.location}</Text>}
                </Col>
                <Col>
                  <Text type="secondary">
                    {formatDateRange(work.startDate, work.endDate, work.isCurrent)}
                  </Text>
                </Col>
              </Row>
              {work.description && (
                <Paragraph style={{ marginTop: 8 }}>{work.description}</Paragraph>
              )}
            </div>
          ))}
        </div>

        <Divider />

        {/* 教育背景 */}
        <div style={{ marginBottom: 32 }}>
          <Title level={4}>教育背景</Title>
          {resume.education.map((edu) => (
            <div key={edu.id} style={{ marginBottom: 16 }}>
              <Row justify="space-between" align="top">
                <Col>
                  <Title level={5} style={{ marginBottom: 4 }}>
                    {edu.institution}
                  </Title>
                  <Text strong>{edu.degree}</Text>
                  {edu.fieldOfStudy && <Text> · {edu.fieldOfStudy}</Text>}
                  {edu.gpa && (
                    <Text type="secondary" style={{ marginLeft: 8 }}>
                      GPA: {edu.gpa}
                    </Text>
                  )}
                </Col>
                <Col>
                  <Text type="secondary">
                    {formatDateRange(edu.startDate, edu.endDate, false)}
                  </Text>
                </Col>
              </Row>
            </div>
          ))}
        </div>

        <Divider />

        {/* 技能 */}
        <div>
          <Title level={4}>专业技能</Title>
          {Object.entries(groupedSkills).map(([category, skills]) => (
            <div key={category} style={{ marginBottom: 16 }}>
              <Text strong style={{ marginRight: 12 }}>
                {category}:
              </Text>
              <Space size={[8, 8]} wrap>
                {skills.map((skill) => (
                  <Tag key={skill.id} color="blue">
                    {skill.name} {skill.proficiencyLevel && `· ${skill.proficiencyLevel}`}
                  </Tag>
                ))}
              </Space>
            </div>
          ))}
        </div>
      </Card>

      <Card style={{ marginTop: 16, textAlign: 'center', background: '#f5f5f5' }}>
        <Text type="secondary">
          这是简历预览页面。完整的编辑器功能正在开发中...
        </Text>
      </Card>
    </div>
  );
};

export default ResumeEditor;
