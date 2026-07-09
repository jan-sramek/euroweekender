import { useTranslation } from 'react-i18next';
import { MediaSection } from '../components/MediaSection';
import { LocalizedLink } from '../components/LocalizedLink';
import { IMAGES } from '../config/images';
import { usePageMeta } from '../hooks/usePageMeta';
import { ContentPageLayout } from '../layouts/ContentPageLayout';
import '../layouts/ContentPageLayout.css';

export function AboutPage() {
  const { t } = useTranslation();

  usePageMeta(t('meta.about.title'), t('meta.about.description'), '/about');

  return (
    <ContentPageLayout
      wide
      hero={{
        title: t('about.heroTitle'),
        subtitle: t('about.heroSubtitle'),
        image: IMAGES.heroAbout,
        imageAlt: t('about.heroImageAlt')
      }}
    >
      <article className="content-prose">
        <h1>{t('about.heroTitle')}</h1>
        <p className="lead">{t('about.lead')}</p>

        <MediaSection
          title={t('about.sections.weekendTitle')}
          image={IMAGES.eveningFlight}
          imageAlt={t('about.eveningImageAlt')}
        >
          <p>{t('about.sections.weekendP1')}</p>
          <p>{t('about.sections.weekendP2')}</p>
        </MediaSection>

        <h2>{t('about.sections.whatTitle')}</h2>
        <p>{t('about.sections.whatP')}</p>

        <MediaSection
          title={t('about.sections.whoTitle')}
          image={IMAGES.cityBreak}
          imageAlt={t('about.cityImageAlt')}
          reverse
        >
          <p>{t('about.sections.whoP')}</p>
        </MediaSection>

        <h2>{t('about.sections.rankTitle')}</h2>
        <p>{t('about.sections.rankP')}</p>

        <h2>{t('about.sections.affiliateTitle')}</h2>
        <p>{t('about.sections.affiliateP')}</p>

        <h2>{t('about.sections.kiwiTitle')}</h2>
        <p>{t('about.sections.kiwiP1')}</p>
        <p>{t('about.sections.kiwiP2')}</p>

        <div className="cta-box">
          <p>
            {t('about.cta')}{' '}
            <LocalizedLink to="/">{t('common.searchWeekendFlights')}</LocalizedLink> {t('common.orRead')}{' '}
            <LocalizedLink to="/how-it-works">{t('common.howItWorks')}</LocalizedLink>.
          </p>
        </div>
      </article>
    </ContentPageLayout>
  );
}
