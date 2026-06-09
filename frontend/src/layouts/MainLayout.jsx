import { Outlet } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';

function MainLayout() {
  const { pathname } = useLocation();
  const isWatchPage = pathname.startsWith('/watch/');

  return (
    <div className={isWatchPage ? 'main-layout watch-layout' : 'main-layout'}>
      <Header />
      <Outlet />
      <Footer />
    </div>
  );
}

export default MainLayout;
