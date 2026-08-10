import { useTranslation } from 'react-i18next';
import { LocalizedLink } from './LocalizedLink';

/** Compact how-it-works + FAQ teaser for homepage SEO body copy. */
export function HomeSeoExtras() {
  const { t } = useTranslation();
  const faqItems = t('faq.items', { returnObjects: true }) as Array<{ q: string; a: string }>;
  const teaserFaq = Array.isArray(faqItems) ? faqItems.slice(0, 3) : [];

  return (
    <div className="home-seo-extras">
      <div className="home-seo-howto">
        <h3 className="home-hub-links-title">{t('home.howItWorksTitle')}</h3>
        <ol className="home-seo-steps">
          <li>
            <strong>{t('howItWorks.step1title')}</strong> — {t('howItWorks.step1text')}
          </li>
          <li>
            <strong>{t('howItWorks.step2title')}</strong> — {t('howItWorks.step2text')}
          </li>
          <li>
            <strong>{t('howItWorks.step3title')}</strong> — {t('howItWorks.step3text')}
          </li>
          <li>
            <strong>{t('howItWorks.step4title')}</strong> — {t('howItWorks.step4text')}
          </li>
        </ol>
        <p className="home-seo-links">
          <LocalizedLink to="/how-it-works">{t('nav.howItWorks')}</LocalizedLink>
          {' · '}
          <LocalizedLink to="/cheapest-weekend">{t('nav.cheapestWeekend')}</LocalizedLink>
          {' · '}
          <LocalizedLink to="/single-day-trips">{t('nav.singleDayTrips')}</LocalizedLink>
        </p>
      </div>

      {teaserFaq.length > 0 ? (
        <div className="home-seo-faq">
          <h3 className="home-hub-links-title">{t('home.faqTeaserTitle')}</h3>
          {teaserFaq.map(item => (
            <section key={item.q} className="home-seo-faq-item">
              <h4>{item.q}</h4>
              <p>{item.a}</p>
            </section>
          ))}
          <p className="home-seo-links">
            <LocalizedLink to="/faq">{t('home.faqTeaserMore')}</LocalizedLink>
          </p>
        </div>
      ) : null}
    </div>
  );
}
