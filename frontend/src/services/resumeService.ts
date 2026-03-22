import api from './api';
import type {
  Resume,
  PersonalInfo,
  WorkExperience,
  Education,
  Skill,
  Project,
  Certification,
  Language,
  Award,
  CustomSection,
  CreateResumeRequest,
  UpdateResumeRequest,
  ReorderRequest,
  PersonalInfoInput,
  WorkExperienceInput,
  EducationInput,
  SkillInput,
  CertificationInput,
  LanguageInput,
  AwardInput,
  CustomSectionInput,
} from '@/types/resume.types';
import type { ApiResponse } from '@/types/api.types';

export const resumeService = {
  // Resume CRUD
  async getResumes(): Promise<Resume[]> {
    const response = await api.post<ApiResponse<Resume[]>>('/resumes/list');
    return response.data.data;
  },

  async getResume(id: number): Promise<Resume> {
    const response = await api.post<ApiResponse<Resume>>('/resumes/get', { id });
    return response.data.data;
  },

  async createResume(data: CreateResumeRequest): Promise<Resume> {
    const response = await api.post<ApiResponse<Resume>>('/resumes', data);
    return response.data.data;
  },

  async updateResume(id: number, data: UpdateResumeRequest): Promise<Resume> {
    const response = await api.post<ApiResponse<Resume>>('/resumes/update', { id, ...data });
    return response.data.data;
  },

  async deleteResume(id: number): Promise<void> {
    await api.delete(`/resumes/${id}`);
  },

  async duplicateResume(id: number): Promise<Resume> {
    const response = await api.post<ApiResponse<Resume>>(`/resumes/${id}/duplicate`);
    return response.data.data;
  },

  // Personal Info
  async getPersonalInfo(resumeId: number): Promise<PersonalInfo> {
    const response = await api.post<ApiResponse<PersonalInfo>>('/resumes/personal-info/get', { resumeId });
    return response.data.data;
  },

  async updatePersonalInfo(resumeId: number, data: PersonalInfoInput): Promise<PersonalInfo> {
    const response = await api.post<ApiResponse<PersonalInfo>>('/resumes/personal-info/update', { resumeId, ...data });
    return response.data.data;
  },

  // Work Experience
  async getWorkExperiences(resumeId: number): Promise<WorkExperience[]> {
    const response = await api.post<ApiResponse<WorkExperience[]>>('/resumes/work-experiences/list', { resumeId });
    return response.data.data;
  },

  async getWorkExperience(resumeId: number, id: number): Promise<WorkExperience> {
    const response = await api.post<ApiResponse<WorkExperience>>('/resumes/work-experiences/get', { resumeId, id });
    return response.data.data;
  },

  async createWorkExperience(resumeId: number, data: WorkExperienceInput): Promise<WorkExperience> {
    const response = await api.post<ApiResponse<WorkExperience>>('/resumes/work-experiences', { resumeId, ...data });
    return response.data.data;
  },

  async updateWorkExperience(resumeId: number, id: number, data: Partial<WorkExperienceInput>): Promise<WorkExperience> {
    const response = await api.post<ApiResponse<WorkExperience>>('/resumes/work-experiences/update', { resumeId, id, ...data });
    return response.data.data;
  },

  async deleteWorkExperience(resumeId: number, id: number): Promise<void> {
    await api.delete(`/resumes/work-experiences/${id}`, { data: { resumeId } });
  },

  async reorderWorkExperiences(resumeId: number, data: ReorderRequest): Promise<void> {
    await api.post('/resumes/work-experiences/reorder', { resumeId, ...data });
  },

  // Education
  async getEducation(resumeId: number): Promise<Education[]> {
    const response = await api.post<ApiResponse<Education[]>>('/resumes/education/list', { resumeId });
    return response.data.data;
  },

  async createEducation(resumeId: number, data: EducationInput): Promise<Education> {
    const response = await api.post<ApiResponse<Education>>('/resumes/education', { resumeId, ...data });
    return response.data.data;
  },

  async updateEducation(resumeId: number, id: number, data: Partial<EducationInput>): Promise<Education> {
    const response = await api.post<ApiResponse<Education>>('/resumes/education/update', { resumeId, id, ...data });
    return response.data.data;
  },

  async deleteEducation(resumeId: number, id: number): Promise<void> {
    await api.delete(`/resumes/education/${id}`, { data: { resumeId } });
  },

  async reorderEducation(resumeId: number, data: ReorderRequest): Promise<void> {
    await api.post('/resumes/education/reorder', { resumeId, ...data });
  },

  // Skills
  async getSkills(resumeId: number): Promise<Skill[]> {
    const response = await api.post<ApiResponse<Skill[]>>('/resumes/skills/list', { resumeId });
    return response.data.data;
  },

  async createSkill(resumeId: number, data: SkillInput): Promise<Skill> {
    const response = await api.post<ApiResponse<Skill>>('/resumes/skills', { resumeId, ...data });
    return response.data.data;
  },

  async updateSkill(resumeId: number, id: number, data: Partial<SkillInput>): Promise<Skill> {
    const response = await api.post<ApiResponse<Skill>>('/resumes/skills/update', { resumeId, id, ...data });
    return response.data.data;
  },

  async deleteSkill(resumeId: number, id: number): Promise<void> {
    await api.delete(`/resumes/skills/${id}`, { data: { resumeId } });
  },

  async bulkUpdateSkills(resumeId: number, skills: Skill[]): Promise<Skill[]> {
    const response = await api.post<ApiResponse<Skill[]>>('/resumes/skills/bulk', { resumeId, skills });
    return response.data.data;
  },

  // Projects (optional for Phase 2)
  async getProjects(resumeId: number): Promise<Project[]> {
    const response = await api.post<ApiResponse<Project[]>>('/resumes/projects/list', { resumeId });
    return response.data.data;
  },

  async createProject(resumeId: number, data: Omit<Project, 'id' | 'resumeId'>): Promise<Project> {
    const response = await api.post<ApiResponse<Project>>('/resumes/projects', { resumeId, ...data });
    return response.data.data;
  },

  async updateProject(resumeId: number, id: number, data: Partial<Omit<Project, 'id' | 'resumeId'>>): Promise<Project> {
    const response = await api.post<ApiResponse<Project>>('/resumes/projects/update', { resumeId, id, ...data });
    return response.data.data;
  },

  async deleteProject(resumeId: number, id: number): Promise<void> {
    await api.delete(`/resumes/projects/${id}`, { data: { resumeId } });
  },

  // Certifications
  async getCertifications(resumeId: number): Promise<Certification[]> {
    const response = await api.post<ApiResponse<Certification[]>>('/resumes/certifications/list', { resumeId });
    return response.data.data;
  },

  async createCertification(resumeId: number, data: CertificationInput): Promise<Certification> {
    const response = await api.post<ApiResponse<Certification>>('/resumes/certifications', { resumeId, ...data });
    return response.data.data;
  },

  async updateCertification(resumeId: number, id: number, data: Partial<CertificationInput>): Promise<Certification> {
    const response = await api.post<ApiResponse<Certification>>('/resumes/certifications/update', { resumeId, id, ...data });
    return response.data.data;
  },

  async deleteCertification(resumeId: number, id: number): Promise<void> {
    await api.delete(`/resumes/certifications/${id}`, { data: { resumeId } });
  },

  // Languages
  async getLanguages(resumeId: number): Promise<Language[]> {
    const response = await api.post<ApiResponse<Language[]>>('/resumes/languages/list', { resumeId });
    return response.data.data;
  },

  async createLanguage(resumeId: number, data: LanguageInput): Promise<Language> {
    const response = await api.post<ApiResponse<Language>>('/resumes/languages', { resumeId, ...data });
    return response.data.data;
  },

  async updateLanguage(resumeId: number, id: number, data: Partial<LanguageInput>): Promise<Language> {
    const response = await api.post<ApiResponse<Language>>('/resumes/languages/update', { resumeId, id, ...data });
    return response.data.data;
  },

  async deleteLanguage(resumeId: number, id: number): Promise<void> {
    await api.delete(`/resumes/languages/${id}`, { data: { resumeId } });
  },

  // Awards
  async getAwards(resumeId: number): Promise<Award[]> {
    const response = await api.post<ApiResponse<Award[]>>('/resumes/awards/list', { resumeId });
    return response.data.data;
  },

  async createAward(resumeId: number, data: AwardInput): Promise<Award> {
    const response = await api.post<ApiResponse<Award>>('/resumes/awards', { resumeId, ...data });
    return response.data.data;
  },

  async updateAward(resumeId: number, id: number, data: Partial<AwardInput>): Promise<Award> {
    const response = await api.post<ApiResponse<Award>>('/resumes/awards/update', { resumeId, id, ...data });
    return response.data.data;
  },

  async deleteAward(resumeId: number, id: number): Promise<void> {
    await api.delete(`/resumes/awards/${id}`, { data: { resumeId } });
  },

  // Custom sections
  async getCustomSections(resumeId: number): Promise<CustomSection[]> {
    const response = await api.post<ApiResponse<CustomSection[]>>('/resumes/custom-sections/list', { resumeId });
    return response.data.data;
  },

  async createCustomSection(resumeId: number, data: CustomSectionInput): Promise<CustomSection> {
    const response = await api.post<ApiResponse<CustomSection>>('/resumes/custom-sections', { resumeId, ...data });
    return response.data.data;
  },

  async updateCustomSection(resumeId: number, id: number, data: Partial<CustomSectionInput>): Promise<CustomSection> {
    const response = await api.post<ApiResponse<CustomSection>>('/resumes/custom-sections/update', { resumeId, id, ...data });
    return response.data.data;
  },

  async deleteCustomSection(resumeId: number, id: number): Promise<void> {
    await api.delete(`/resumes/custom-sections/${id}`, { data: { resumeId } });
  },
};

export default resumeService;
