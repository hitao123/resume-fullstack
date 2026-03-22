// Resume types
export interface Resume {
  id: number;
  userId: number;
  title: string;
  templateId: number;
  versionLabel?: string;
  targetRole?: string;
  sectionConfig?: ResumeSectionConfig[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  personalInfo?: PersonalInfo;
  workExperiences?: WorkExperience[];
  education?: Education[];
  skills?: Skill[];
  projects?: Project[];
  certifications?: Certification[];
  languages?: Language[];
  awards?: Award[];
  customSections?: CustomSection[];
}

export interface PersonalInfo {
  id: number;
  resumeId: number;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  website?: string;
  linkedin?: string;
  github?: string;
  avatarUrl?: string;
  showAvatar?: boolean;
  summary?: string;
}

export interface ResumeSectionConfig {
  key: string;
  visible: boolean;
  order: number;
}

export interface WorkExperience {
  id: number;
  resumeId: number;
  companyName: string;
  position: string;
  location?: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  description?: string;
  displayOrder: number;
}

export interface Education {
  id: number;
  resumeId: number;
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  location?: string;
  startDate: string;
  endDate?: string;
  gpa?: string;
  description?: string;
  displayOrder: number;
}

export interface Skill {
  id: number;
  resumeId: number;
  category?: string;
  name: string;
  proficiencyLevel?: string;
  displayOrder: number;
}

export interface Project {
  id: number;
  resumeId: number;
  name: string;
  description?: string;
  technologies?: string;
  url?: string;
  githubUrl?: string;
  startDate?: string;
  endDate?: string;
  displayOrder: number;
}

export interface Certification {
  id: number;
  resumeId: number;
  name: string;
  issuingOrganization?: string;
  issueDate?: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
  displayOrder: number;
}

export interface Language {
  id: number;
  resumeId: number;
  language: string;
  proficiency?: string;
  displayOrder: number;
}

export interface Award {
  id: number;
  resumeId: number;
  title: string;
  issuer?: string;
  issueDate?: string;
  description?: string;
  displayOrder: number;
}

export interface CustomSection {
  id: number;
  resumeId: number;
  title: string;
  content?: string;
  displayOrder: number;
}

// Request/Response types
export interface CreateResumeRequest {
  title: string;
  templateId?: number;
  versionLabel?: string;
  targetRole?: string;
}

export interface UpdateResumeRequest {
  title?: string;
  templateId?: number;
  versionLabel?: string;
  targetRole?: string;
  sectionConfig?: ResumeSectionConfig[];
  isDefault?: boolean;
}

export interface ReorderRequest {
  items: Array<{ id: number; displayOrder: number }>;
}

// Form types (for creating/updating without ID)
export type PersonalInfoInput = Omit<PersonalInfo, 'id' | 'resumeId'>;
export type WorkExperienceInput = Omit<WorkExperience, 'id' | 'resumeId'>;
export type EducationInput = Omit<Education, 'id' | 'resumeId'>;
export type SkillInput = Omit<Skill, 'id' | 'resumeId'>;
export type ProjectInput = Omit<Project, 'id' | 'resumeId'>;
export type CertificationInput = Omit<Certification, 'id' | 'resumeId'>;
export type LanguageInput = Omit<Language, 'id' | 'resumeId'>;
export type AwardInput = Omit<Award, 'id' | 'resumeId'>;
export type CustomSectionInput = Omit<CustomSection, 'id' | 'resumeId'>;
