import { Fragment, useEffect, type ReactNode } from 'react';
import { HashRouter, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { Library } from './pages/Library';
import { TopicPage } from './pages/TopicPage';
import { PracticePage } from './practice/PracticePage';
import { BreakPage } from './pages/BreakPage';
import { SettingsPage } from './pages/SettingsPage';
import { StepGuidePage } from './pages/StepGuidePage';
import { ThemeProvider } from './theme/ThemeProvider';

/** Remount per topic so state from one topic never leaks into another. */
function Keyed({ children }: { children: (topicId: string) => ReactNode }) {
  const { topicId = '' } = useParams();
  return <Fragment key={topicId}>{children(topicId)}</Fragment>;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <ThemeProvider>
      {/* HashRouter so deep links work on GitHub Pages without server rewrites. */}
      <HashRouter>
        <ScrollToTop />
        <AppShell>
          <Routes>
            <Route path="/" element={<Library />} />
            <Route path="/topic/:topicId" element={<Keyed>{() => <TopicPage />}</Keyed>} />
            <Route path="/topic/:topicId/practice" element={<Keyed>{() => <PracticePage />}</Keyed>} />
            <Route path="/topic/:topicId/guide" element={<StepGuidePage />} />
            <Route path="/break" element={<BreakPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Library />} />
          </Routes>
        </AppShell>
      </HashRouter>
    </ThemeProvider>
  );
}
