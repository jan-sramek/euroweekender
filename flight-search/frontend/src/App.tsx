import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { LocaleLayout } from './components/LocaleLayout';
import { LocaleRedirect } from './components/LocaleRedirect';
import { UmamiAnalytics } from './components/UmamiAnalytics';
import { DEFAULT_LOCALE } from './config/locales';
import { AboutPage } from './pages/AboutPage';
import { CheapestWeekendPage } from './pages/CheapestWeekendPage';
import { ContactPage } from './pages/ContactPage';
import { DayTripsFromCityPage } from './pages/DayTripsFromCityPage';
import { FaqPage } from './pages/FaqPage';
import { HomePage } from './pages/HomePage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { SingleDayTripsPage } from './pages/SingleDayTripsPage';
import { TermsPage } from './pages/TermsPage';
import { WeekendFlightsFromCityPage } from './pages/WeekendFlightsFromCityPage';
import { WeekendFlightsOdPage } from './pages/WeekendFlightsOdPage';

const LEGACY_REDIRECTS = [
  'about',
  'faq',
  'contact',
  'how-it-works',
  'privacy',
  'terms',
  'cheapest-weekend',
  'single-day-trips'
] as const;

function LegacyWeekendFlightsRedirect() {
  const { citySlug } = useParams<{ citySlug: string }>();
  return (
    <Navigate to={`/${DEFAULT_LOCALE}/weekend-flights-from/${citySlug ?? ''}`} replace />
  );
}

function LegacyDayTripsFromRedirect() {
  const { citySlug } = useParams<{ citySlug: string }>();
  return <Navigate to={`/${DEFAULT_LOCALE}/day-trips-from/${citySlug ?? ''}`} replace />;
}

function LegacyWeekendFlightsOdRedirect() {
  const { odSlug } = useParams<{ odSlug: string }>();
  return <Navigate to={`/${DEFAULT_LOCALE}/weekend-flights/${odSlug ?? ''}`} replace />;
}

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
        <Route path="/weekend-flights-from/:citySlug" element={<LegacyWeekendFlightsRedirect />} />
        <Route path="/day-trips-from/:citySlug" element={<LegacyDayTripsFromRedirect />} />
        <Route path="/weekend-flights/:odSlug" element={<LegacyWeekendFlightsOdRedirect />} />

        <Route path="/:lang" element={<LocaleLayout />}>
          <Route index element={<HomePage />} />
          <Route path="cheapest-weekend" element={<CheapestWeekendPage />} />
          <Route path="single-day-trips" element={<SingleDayTripsPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="faq" element={<FaqPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="how-it-works" element={<HowItWorksPage />} />
          <Route path="privacy" element={<PrivacyPage />} />
          <Route path="terms" element={<TermsPage />} />
          <Route path="weekend-flights-from/:citySlug" element={<WeekendFlightsFromCityPage />} />
          <Route path="day-trips-from/:citySlug" element={<DayTripsFromCityPage />} />
          <Route path="weekend-flights/:odSlug" element={<WeekendFlightsOdPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </>
  );
}
