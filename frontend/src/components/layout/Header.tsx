import { Layout as AntLayout, Menu, Dropdown, Avatar } from 'antd';
import { UserOutlined, FileTextOutlined, LogoutOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type { MenuProps } from 'antd';

const { Header: AntHeader } = AntLayout;

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

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
      label: 'Logout',
      onClick: handleLogout,
    },
  ];

  const menuItems: MenuProps['items'] = [
    {
      key: '/dashboard',
      icon: <FileTextOutlined />,
      label: 'My Resumes',
      onClick: () => navigate('/dashboard'),
    },
  ];

  return (
    <AntHeader
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#001529',
        padding: '0 24px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div
          style={{
            color: '#fff',
            fontSize: '20px',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
          onClick={() => navigate('/dashboard')}
        >
          Resume Builder
        </div>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={menuItems}
          style={{ minWidth: 200, border: 'none' }}
        />
      </div>

      <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
        <Avatar
          style={{ backgroundColor: '#1890ff', cursor: 'pointer' }}
          icon={<UserOutlined />}
        />
      </Dropdown>
    </AntHeader>
  );
};

export default Header;
