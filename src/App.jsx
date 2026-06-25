import './App.css'
import { useEffect } from 'react';
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import QuickDonation from '@/pages/QuickLink/QuickDonation';
import QuickTahlil from '@/pages/QuickLink/QuickTahlil';
import { LocationProvider } from './providers/LocationProvider';
import { useFCM } from './firebase/useFCM';
import { useLoginGoogle } from './utils/auth';
import { useNativeBackButton } from './hooks/useNativeBackButton';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
};

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { login } = useLoginGoogle();
  useNativeBackButton();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const credential = params.get('google_credential');
    if (credential) {
      window.history.replaceState({}, '', window.location.pathname);
      login(credential);
    }
  }, []);

  return (
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      <Route path="/QuickDonation" element={<QuickDonation />} />
      <Route path="/QuickTahlil" element={<QuickTahlil />} />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
};


function App() {
  useFCM();

  return (
    <LocationProvider>
      <Router>
        <ScrollToTop />
        <AuthenticatedApp />
      </Router>
    </LocationProvider>
  )
}

export default App
