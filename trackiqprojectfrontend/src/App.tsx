import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ScanProvider } from './context/ScanContext';
import { RootLayout } from './layouts/RootLayout';
import { Landing } from './pages/Landing';
import { LoadingScreen } from './pages/LoadingScreen';
import { Dashboard } from './pages/Dashboard';

export default function App() {
  return (
    <ThemeProvider>
      <ScanProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<RootLayout />}>
              <Route path="/" element={<Landing />} />
              <Route path="/scan" element={<LoadingScreen />} />
              <Route path="/dashboard" element={<Dashboard />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ScanProvider>
    </ThemeProvider>
  );
}
