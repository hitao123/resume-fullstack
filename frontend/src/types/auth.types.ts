// Authentication types
export interface User {
  id: number;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  plan?: PlanSummary;
  usage?: UsageSummary;
  upgradeHint?: string;
}

export interface PlanSummary {
  code: string;
  name: string;
  resumeLimit: number;
  aiQuotaMonthly: number;
  templateLimit: number;
  allowDuplicate: boolean;
  allowCustomSections: boolean;
  allowCertifications: boolean;
  allowLanguages: boolean;
  allowAwards: boolean;
  allowHdPdf: boolean;
  allowJdOptimization: boolean;
  allowMultiLanguage: boolean;
}

export interface UsageSummary {
  yearMonth: string;
  aiUsed: number;
  pdfExportUsed: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}
