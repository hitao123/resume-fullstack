import type { RoleTemplate } from '@/data/roleTemplates';
import { buildSectionConfig, getRoleContent } from '@/data/roleTemplates';
import resumeService from '@/services/resumeService';
import { useResumeStore } from '@/store/resumeStore';
import type { Resume } from '@/types/resume.types';

const PREVIEW_TIMESTAMP = '2026-01-15T00:00:00.000Z';

function withEntryIds<T extends object>(items: T[], resumeId = 0): Array<T & { id: number; resumeId: number }> {
  return items.map((item, index) => ({ ...item, id: index + 1, resumeId }));
}

export function buildPreviewResume(template: RoleTemplate, language?: string): Resume {
  const content = getRoleContent(template, language);
  return {
    id: 0,
    userId: 0,
    title: content.resumeTitle,
    templateId: template.templateId,
    themeColor: template.themeColor,
    layoutDensity: template.layoutDensity,
    targetRole: content.targetRole,
    sectionConfig: buildSectionConfig(template),
    isDefault: false,
    createdAt: PREVIEW_TIMESTAMP,
    updatedAt: PREVIEW_TIMESTAMP,
    personalInfo: { id: 1, resumeId: 0, ...content.personalInfo },
    workExperiences: withEntryIds(content.workExperiences),
    education: withEntryIds(content.education),
    skills: withEntryIds(content.skills),
    projects: withEntryIds(content.projects),
    certifications: withEntryIds(content.certifications),
    languages: withEntryIds(content.languages),
    awards: withEntryIds(content.awards),
    customSections: withEntryIds(content.customSections),
  };
}

export async function createResumeFromRoleTemplate(
  template: RoleTemplate,
  language?: string,
): Promise<{ resume: Resume; partial: boolean }> {
  const content = getRoleContent(template, language);
  const resume = await resumeService.createResume({
    title: content.resumeTitle,
    templateId: template.templateId,
    targetRole: content.targetRole,
  });

  let partial = false;
  try {
    await resumeService.updateResume(resume.id, {
      themeColor: template.themeColor,
      layoutDensity: template.layoutDensity,
      sectionConfig: buildSectionConfig(template),
    });
    await resumeService.updatePersonalInfo(resume.id, content.personalInfo);
    for (const item of content.workExperiences) {
      await resumeService.createWorkExperience(resume.id, item);
    }
    for (const item of content.education) {
      await resumeService.createEducation(resume.id, item);
    }
    for (const item of content.projects) {
      await resumeService.createProject(resume.id, item);
    }
    for (const item of content.certifications) {
      await resumeService.createCertification(resume.id, item);
    }
    for (const item of content.languages) {
      await resumeService.createLanguage(resume.id, item);
    }
    for (const item of content.awards) {
      await resumeService.createAward(resume.id, item);
    }
    for (const item of content.customSections) {
      await resumeService.createCustomSection(resume.id, item);
    }
    await resumeService.bulkUpdateSkills(resume.id, content.skills);
  } catch (error) {
    console.error('Failed to import role template content', error);
    partial = true;
  }

  void useResumeStore.getState().fetchResumes().catch(() => undefined);
  return { resume, partial };
}
