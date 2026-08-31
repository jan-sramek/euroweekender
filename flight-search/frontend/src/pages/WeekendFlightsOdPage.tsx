import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useParams } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { SiteFooter } from '../components/SiteFooter';
import { LocalizedLink } from '../components/LocalizedLink';
import { indexableLocalesForOrigin, preferredIndexableLocale } from '../config/cityIndexLocales';
import { localizedPath } from '../config/locales';
import { useDeparturePrefill } from '../hooks/useDeparturePrefill';
import { useJsonLd } from '../hooks/useJsonLd';
import { useLocale, useLocalizedPath } from '../hooks/useLocale';
import { useSeoPageContent } from '../hooks/useSeoPageContent';
import { findCityByCode } from '../services/locationPrefill';
import { getCityDisplayName } from '../utils/cityDisplayName';
import {
  dayTripsFromPath,
  parseOdSlugs,
  weekendFlightsFromPath,
  weekendFlightsOdPath
} from '../utils/citySlug';
import { SEO_PAGE_TYPES } from '../utils/seoPageContent';
import { breadcrumbListJsonLd, faqPageJsonLd } from '../utils/seoSchema';
import { computeRouteFactsFromCities } from '../utils/routeFacts';
import { CheapestWeekendPage } from './CheapestWeekendPage';
import { NotFoundPage } from './NotFoundPage';
import '../layouts/ContentPageLayout.css';

export function WeekendFlightsOdPage() {
  const { t } = useTranslation();
  const locale = useLocale();
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
  const indexLocales = useMemo(
    () => indexableLocalesForOrigin(parsed?.fromCode, fromCity?.country),
    [parsed?.fromCode, fromCity?.country]
  );
  const uniqueContent = useSeoPageContent(
    SEO_PAGE_TYPES.weekendOd,
    parsed?.fromCode,
    parsed?.toCode,
    locale
  );

  const fromLabel = fromCity ? getCityDisplayName(fromCity, locale) : '';
  const toLabel = toCity ? getCityDisplayName(toCity, locale) : '';
  const routeFacts = useMemo(
    () => computeRouteFactsFromCities(fromCity, toCity),
    [fromCity, toCity]
  );

  const faqItems = useMemo(() => {
    if (uniqueContent?.faq?.length) return uniqueContent.faq;
    if (!fromLabel || !toLabel) return [];
    const items = t('weekendFlightsOd.faq', {
      from: fromLabel,
      to: toLabel,
      duration: routeFacts?.durationLabel ?? '',
      distanceKm: routeFacts?.distanceKm ?? '',
      returnObjects: true
    }) as Array<{ q: string; a: string }>;
    return Array.isArray(items) ? items : [];
  }, [fromLabel, toLabel, routeFacts, t, uniqueContent]);

  useJsonLd(faqItems.length > 0 ? faqPageJsonLd(faqItems) : null);

  const breadcrumbJsonLd = useMemo(() => {
    if (!fromCity || !toCity) return null;
    return breadcrumbListJsonLd([
      { name: t('nav.home'), path: path('/') },
      {
        name: t('weekendFlightsFrom.tagline', { city: fromLabel }),
        path: localizedPath(
          preferredIndexableLocale(locale, fromCity.code, fromCity.country),
          weekendFlightsFromPath(fromCity)
        )
      },
      {
        name: t('weekendFlightsOd.title', { from: fromLabel, to: toLabel }),
        path: path(weekendFlightsOdPath(fromCity, toCity))
      }
    ]);
  }, [fromCity, toCity, fromLabel, toLabel, locale, path, t]);

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
      {(uniqueContent?.paragraphs?.length
        ? uniqueContent.paragraphs
        : [t('weekendFlightsOd.seoBlock', { from: fromLabel, to: toLabel })]
      ).map(text => (
        <p key={text.slice(0, 48)} className="home-seo-text">
          {text}
        </p>
      ))}
      {uniqueContent?.sourceUrl ? (
        <p className="home-seo-attribution">
          <a href={uniqueContent.sourceUrl} rel="noopener noreferrer">
            {t('seoUnique.attribution')}
          </a>
        </p>
      ) : null}
      {faqItems.length > 0 ? (
        <div className="faq-list">
          <h3 className="home-seo-title">{t('weekendFlightsOd.faqTitle', { from: fromLabel, to: toLabel })}</h3>
          {faqItems.map(item => (
            <section key={item.q} className="faq-item">
              <h2>{item.q}</h2>
              <p>{item.a}</p>
            </section>
          ))}
        </div>
      ) : null}
      <p className="home-seo-links">
        <LocalizedLink
          locale={preferredIndexableLocale(locale, fromCity.code, fromCity.country)}
          to={weekendFlightsFromPath(fromCity)}
        >
          {t('weekendFlightsOd.seeAlsoFromCity', { city: fromLabel })}
        </LocalizedLink>
        {' · '}
        <LocalizedLink
          locale={preferredIndexableLocale(locale, toCity.code, toCity.country)}
          to={weekendFlightsFromPath(toCity)}
        >
          {t('weekendFlightsOd.seeAlsoFromCity', { city: toLabel })}
        </LocalizedLink>
        {' · '}
        <LocalizedLink
          locale={preferredIndexableLocale(locale, fromCity.code, fromCity.country)}
          to={dayTripsFromPath(fromCity)}
        >
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
      metaDescription={
        uniqueContent?.metaDescription ||
        t('meta.weekendFlightsOd.description', { from: fromLabel, to: toLabel })
      }
      pageTagline={t('weekendFlightsOd.tagline', { from: fromLabel, to: toLabel })}
      pageTitle={t('weekendFlightsOd.title', { from: fromLabel, to: toLabel })}
      pageSubtitle={t('weekendFlightsOd.subtitle')}
      pageLead={uniqueContent?.lead || t('weekendFlightsOd.lead', { from: fromLabel, to: toLabel })}
      seoHeading={uniqueContent?.heading || t('weekendFlightsOd.seoTitle', { from: fromLabel, to: toLabel })}
      extraSeoContent={extraSeoContent}
      indexLocales={indexLocales}
    />
  );
}
