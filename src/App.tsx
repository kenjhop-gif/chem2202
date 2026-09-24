import { Fragment, useEffect, type ReactNode } from 'react';
import { HashRouter, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { Library } from './pages/Library';
import { TopicPage } from './pages/TopicPage';
import { PracticePage } from './practice/PracticePage';
import { BreakPage } from './pages/BreakPage';
import { SettingsPage } from './pages/SettingsPage';
import { StepGuidePage } from './pages/StepGuidePage';
import { ProgressPage } from './pages/ProgressPage';
import { FamilyPage } from './pages/FamilyPage';
import { AdminPage } from './pages/AdminPage';
import { ThemeProvider } from './theme/ThemeProvider';
import { AuthProvider, useAuth } from './auth/AuthProvider';
import { Gate } from './auth/Gate';

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

/** Parents land on their family page; everyone else on the topic library. */
function Home() {
  const { profile } = useAuth();
  return profile?.role === 'parent' ? <FamilyPage /> : <Library />;
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        {/* HashRouter so deep links work on GitHub Pages without server rewrites. */}
        <HashRouter>
          <ScrollToTop />
          <Gate>
            <AppShell>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/library" element={<Library />} />
                <Route path="/topic/:topicId" element={<Keyed>{() => <TopicPage />}</Keyed>} />
                <Route path="/topic/:topicId/practice" element={<Keyed>{() => <PracticePage />}</Keyed>} />
                <Route path="/topic/:topicId/guide" element={<StepGuidePage />} />
                <Route path="/progress" element={<ProgressPage />} />
                <Route path="/progress/:uid" element={<ProgressPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/break" element={<BreakPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="*" element={<Home />} />
              </Routes>
            </AppShell>
          </Gate>
        </HashRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}
