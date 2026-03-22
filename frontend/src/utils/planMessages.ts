import type { ApiError } from '@/types/api.types';
import { Modal } from 'antd';

export function getUpgradeMessage(error: ApiError): { title: string; content: string } | null {
  switch (error.code) {
    case 'RESUME_LIMIT_EXCEEDED':
      return {
        title: '已达到简历数量上限',
        content: '升级到初级会员可创建最多 5 份简历，升级到高级会员可不限数量。',
      };
    case 'AI_QUOTA_EXCEEDED':
      return {
        title: '本月 AI 次数已用完',
        content: '初级会员每月可使用 50 次 AI，高级会员每月可使用 300 次 AI。',
      };
    case 'FEATURE_NOT_AVAILABLE':
      return {
        title: '当前套餐暂不支持该功能',
        content: '升级会员后可解锁简历复制、证书、语言、自定义模块、高清导出等能力。',
      };
    case 'TEMPLATE_NOT_AVAILABLE':
      return {
        title: '当前套餐模板数量不足',
        content: '初级会员支持 3 到 5 个模板，高级会员支持全部模板。',
      };
    default:
      return null;
  }
}

export function openUpgradePrompt(error: ApiError) {
  const upgrade = getUpgradeMessage(error);
  if (!upgrade) return;
  Modal.confirm({
    title: upgrade.title,
    content: upgrade.content,
    okText: '去会员中心',
    cancelText: '稍后再说',
    onOk: () => window.location.assign('/pricing'),
  });
}
