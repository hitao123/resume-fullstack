import api from './api';
import type { ApiResponse } from '@/types/api.types';
import type { BillingPlan, CheckoutResponse, PayOrderResponse, BillingOrder } from '@/types/billing.types';

export const billingService = {
  async getPlans(): Promise<BillingPlan[]> {
    const response = await api.get<ApiResponse<BillingPlan[]>>('/billing/plans');
    return response.data.data;
  },

  async checkout(
    planCode: string,
    billingCycle: 'monthly' | 'yearly' = 'monthly',
    provider: 'mock' | 'stripe' | 'wechat' | 'alipay' = 'mock'
  ): Promise<CheckoutResponse> {
    const response = await api.post<ApiResponse<CheckoutResponse>>('/billing/checkout', { planCode, billingCycle, provider });
    return response.data.data;
  },

  async getOrders(): Promise<BillingOrder[]> {
    const response = await api.get<ApiResponse<BillingOrder[]>>('/billing/orders');
    return response.data.data;
  },

  async payOrder(orderId: number, provider = 'mock'): Promise<PayOrderResponse> {
    const response = await api.post<ApiResponse<PayOrderResponse>>(`/billing/orders/${orderId}/pay`, { provider });
    return response.data.data;
  },
};

export default billingService;
