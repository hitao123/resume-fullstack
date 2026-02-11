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

// 注册中文字体
Font.register({
  family: 'Noto Serif SC',
  fonts: [
    {
      src: 'https://cdn.jsdelivr.net/fontsource/fonts/noto-serif-sc@latest/chinese-simplified-400-normal.ttf',
      fontWeight: 'normal',
    },
    {
      src: 'https://cdn.jsdelivr.net/fontsource/fonts/noto-serif-sc@latest/chinese-simplified-700-normal.ttf',
      fontWeight: 'bold',
    },
  ],
});

// 注册自定义断字回调，支持中文字符逐字换行
Font.registerHyphenationCallback((word) => {
  // 如果单词中包含中文字符，则逐字符拆分以支持换行
  if (/[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/.test(word)) {
    return word.split('');
  }
  return [word];
});

// 定义样式
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Noto Serif SC',
    fontSize: 10,
    lineHeight: 1.8,
  },
  // 个人信息
  header: {
    marginBottom: 20,
    textAlign: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1a1a1a',
    lineHeight: 1.5,
  },
  contactInfo: {
    fontSize: 9,
    color: '#666',
    marginBottom: 5,
    lineHeight: 1.6,
  },
  summary: {
    fontSize: 10,
    color: '#444',
    marginTop: 10,
    lineHeight: 1.8,
    textAlign: 'left',
    paddingHorizontal: 40,
    width: '100%',
    maxWidth: '100%',
  },
  // 区块标题
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#1a1a1a',
    borderBottom: '2pt solid #1890ff',
    paddingBottom: 4,
    lineHeight: 1.5,
  },
  // 工作经历/教育背景
  item: {
    marginBottom: 16,
    width: '100%',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  itemTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1a1a1a',
    lineHeight: 1.6,
  },
  itemDate: {
    fontSize: 9,
    color: '#666',
    lineHeight: 1.6,
  },
  itemSubtitle: {
    fontSize: 10,
    color: '#444',
    marginBottom: 6,
    lineHeight: 1.6,
  },
  itemDescription: {
    fontSize: 9,
    color: '#555',
    lineHeight: 1.8,
    marginTop: 4,
    width: '100%',
    maxWidth: '100%',
  },
  // 技能
  skillsContainer: {
    marginBottom: 10,
  },
  skillCategory: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 6,
    lineHeight: 1.6,
  },
  skillsList: {
    fontSize: 9,
    color: '#444',
    marginBottom: 10,
    lineHeight: 1.8,
  },
});

interface PDFDocumentProps {
  resume: Resume;
}

export const PDFDocument: React.FC<PDFDocumentProps> = ({ resume }) => {
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
    <Document>
      <Page size="A4" style={styles.page}>
        {/* 个人信息 */}
        <View style={styles.header}>
          <Text style={styles.name}>{personalInfo?.fullName || '未填写姓名'}</Text>

          {personalInfo?.email && (
            <Text style={styles.contactInfo}>{personalInfo.email}</Text>
          )}

          {personalInfo?.phone && (
            <Text style={styles.contactInfo}>{personalInfo.phone}</Text>
          )}

          {personalInfo?.location && (
            <Text style={styles.contactInfo}>{personalInfo.location}</Text>
          )}

          {(personalInfo?.website || personalInfo?.github || personalInfo?.linkedin) && (
            <Text style={styles.contactInfo}>
              {[personalInfo?.website, personalInfo?.github, personalInfo?.linkedin]
                .filter(Boolean)
                .join(' | ')}
            </Text>
          )}
        </View>

        {personalInfo?.summary && (
          <Text style={styles.summary}>{personalInfo.summary}</Text>
        )}

        {/* 工作经历 */}
        {workExperiences && workExperiences.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>工作经历</Text>
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
          <View>
            <Text style={styles.sectionTitle}>教育背景</Text>
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

        {/* 专业技能 */}
        {skills && skills.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>专业技能</Text>
            {Object.entries(groupedSkills).map(([category, categorySkills]) => (
              <View key={category} style={styles.skillsContainer}>
                <Text style={styles.skillCategory}>{category}:</Text>
                <Text style={styles.skillsList}>
                  {(categorySkills || [])
                    .map(
                      (skill) =>
                        `${skill.name}${skill.proficiencyLevel ? ` (${skill.proficiencyLevel})` : ''}`
                    )
                    .join(' · ')}
                </Text>
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
};

export default PDFDocument;