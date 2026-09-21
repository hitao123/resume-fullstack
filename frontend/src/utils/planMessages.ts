import { Modal, message } from 'antd';
import i18n from '@/i18n';
import { getErrorCode } from '@/utils/apiError';

export function getUpgradeMessage(error: unknown): { title: string; content: string } | null {
  const t = i18n.t.bind(i18n);
  switch (getErrorCode(error)) {
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

export function openUpgradePrompt(error: unknown): boolean {
  const upgrade = getUpgradeMessage(error);
  if (!upgrade) return false;
  const t = i18n.t.bind(i18n);
  message.open({
    type: 'warning',
    content: upgrade.title,
    className: 'upgrade-message',
  });
  Modal.confirm({
    title: upgrade.title,
    content: upgrade.content,
    okText: t('upgrade.goMembership'),
    cancelText: t('upgrade.later'),
    centered: true,
    zIndex: 2000,
    onOk: () => window.location.assign('/pricing'),
  });
  return true;
}
