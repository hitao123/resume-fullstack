import { Dropdown, Button } from 'antd';
import type { MenuProps } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

type Props = {
  size?: 'small' | 'middle' | 'large';
  variant?: 'text' | 'default';
};

export const LanguageSwitcher = ({ size = 'middle', variant = 'text' }: Props) => {
  const { t, i18n } = useTranslation();

  const items: MenuProps['items'] = [
    {
      key: 'zh-CN',
      label: t('common.chinese'),
      onClick: () => i18n.changeLanguage('zh-CN'),
    },
    {
      key: 'en-US',
      label: t('common.english'),
      onClick: () => i18n.changeLanguage('en-US'),
    },
  ];

  return (
    <Dropdown menu={{ items, selectedKeys: [i18n.language] }} placement="bottomRight" trigger={['click']}>
      <Button
        type={variant === 'default' ? 'default' : 'text'}
        size={size}
        icon={<GlobalOutlined />}
        aria-label={t('common.language')}
      />
    </Dropdown>
  );
};

export default LanguageSwitcher;

