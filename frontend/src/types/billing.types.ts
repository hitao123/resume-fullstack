import type { User } from './auth.types';

export interface BillingPlan {
  code: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
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
  allowPriorityFeatures: boolean;
}

export interface CheckoutResponse {
  orderId: number;
  planCode: string;
  planName: string;
  billingCycle: 'monthly' | 'yearly';
  amount: number;
  paymentStatus: string;
  provider: 'mock' | 'stripe' | 'wechat' | 'alipay';
  checkoutUrl?: string;
  codeUrl?: string;
  formHtml?: string;
  sessionId?: string;
}

export interface PayOrderResponse {
  orderId: number;
  status: string;
  user: User;
}

export interface BillingOrder {
  id: number;
  planCode: string;
  planName: string;
  amount: number;
  status: string;
  billingCycle: string;
  provider: string;
  createdAt: string;
  paidAt?: string;
}
