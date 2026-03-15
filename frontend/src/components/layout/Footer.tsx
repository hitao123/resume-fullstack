import { Layout as AntLayout } from 'antd';
import { useTranslation } from 'react-i18next';

const { Footer: AntFooter } = AntLayout;

export const Footer = () => {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <AntFooter style={{ textAlign: 'center' }}>
      © {year} {t('common.appName')}
    </AntFooter>
  );
};

export default Footer;

