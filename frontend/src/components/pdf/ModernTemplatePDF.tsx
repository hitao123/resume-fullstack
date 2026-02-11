import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import type { Resume } from '@/types/resume.types';

// 注册本地中文字体
Font.register({
  family: 'SourceHanSans',
  fonts: [
    {
      src: '/fonts/SourceHanSansCN-Regular.otf',
      fontWeight: 'normal',
    },
    {
      src: '/fonts/SourceHanSansCN-Bold.otf',
      fontWeight: 'bold',
    },
  ],
});

// 现代风格样式
const styles = StyleSheet.create({
  page: {
    padding: 0,
    fontFamily: 'SourceHanSans',
    fontSize: 10,
  },
  // 左侧边栏
  sidebar: {
    width: '35%',
    backgroundColor: '#2c3e50',
    color: '#ecf0f1',
    padding: 30,
  },
  sidebarName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#ffffff',
    lineHeight: 1.5,
  },
  sidebarSection: {
    marginTop: 20,
  },
  sidebarTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#3498db',
    borderBottom: '1pt solid #3498db',
    paddingBottom: 4,
    lineHeight: 1.6,
  },
  sidebarText: {
    fontSize: 9,
    lineHeight: 1.8,
    marginBottom: 5,
    color: '#ecf0f1',
  },
  // 主内容区
  mainContent: {
    flex: 1,
    padding: 30,
  },
  container: {
    flexDirection: 'row',
  },
  mainSection: {
    marginBottom: 20,
  },
  mainSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#2c3e50',
    borderBottom: '2pt solid #3498db',
    paddingBottom: 4,
    lineHeight: 1.5,
  },
  item: {
    marginBottom: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  itemTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2c3e50',
    lineHeight: 1.6,
  },
  itemDate: {
    fontSize: 9,
    color: '#7f8c8d',
    lineHeight: 1.6,
  },
  itemSubtitle: {
    fontSize: 10,
    color: '#34495e',
    marginBottom: 6,
    lineHeight: 1.6,
  },
  itemDescription: {
    fontSize: 9,
    color: '#555',
    lineHeight: 1.8,
    marginTop: 4,
  },
  skillTag: {
    fontSize: 8,
    backgroundColor: '#ecf0f1',
    color: '#2c3e50',
    padding: 4,
    marginRight: 4,
    marginBottom: 4,
    borderRadius: 2,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
});

interface ModernTemplatePDFProps {
  resume: Resume;
}

export const ModernTemplatePDF: React.FC<ModernTemplatePDFProps> = ({ resume }) => {
  const { personalInfo, workExperiences, education, skills } = resume;

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}`;
  };

  const formatDateRange = (
    start?: string,
    end?: string | null,
    isCurrent?: boolean
  ) => {
    return `${formatDate(start)} - ${isCurrent || !end ? '至今' : formatDate(end)}`;
  };

  const groupedSkills = (skills || []).reduce((acc, skill) => {
    const category = skill.category || '其他';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(skill);
    return acc;
  }, {} as Record<string, typeof skills>);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.container}>
          {/* 左侧边栏 */}
          <View style={styles.sidebar}>
            <Text style={styles.sidebarName}>
              {personalInfo?.fullName || '未填写姓名'}
            </Text>

            {/* 联系方式 */}
            <View style={styles.sidebarSection}>
              <Text style={styles.sidebarTitle}>联系方式</Text>
              {personalInfo?.email && (
                <Text style={styles.sidebarText}>{personalInfo.email}</Text>
              )}
              {personalInfo?.phone && (
                <Text style={styles.sidebarText}>{personalInfo.phone}</Text>
              )}
              {personalInfo?.location && (
                <Text style={styles.sidebarText}>{personalInfo.location}</Text>
              )}
            </View>

            {/* 链接 */}
            {(personalInfo?.website || personalInfo?.github || personalInfo?.linkedin) && (
              <View style={styles.sidebarSection}>
                <Text style={styles.sidebarTitle}>在线资料</Text>
                {personalInfo?.website && (
                  <Text style={styles.sidebarText}>{personalInfo.website}</Text>
                )}
                {personalInfo?.github && (
                  <Text style={styles.sidebarText}>{personalInfo.github}</Text>
                )}
                {personalInfo?.linkedin && (
                  <Text style={styles.sidebarText}>{personalInfo.linkedin}</Text>
                )}
              </View>
            )}

            {/* 专业技能 */}
            {skills && skills.length > 0 && (
              <View style={styles.sidebarSection}>
                <Text style={styles.sidebarTitle}>专业技能</Text>
                {Object.entries(groupedSkills).map(([category, categorySkills]) => (
                  <View key={category} style={{ marginBottom: 12 }}>
                    <Text style={[styles.sidebarText, { fontWeight: 'bold', marginBottom: 4 }]}>
                      {category}
                    </Text>
                    {(categorySkills || []).map((skill) => (
                      <Text key={skill.id} style={styles.sidebarText}>
                        • {skill.name}
                        {skill.proficiencyLevel && ` (${skill.proficiencyLevel})`}
                      </Text>
                    ))}
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* 主内容区 */}
          <View style={styles.mainContent}>
            {/* 个人简介 */}
            {personalInfo?.summary && (
              <View style={styles.mainSection}>
                <Text style={styles.mainSectionTitle}>个人简介</Text>
                <Text style={styles.itemDescription}>{personalInfo.summary}</Text>
              </View>
            )}

            {/* 工作经历 */}
            {workExperiences && workExperiences.length > 0 && (
              <View style={styles.mainSection}>
                <Text style={styles.mainSectionTitle}>工作经历</Text>
                {workExperiences.map((work) => (
                  <View key={work.id} style={styles.item}>
                    <View style={styles.itemHeader}>
                      <Text style={styles.itemTitle}>{work.position}</Text>
                      <Text style={styles.itemDate}>
                        {formatDateRange(work.startDate, work.endDate, work.isCurrent)}
                      </Text>
                    </View>
                    <Text style={styles.itemSubtitle}>
                      {work.companyName}
                      {work.location && ` · ${work.location}`}
                    </Text>
                    {work.description && (
                      <Text style={styles.itemDescription}>{work.description}</Text>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* 教育背景 */}
            {education && education.length > 0 && (
              <View style={styles.mainSection}>
                <Text style={styles.mainSectionTitle}>教育背景</Text>
                {education.map((edu) => (
                  <View key={edu.id} style={styles.item}>
                    <View style={styles.itemHeader}>
                      <Text style={styles.itemTitle}>{edu.institution}</Text>
                      <Text style={styles.itemDate}>
                        {formatDateRange(edu.startDate, edu.endDate, false)}
                      </Text>
                    </View>
                    <Text style={styles.itemSubtitle}>
                      {edu.degree}
                      {edu.fieldOfStudy && ` · ${edu.fieldOfStudy}`}
                      {edu.gpa && ` · GPA: ${edu.gpa}`}
                    </Text>
                    {edu.description && (
                      <Text style={styles.itemDescription}>{edu.description}</Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default ModernTemplatePDF;