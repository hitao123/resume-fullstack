import { Layout as AntLayout, Menu, Dropdown, Avatar, theme, Tag, Space } from 'antd';
import { UserOutlined, FileTextOutlined, LogoutOutlined, CrownFilled } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type { MenuProps } from 'antd';
import logoUrl from '@/assets/logo.svg';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';
import './Header.css';

const { Header: AntHeader } = AntLayout;

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { token } = theme.useToken();
  const { t } = useTranslation();

  const handleLogout = async () => {
    await logout();
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: user?.name || user?.email,
      disabled: true,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: t('auth.logout'),
      onClick: handleLogout,
    },
  ];

  const menuItems: MenuProps['items'] = [
    {
      key: '/dashboard',
      icon: <FileTextOutlined />,
      label: t('nav.myResumes'),
      onClick: () => navigate('/dashboard'),
    },
    {
      key: '/pricing',
      icon: <CrownFilled />,
      label: t('nav.membership'),
      onClick: () => navigate('/pricing'),
    },
  ];

  return (
    <AntHeader
      className="appHeader"
      style={{
        // allow theme overrides via ConfigProvider tokens
        borderBottomColor: token.colorBorderSecondary,
      }}
    >
      <div className="left">
        <div className="brand" onClick={() => navigate('/dashboard')} aria-label={t('nav.myResumes')}>
          <img className="brandLogo" src={logoUrl} alt={t('common.appName')} />
          <div className="brandText">{t('common.appName')}</div>
        </div>
        <Menu
          theme="light"
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={menuItems}
          className="menu"
        />
      </div>

      <div className="right">
        {user?.plan && (
          <Space size="small">
            <Tag
              style={{
                borderRadius: 999,
                marginInlineEnd: 0,
                borderColor: user.plan.code === 'FREE' ? '#e9e6e0' : '#e6d7b8',
                background: user.plan.code === 'FREE' ? '#faf9f6' : '#f5eddc',
                color: user.plan.code === 'FREE' ? '#78716c' : '#7c5416',
                fontWeight: 600,
              }}
            >
              {user.plan.name}
            </Tag>
          </Space>
        )}
        <LanguageSwitcher />
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
          <Avatar
            className="avatar"
            style={{ backgroundColor: token.colorPrimary }}
            icon={<UserOutlined />}
          />
        </Dropdown>
      </div>
    </AntHeader>
  );
};

export default Header;
