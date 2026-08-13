import { useTranslation } from 'react-i18next';
import { useEmptyStateDeals } from '../hooks/useEmptyStateDeals';
import type { City } from '../types/city';
import { weekendFlightsOdPath } from '../utils/citySlug';
import { LocalizedLink } from './LocalizedLink';
import './HomeEmptyDeals.css';

interface HomeEmptyDealsProps {
  allCities: City[];
  language: string;
  originCodes: string[];
}

/** Cached weekend deals shown when live search returns nothing. */
export function HomeEmptyDeals({ allCities, language, originCodes }: HomeEmptyDealsProps) {
  const { t } = useTranslation();
  const deals = useEmptyStateDeals(originCodes, allCities, language, true);

  if (deals.length === 0) return null;

  return (
    <nav className="home-empty-deals" aria-label={t('home.emptyDealsTitle')}>
      <h3 className="home-empty-deals-title">{t('home.emptyDealsTitle')}</h3>
      <ul className="home-empty-deals-list">
        {deals.map(deal => (
          <li key={`${deal.from.code}-${deal.to.code}`}>
            <LocalizedLink
              className="home-empty-deal"
              to={weekendFlightsOdPath(deal.from, deal.to)}
            >
              <span className="home-empty-deal-route">
                {t('home.popularRouteLabel', { from: deal.from.name, to: deal.to.name })}
              </span>
              {deal.minPrice != null ? (
                <span className="home-empty-deal-price">
                  {t('weekendFlightsFrom.destinationPrice', { price: Math.round(deal.minPrice) })}
                </span>
              ) : null}
            </LocalizedLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
