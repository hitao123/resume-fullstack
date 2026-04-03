import type { ApiError } from '@/types/api.types';
import { Modal } from 'antd';
import i18n from '@/i18n';

export function getUpgradeMessage(error: ApiError): { title: string; content: string } | null {
  const t = i18n.t.bind(i18n);
  switch (error.code) {
    case 'RESUME_LIMIT_EXCEEDED':
      return {
        title: t('upgrade.resumeLimitTitle'),
        content: t('upgrade.resumeLimitContent'),
      };
    case 'AI_QUOTA_EXCEEDED':
      return {
        title: t('upgrade.aiQuotaTitle'),
        content: t('upgrade.aiQuotaContent'),
      };
    case 'FEATURE_NOT_AVAILABLE':
      return {
        title: t('upgrade.featureUnavailableTitle'),
        content: t('upgrade.featureUnavailableContent'),
      };
    case 'TEMPLATE_NOT_AVAILABLE':
      return {
        title: t('upgrade.templateUnavailableTitle'),
        content: t('upgrade.templateUnavailableContent'),
      };
    default:
      return null;
  }
}

export function openUpgradePrompt(error: ApiError) {
  const upgrade = getUpgradeMessage(error);
  if (!upgrade) return;
  const t = i18n.t.bind(i18n);
  Modal.confirm({
    title: upgrade.title,
    content: upgrade.content,
    okText: t('upgrade.goMembership'),
    cancelText: t('upgrade.later'),
    onOk: () => window.location.assign('/pricing'),
  });
}
