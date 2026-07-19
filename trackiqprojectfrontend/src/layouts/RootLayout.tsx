import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AuroraBackground } from '../components/AuroraBackground';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useTheme } from '../context/ThemeContext';

export function RootLayout() {
  const { dark, toggle } = useTheme();
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  const showFooter = pathname === '/';

  return (
    <div className="relative min-h-screen">
      <AuroraBackground />
      <Navbar dark={dark} onToggleDark={toggle} />
      <Outlet />
      {showFooter && <Footer />}
    </div>
  );
}
