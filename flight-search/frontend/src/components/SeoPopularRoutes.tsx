import { useTranslation } from 'react-i18next';
import { SEO_POPULAR_ROUTES } from '../data/seoPopularRoutes';
import { getCityDisplayName } from '../utils/cityDisplayName';
import { weekendFlightsOdPath } from '../utils/citySlug';
import { LocalizedLink } from './LocalizedLink';

interface SeoPopularRoutesProps {
  language: string;
  limit?: number;
}

/** Curated OD route links for homepage (and similar) SEO internal linking. */
export function SeoPopularRoutes({ language, limit = 24 }: SeoPopularRoutesProps) {
  const { t } = useTranslation();
  const routes = SEO_POPULAR_ROUTES.slice(0, limit);

  if (routes.length === 0) return null;

  const title = t('home.popularRoutesTitle');

  return (
    <nav className="home-hub-links" aria-label={title}>
      <h3 className="home-hub-links-title">{title}</h3>
      <ul className="home-hub-links-list">
        {routes.map(({ from, to }) => {
          const fromLabel = getCityDisplayName(from, language);
          const toLabel = getCityDisplayName(to, language);
          return (
            <li key={`${from.code}-${to.code}`}>
              <LocalizedLink to={weekendFlightsOdPath(from, to)}>
                {t('home.popularRouteLabel', { from: fromLabel, to: toLabel })}
              </LocalizedLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
