import { Navigate, Route, Routes } from 'react-router-dom';
import { LocaleLayout } from './components/LocaleLayout';
import { LocaleRedirect } from './components/LocaleRedirect';
import { UmamiAnalytics } from './components/UmamiAnalytics';
import { DEFAULT_LOCALE } from './config/locales';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { FaqPage } from './pages/FaqPage';
import { HomePage } from './pages/HomePage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';

const LEGACY_REDIRECTS = [
  'about',
  'faq',
  'contact',
  'how-it-works',
  'privacy',
  'terms'
] as const;

export default function App() {
  return (
    <>
      <UmamiAnalytics />
      <Routes>
        <Route path="/" element={<LocaleRedirect />} />
        {LEGACY_REDIRECTS.map(segment => (
          <Route
            key={segment}
            path={`/${segment}`}
            element={<Navigate to={`/${DEFAULT_LOCALE}/${segment}`} replace />}
          />
        ))}

        <Route path="/:lang" element={<LocaleLayout />}>
          <Route index element={<HomePage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="faq" element={<FaqPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="how-it-works" element={<HowItWorksPage />} />
          <Route path="privacy" element={<PrivacyPage />} />
          <Route path="terms" element={<TermsPage />} />
          <Route path="*" element={<HomePage />} />
        </Route>
      </Routes>
    </>
  );
}
