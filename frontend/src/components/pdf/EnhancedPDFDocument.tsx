/**
 * 改进的 PDF 文档模板
 * 支持背景颜色、SVG 图片等元素
 */

import React, { useState, useEffect } from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image as PDFImage,
} from '@react-pdf/renderer';
import type { Resume } from '@/types/resume.types';
import { createColoredTagImage, getTagBackgroundColor, getTagTextColor } from '@/utils/pdfHelpers';
import { htmlToPdfNodes } from '@/utils/htmlToPdfNodes';

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

Font.registerHyphenationCallback((word) => {
  if (/[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]/.test(word)) {
    return word.split('');
  }
  return [word];
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Noto Serif SC',
    fontSize: 10,
    lineHeight: 1.8,
  },
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#1a1a1a',
    borderBottomWidth: 2,
    borderBottomColor: '#1890ff',
    paddingBottom: 4,
    lineHeight: 1.5,
  },
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
    color: '#999',
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
  skillsContainer: {
    marginBottom: 10,
  },
  skillCategory: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
    lineHeight: 1.6,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 10,
  },
  skillTag: {
    marginRight: 4,
    marginBottom: 4,
  },
});

interface EnhancedPDFDocumentProps {
  resume: Resume;
}

/**
 * 技能标签组件（使用预渲染的图片）
 */
const SkillTagImage: React.FC<{ skill: string; colorType: string }> = ({ skill, colorType }) => {
  const [imageData, setImageData] = useState<string>('');

  useEffect(() => {
    const bgColor = getTagBackgroundColor(colorType);
    const textColor = getTagTextColor(colorType);
    const data = createColoredTagImage(skill, bgColor, textColor, 90, 22);
    setImageData(data);
  }, [skill, colorType]);

  if (!imageData) return null;

  return (
    <PDFImage
      src={imageData}
      style={{
        width: 90,
        height: 22,
        marginRight: 4,
        marginBottom: 4,
      }}
    />
  );
};

/**
 * 增强型 PDF 文档
 * 支持背景颜色的标签、图片等
 */
export const EnhancedPDFDocument: React.FC<EnhancedPDFDocumentProps> = ({ resume }) => {
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

        {personalInfo?.summary && htmlToPdfNodes(personalInfo.summary, { baseStyle: styles.summary })}

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
                {work.description && htmlToPdfNodes(work.description, { baseStyle: styles.itemDescription })}
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
                {edu.description && htmlToPdfNodes(edu.description, { baseStyle: styles.itemDescription })}
              </View>
            ))}
          </View>
        )}

        {/* 专业技能（带背景色） */}
        {skills && skills.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>专业技能</Text>
            {Object.entries(groupedSkills).map(([category, categorySkills]) => (
              <View key={category} style={styles.skillsContainer}>
                <Text style={styles.skillCategory}>{category}</Text>
                <View style={styles.skillsRow}>
                  {(categorySkills || []).map((skill) => (
                    <View key={skill.id} style={styles.skillTag}>
                      <SkillTagImage skill={skill.name} colorType="blue" />
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
};

export default EnhancedPDFDocument;
