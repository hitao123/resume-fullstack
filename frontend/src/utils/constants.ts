// Template IDs
export const TEMPLATES = {
  MODERN: 1,
  CLASSIC: 2,
  MINIMAL: 3,
} as const;

// Template names
export const TEMPLATE_NAME_KEYS: Record<number, string> = {
  [TEMPLATES.MODERN]: 'resumeEditor.export.modernShort',
  [TEMPLATES.CLASSIC]: 'resumeEditor.export.classicShort',
  [TEMPLATES.MINIMAL]: 'resumeEditor.export.minimalShort',
};

export const TEMPLATE_OPTIONS = [
  { id: TEMPLATES.MODERN, nameKey: 'resumeEditor.export.modernShort', descriptionKey: 'settings.templateMetaModern.0' },
  { id: TEMPLATES.CLASSIC, nameKey: 'resumeEditor.export.classicShort', descriptionKey: 'settings.templateMetaClassic.0' },
  { id: TEMPLATES.MINIMAL, nameKey: 'resumeEditor.export.minimalShort', descriptionKey: 'settings.templateMetaMinimal.0' },
] as const;

export const DEFAULT_SECTION_CONFIG = [
  { key: 'summary', visible: true, order: 0 },
  { key: 'workExperiences', visible: true, order: 1 },
  { key: 'education', visible: true, order: 2 },
  { key: 'skills', visible: true, order: 3 },
  { key: 'projects', visible: true, order: 4 },
  { key: 'certifications', visible: true, order: 5 },
  { key: 'languages', visible: true, order: 6 },
  { key: 'awards', visible: true, order: 7 },
  { key: 'customSections', visible: true, order: 8 },
] as const;

// Proficiency levels for skills
export const PROFICIENCY_LEVELS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' },
] as const;

// Language proficiency levels
export const LANGUAGE_PROFICIENCY_LEVELS = [
  { value: 'elementary', label: 'Elementary' },
  { value: 'limited_working', label: 'Limited Working' },
  { value: 'professional_working', label: 'Professional Working' },
  { value: 'full_professional', label: 'Full Professional' },
  { value: 'native', label: 'Native' },
] as const;

// Default resume title
export const DEFAULT_RESUME_TITLE = 'My Resume';

// Auto-save debounce delay (ms)
export const AUTO_SAVE_DELAY = 2000;

// Date format constants
export const DATE_FORMAT = {
  DISPLAY: 'MMM yyyy',
  FULL: 'MMMM d, yyyy',
  INPUT: 'yyyy-MM-dd',
} as const;

// Skill categories
export const SKILL_CATEGORIES = [
  'Programming Languages',
  'Frameworks & Libraries',
  'Tools & Technologies',
  'Databases',
  'Cloud & DevOps',
  'Soft Skills',
  'Other',
] as const;

// Max lengths for form fields
export const MAX_LENGTHS = {
  TITLE: 255,
  NAME: 255,
  EMAIL: 255,
  PHONE: 50,
  LOCATION: 255,
  URL: 255,
  COMPANY: 255,
  POSITION: 255,
  INSTITUTION: 255,
  DEGREE: 255,
  GPA: 20,
  SKILL_NAME: 255,
  SUMMARY: 2000,
  DESCRIPTION: 5000,
} as const;

// API error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'Please log in to continue.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  RESUME_CREATED: 'Resume created successfully',
  RESUME_UPDATED: 'Resume updated successfully',
  RESUME_DELETED: 'Resume deleted successfully',
  RESUME_DUPLICATED: 'Resume duplicated successfully',
  CHANGES_SAVED: 'Changes saved successfully',
  LOGIN_SUCCESS: 'Logged in successfully',
  REGISTER_SUCCESS: 'Account created successfully',
  LOGOUT_SUCCESS: 'Logged out successfully',
} as const;
