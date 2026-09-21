import { Layout as AntLayout } from 'antd';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

const { Content } = AntLayout;

export const MainLayout = () => {
  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Header />
      <Content style={{ padding: '24px 28px', background: 'var(--rs-bg)' }}>
        <Outlet />
      </Content>
      <Footer />
    </AntLayout>
  );
};

export default MainLayout;

