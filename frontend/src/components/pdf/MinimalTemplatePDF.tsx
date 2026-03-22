import { Document, Font, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import type { Resume } from '@/types/resume.types';
import { htmlToPdfNodes } from '@/utils/htmlToPdfNodes';

Font.register({
  family: 'Noto Serif SC',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/fontsource/fonts/noto-serif-sc@latest/chinese-simplified-400-normal.ttf', fontWeight: 'normal' },
    { src: 'https://cdn.jsdelivr.net/fontsource/fonts/noto-serif-sc@latest/chinese-simplified-700-normal.ttf', fontWeight: 'bold' },
  ],
});

const styles = StyleSheet.create({
  page: { padding: 44, fontFamily: 'Noto Serif SC', fontSize: 10, color: '#202020' },
  header: { marginBottom: 20 },
  name: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  meta: { fontSize: 10, color: '#666', marginBottom: 4 },
  section: { marginTop: 18 },
  title: { fontSize: 11, textTransform: 'uppercase', color: '#777', marginBottom: 8 },
  item: { marginBottom: 12 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  itemTitle: { fontSize: 11, fontWeight: 'bold' },
  itemMeta: { fontSize: 9, color: '#777' },
  itemText: { fontSize: 9, lineHeight: 1.7, color: '#444' },
});

const formatDate = (dateStr?: string | null) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}`;
};

const MinimalTemplatePDF = ({ resume }: { resume: Resume }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.name}>{resume.personalInfo?.fullName || '未填写姓名'}</Text>
        <Text style={styles.meta}>
          {[resume.personalInfo?.email, resume.personalInfo?.phone, resume.personalInfo?.location].filter(Boolean).join(' · ')}
        </Text>
        {resume.personalInfo?.summary && htmlToPdfNodes(resume.personalInfo.summary, { baseStyle: styles.itemText })}
      </View>
      {resume.workExperiences?.length ? (
        <View style={styles.section}>
          <Text style={styles.title}>Experience</Text>
          {resume.workExperiences.map((item) => (
            <View key={item.id} style={styles.item}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemTitle}>{item.position}</Text>
                <Text style={styles.itemMeta}>{formatDate(item.startDate)} - {item.isCurrent ? '至今' : formatDate(item.endDate)}</Text>
              </View>
              <Text style={styles.itemMeta}>{item.companyName}</Text>
              {item.description && htmlToPdfNodes(item.description, { baseStyle: styles.itemText })}
            </View>
          ))}
        </View>
      ) : null}
      {resume.education?.length ? (
        <View style={styles.section}>
          <Text style={styles.title}>Education</Text>
          {resume.education.map((item) => (
            <View key={item.id} style={styles.item}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemTitle}>{item.institution}</Text>
                <Text style={styles.itemMeta}>{formatDate(item.startDate)} - {formatDate(item.endDate)}</Text>
              </View>
              <Text style={styles.itemMeta}>{[item.degree, item.fieldOfStudy].filter(Boolean).join(' · ')}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {resume.skills?.length ? (
        <View style={styles.section}>
          <Text style={styles.title}>Skills</Text>
          <Text style={styles.itemText}>{resume.skills.map((item) => item.name).join(' · ')}</Text>
        </View>
      ) : null}
    </Page>
  </Document>
);

export default MinimalTemplatePDF;
