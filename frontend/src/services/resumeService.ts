import api from './api';
import type {
  Resume,
  PersonalInfo,
  WorkExperience,
  Education,
  Skill,
  Project,
  CreateResumeRequest,
  UpdateResumeRequest,
  ReorderRequest,
  PersonalInfoInput,
  WorkExperienceInput,
  EducationInput,
  SkillInput,
} from '@/types/resume.types';
import type { ApiResponse } from '@/types/api.types';

export const resumeService = {
  // Resume CRUD
  async getResumes(): Promise<Resume[]> {
    const response = await api.get<ApiResponse<Resume[]>>('/resumes');
    return response.data.data;
  },

  async getResume(id: number): Promise<Resume> {
    const response = await api.get<ApiResponse<Resume>>(`/resumes/${id}`);
    return response.data.data;
  },

  async createResume(data: CreateResumeRequest): Promise<Resume> {
    const response = await api.post<ApiResponse<Resume>>('/resumes', data);
    return response.data.data;
  },

  async updateResume(id: number, data: UpdateResumeRequest): Promise<Resume> {
    const response = await api.put<ApiResponse<Resume>>(`/resumes/${id}`, data);
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
    const response = await api.get<ApiResponse<PersonalInfo>>(`/resumes/${resumeId}/personal-info`);
    return response.data.data;
  },

  async updatePersonalInfo(resumeId: number, data: PersonalInfoInput): Promise<PersonalInfo> {
    const response = await api.put<ApiResponse<PersonalInfo>>(`/resumes/${resumeId}/personal-info`, data);
    return response.data.data;
  },

  // Work Experience
  async getWorkExperiences(resumeId: number): Promise<WorkExperience[]> {
    const response = await api.get<ApiResponse<WorkExperience[]>>(`/resumes/${resumeId}/work-experiences`);
    return response.data.data;
  },

  async getWorkExperience(resumeId: number, id: number): Promise<WorkExperience> {
    const response = await api.get<ApiResponse<WorkExperience>>(`/resumes/${resumeId}/work-experiences/${id}`);
    return response.data.data;
  },

  async createWorkExperience(resumeId: number, data: WorkExperienceInput): Promise<WorkExperience> {
    const response = await api.post<ApiResponse<WorkExperience>>(`/resumes/${resumeId}/work-experiences`, data);
    return response.data.data;
  },

  async updateWorkExperience(resumeId: number, id: number, data: Partial<WorkExperienceInput>): Promise<WorkExperience> {
    const response = await api.put<ApiResponse<WorkExperience>>(`/resumes/${resumeId}/work-experiences/${id}`, data);
    return response.data.data;
  },

  async deleteWorkExperience(resumeId: number, id: number): Promise<void> {
    await api.delete(`/resumes/${resumeId}/work-experiences/${id}`);
  },

  async reorderWorkExperiences(resumeId: number, data: ReorderRequest): Promise<void> {
    await api.put(`/resumes/${resumeId}/work-experiences/reorder`, data);
  },

  // Education
  async getEducation(resumeId: number): Promise<Education[]> {
    const response = await api.get<ApiResponse<Education[]>>(`/resumes/${resumeId}/education`);
    return response.data.data;
  },

  async createEducation(resumeId: number, data: EducationInput): Promise<Education> {
    const response = await api.post<ApiResponse<Education>>(`/resumes/${resumeId}/education`, data);
    return response.data.data;
  },

  async updateEducation(resumeId: number, id: number, data: Partial<EducationInput>): Promise<Education> {
    const response = await api.put<ApiResponse<Education>>(`/resumes/${resumeId}/education/${id}`, data);
    return response.data.data;
  },

  async deleteEducation(resumeId: number, id: number): Promise<void> {
    await api.delete(`/resumes/${resumeId}/education/${id}`);
  },

  async reorderEducation(resumeId: number, data: ReorderRequest): Promise<void> {
    await api.put(`/resumes/${resumeId}/education/reorder`, data);
  },

  // Skills
  async getSkills(resumeId: number): Promise<Skill[]> {
    const response = await api.get<ApiResponse<Skill[]>>(`/resumes/${resumeId}/skills`);
    return response.data.data;
  },

  async createSkill(resumeId: number, data: SkillInput): Promise<Skill> {
    const response = await api.post<ApiResponse<Skill>>(`/resumes/${resumeId}/skills`, data);
    return response.data.data;
  },

  async updateSkill(resumeId: number, id: number, data: Partial<SkillInput>): Promise<Skill> {
    const response = await api.put<ApiResponse<Skill>>(`/resumes/${resumeId}/skills/${id}`, data);
    return response.data.data;
  },

  async deleteSkill(resumeId: number, id: number): Promise<void> {
    await api.delete(`/resumes/${resumeId}/skills/${id}`);
  },

  async bulkUpdateSkills(resumeId: number, skills: Skill[]): Promise<Skill[]> {
    const response = await api.put<ApiResponse<Skill[]>>(`/resumes/${resumeId}/skills/bulk`, { skills });
    return response.data.data;
  },

  // Projects (optional for Phase 2)
  async getProjects(resumeId: number): Promise<Project[]> {
    const response = await api.get<ApiResponse<Project[]>>(`/resumes/${resumeId}/projects`);
    return response.data.data;
  },

  async createProject(resumeId: number, data: Omit<Project, 'id' | 'resumeId'>): Promise<Project> {
    const response = await api.post<ApiResponse<Project>>(`/resumes/${resumeId}/projects`, data);
    return response.data.data;
  },

  async updateProject(resumeId: number, id: number, data: Partial<Omit<Project, 'id' | 'resumeId'>>): Promise<Project> {
    const response = await api.put<ApiResponse<Project>>(`/resumes/${resumeId}/projects/${id}`, data);
    return response.data.data;
  },

  async deleteProject(resumeId: number, id: number): Promise<void> {
    await api.delete(`/resumes/${resumeId}/projects/${id}`);
  },
};

export default resumeService;
