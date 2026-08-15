import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ScrollToTop } from '@/components/ui/ScrollToTop';
import { AnimatePresence } from 'framer-motion';
import { PageTransition } from '@/components/layout/PageTransition';

// Lazy loading pages
const Home = lazy(() => import('@/components/pages/Home').then(module => ({ default: module.Home })));
const AnimeDetails = lazy(() => import('@/components/pages/AnimeDetails').then(module => ({ default: module.AnimeDetails })));
const AnimeStaff = lazy(() => import('@/components/pages/AnimeStaff').then(module => ({ default: module.AnimeStaff })));
const AnimeCharacters = lazy(() => import('@/components/pages/AnimeCharacters').then(module => ({ default: module.AnimeCharacters })));
const Catalog = lazy(() => import('@/components/pages/Catalog').then(module => ({ default: module.Catalog })));
const Discover = lazy(() => import('@/components/pages/Discover').then(module => ({ default: module.Discover })));
const Calendar = lazy(() => import('@/components/pages/Calendar').then(module => ({ default: module.Calendar })));
const Profile = lazy(() => import('@/components/pages/Profile').then(module => ({ default: module.Profile })));
const Login = lazy(() => import('@/components/pages/Login').then(module => ({ default: module.Login })));
const Onboarding = lazy(() => import('@/components/pages/Onboarding').then(module => ({ default: module.Onboarding })));
const Characters = lazy(() => import('@/components/pages/Characters').then(module => ({ default: module.Characters })));
const CharacterDetails = lazy(() => import('@/components/pages/CharacterDetails').then(module => ({ default: module.CharacterDetails })));
const VoiceActors = lazy(() => import('@/components/pages/VoiceActors').then(module => ({ default: module.VoiceActors })));
const PersonDetails = lazy(() => import('@/components/pages/PersonDetails').then(module => ({ default: module.PersonDetails })));
const StudioDetails = lazy(() => import('@/components/pages/StudioDetails').then(module => ({ default: module.StudioDetails })));
const PrivacyPolicy = lazy(() => import('@/components/pages/PrivacyPolicy').then(module => ({ default: module.PrivacyPolicy })));
const TermsOfUse = lazy(() => import('@/components/pages/TermsOfUse').then(module => ({ default: module.TermsOfUse })));
const NotFound = lazy(() => import('@/components/pages/NotFound').then(module => ({ default: module.NotFound })));
const Library = lazy(() => import('@/components/pages/Library').then(module => ({ default: module.Library })));
const Stats = lazy(() => import('@/components/pages/Stats').then(module => ({ default: module.Stats }))); // [NEW]
const PublicProfile = lazy(() => import('@/components/pages/PublicProfile').then(module => ({ default: module.PublicProfile })));
const PublicLibrary = lazy(() => import('@/components/pages/PublicLibrary').then(module => ({ default: module.PublicLibrary })));

const GlobalSearch = lazy(() => import('@/components/pages/GlobalSearch').then(module => ({ default: module.GlobalSearch })));

// Loading Component
import { Loader } from '@/components/ui/Loader';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { ProtectedRoute } from '@/components/ui/ProtectedRoute';
import { RouteErrorBoundary } from '@/components/ui/RouteErrorBoundary';
import { OnboardingGate } from '@/components/onboarding/OnboardingGate';

const PageLoader = () => (
  <div className="flex items-center justify-center w-full h-full min-h-[60vh]">
    <Loader />
  </div>
);

import { Layout } from "@/components/layout/Layout";

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageTransition><RouteErrorBoundary><Home /></RouteErrorBoundary></PageTransition>} />
            <Route path="/discover" element={<PageTransition><RouteErrorBoundary><Discover /></RouteErrorBoundary></PageTransition>} />
            <Route path="/catalog" element={<PageTransition><RouteErrorBoundary><Catalog /></RouteErrorBoundary></PageTransition>} />
            <Route path="/search" element={<PageTransition><RouteErrorBoundary><GlobalSearch /></RouteErrorBoundary></PageTransition>} />
            <Route path="/calendar" element={<PageTransition><RouteErrorBoundary><Calendar /></RouteErrorBoundary></PageTransition>} />
            <Route path="/characters" element={<PageTransition><RouteErrorBoundary><Characters /></RouteErrorBoundary></PageTransition>} />
            <Route path="/people" element={<PageTransition><RouteErrorBoundary><VoiceActors /></RouteErrorBoundary></PageTransition>} />
            <Route path="/person/:id" element={<PageTransition><RouteErrorBoundary><PersonDetails /></RouteErrorBoundary></PageTransition>} />
            <Route path="/character/:id" element={<PageTransition><RouteErrorBoundary><CharacterDetails /></RouteErrorBoundary></PageTransition>} />
            <Route path="/studio/:id" element={<PageTransition><RouteErrorBoundary><StudioDetails /></RouteErrorBoundary></PageTransition>} />
            <Route path="/anime/:id" element={<PageTransition><RouteErrorBoundary><AnimeDetails /></RouteErrorBoundary></PageTransition>} />
            <Route path="/anime/:id/staff" element={<PageTransition><RouteErrorBoundary><AnimeStaff /></RouteErrorBoundary></PageTransition>} />
            <Route path="/anime/:id/characters" element={<PageTransition><RouteErrorBoundary><AnimeCharacters /></RouteErrorBoundary></PageTransition>} />
            <Route path="/library" element={<PageTransition><ProtectedRoute><RouteErrorBoundary><Library /></RouteErrorBoundary></ProtectedRoute></PageTransition>} />
            <Route path="/stats" element={<PageTransition><ProtectedRoute><RouteErrorBoundary><Stats /></RouteErrorBoundary></ProtectedRoute></PageTransition>} />
            <Route path="/login" element={<PageTransition><RouteErrorBoundary><Login /></RouteErrorBoundary></PageTransition>} />
            <Route path="/onboarding" element={<PageTransition><RouteErrorBoundary><Onboarding /></RouteErrorBoundary></PageTransition>} />
            <Route path="/profile" element={<PageTransition><ProtectedRoute><RouteErrorBoundary><Profile /></RouteErrorBoundary></ProtectedRoute></PageTransition>} />
            <Route path="/u/:uid" element={<PageTransition><RouteErrorBoundary><PublicProfile /></RouteErrorBoundary></PageTransition>} />
            <Route path="/u/:uid/library" element={<PageTransition><RouteErrorBoundary><PublicLibrary /></RouteErrorBoundary></PageTransition>} />
            <Route path="/privacy" element={<PageTransition><RouteErrorBoundary><PrivacyPolicy /></RouteErrorBoundary></PageTransition>} />
            <Route path="/terms" element={<PageTransition><RouteErrorBoundary><TermsOfUse /></RouteErrorBoundary></PageTransition>} />
            <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
          </Routes>
        </AnimatePresence>
      </Suspense>
    </Layout>
  );
};

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ScrollToTop />
      <ErrorBoundary>
        <OnboardingGate>
          <AnimatedRoutes />
        </OnboardingGate>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
