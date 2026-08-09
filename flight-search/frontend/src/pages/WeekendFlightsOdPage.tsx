import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useParams } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { SiteFooter } from '../components/SiteFooter';
import { LocalizedLink } from '../components/LocalizedLink';
import { useDeparturePrefill } from '../hooks/useDeparturePrefill';
import { useJsonLd } from '../hooks/useJsonLd';
import { useLocalizedPath } from '../hooks/useLocale';
import { findCityByCode } from '../services/locationPrefill';
import { getCityDisplayName } from '../utils/cityDisplayName';
import {
  dayTripsFromPath,
  parseOdSlugs,
  weekendFlightsFromPath,
  weekendFlightsOdPath
} from '../utils/citySlug';
import { breadcrumbListJsonLd } from '../utils/seoSchema';
import { CheapestWeekendPage } from './CheapestWeekendPage';
import { NotFoundPage } from './NotFoundPage';

export function WeekendFlightsOdPage() {
  const { t, i18n } = useTranslation();
  const { odSlug } = useParams<{ odSlug: string }>();
  const { path } = useLocalizedPath();
  const parsed = parseOdSlugs(odSlug);

  const preferredCodes = useMemo(() => (parsed ? [parsed.fromCode] : null), [parsed]);
  const localizeCodes = useMemo(() => (parsed ? [parsed.toCode] : null), [parsed]);

  const { allCities, locating } = useDeparturePrefill({ preferredCodes, localizeCodes });

  const fromCity = useMemo(
    () => (parsed ? findCityByCode(allCities, parsed.fromCode) : undefined),
    [allCities, parsed]
  );
  const toCity = useMemo(
    () => (parsed ? findCityByCode(allCities, parsed.toCode) : undefined),
    [allCities, parsed]
  );

  const fromLabel = fromCity ? getCityDisplayName(fromCity, i18n.language) : '';
  const toLabel = toCity ? getCityDisplayName(toCity, i18n.language) : '';

  const breadcrumbJsonLd = useMemo(() => {
    if (!fromCity || !toCity) return null;
    return breadcrumbListJsonLd([
      { name: t('nav.home'), path: path('/') },
      {
        name: t('weekendFlightsFrom.tagline', { city: fromLabel }),
        path: path(weekendFlightsFromPath(fromCity))
      },
      {
        name: t('weekendFlightsOd.title', { from: fromLabel, to: toLabel }),
        path: path(weekendFlightsOdPath(fromCity, toCity))
      }
    ]);
  }, [fromCity, toCity, fromLabel, toLabel, path, t]);

  useJsonLd(breadcrumbJsonLd);

  if (!parsed) {
    return <NotFoundPage />;
  }

  if (allCities.length === 0 && locating) {
    return (
      <>
        <AppHeader />
        <div className="container">
          <div className="state-box state-box-loading">
            <LoadingIndicator size="md" label={t('home.loading')} />
          </div>
        </div>
        <SiteFooter />
      </>
    );
  }

  if (!fromCity || !toCity) {
    return <NotFoundPage />;
  }

  const canonicalPath = weekendFlightsOdPath(fromCity, toCity);
  const canonicalSlug = canonicalPath.split('/').pop();
  if (odSlug?.toLowerCase() !== canonicalSlug) {
    return <Navigate to={path(canonicalPath)} replace />;
  }

  const extraSeoContent = (
    <>
      <p className="home-seo-text">
        {t('weekendFlightsOd.seoBlock', { from: fromLabel, to: toLabel })}
      </p>
      <p className="home-seo-links">
        <LocalizedLink to={weekendFlightsFromPath(fromCity)}>
          {t('weekendFlightsOd.seeAlsoFromCity', { city: fromLabel })}
        </LocalizedLink>
        {' · '}
        <LocalizedLink to={weekendFlightsFromPath(toCity)}>
          {t('weekendFlightsOd.seeAlsoFromCity', { city: toLabel })}
        </LocalizedLink>
        {' · '}
        <LocalizedLink to={dayTripsFromPath(fromCity)}>
          {t('weekendFlightsFrom.seeAlsoDayTripsFromCity', { city: fromLabel })}
        </LocalizedLink>
        {' · '}
        <LocalizedLink to="/cheapest-weekend">{t('weekendFlightsFrom.seeAlsoCheapest')}</LocalizedLink>
      </p>
    </>
  );

  return (
    <CheapestWeekendPage
      forcedFrom={fromCity.code}
      forcedTo={toCity.code}
      routePath={canonicalPath}
      metaTitle={t('meta.weekendFlightsOd.title', { from: fromLabel, to: toLabel })}
      metaDescription={t('meta.weekendFlightsOd.description', { from: fromLabel, to: toLabel })}
      extraSeoContent={extraSeoContent}
    />
  );
}
