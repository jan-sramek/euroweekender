import { useTranslation } from 'react-i18next';
import { MediaSection } from '../components/MediaSection';
import { StepGrid } from '../components/StepGrid';
import { LocalizedLink } from '../components/LocalizedLink';
import { IMAGES } from '../config/images';
import { usePageMeta } from '../hooks/usePageMeta';
import { ContentPageLayout } from '../layouts/ContentPageLayout';
import '../layouts/ContentPageLayout.css';

export function HowItWorksPage() {
  const { t } = useTranslation();

  usePageMeta(t('meta.howItWorks.title'), t('meta.howItWorks.description'));

  return (
    <ContentPageLayout
      wide
      hero={{
        title: t('howItWorks.heroTitle'),
        subtitle: t('howItWorks.heroSubtitle'),
        image: IMAGES.heroHowItWorks,
        imageAlt: t('howItWorks.heroImageAlt')
      }}
    >
      <article className="content-prose">
        <h1>{t('howItWorks.heroTitle')}</h1>
        <p className="lead">{t('howItWorks.lead')}</p>

        <MediaSection
          title={t('howItWorks.builtTitle')}
          image={IMAGES.weekendTrip}
          imageAlt={t('howItWorks.weekendImageAlt')}
        >
          <p>{t('howItWorks.builtP1')}</p>
          <p>{t('howItWorks.builtP2')}</p>
        </MediaSection>

        <h2>{t('howItWorks.stepsTitle')}</h2>
        <StepGrid />

        <h2>{t('howItWorks.kiwiTitle')}</h2>
        <p>{t('howItWorks.kiwiP')}</p>

        <h2>{t('howItWorks.tipsTitle')}</h2>
        <ul>
          <li>{t('howItWorks.tip1')}</li>
          <li>{t('howItWorks.tip2')}</li>
          <li>{t('howItWorks.tip3')}</li>
          <li>{t('howItWorks.tip4')}</li>
        </ul>

        <div className="cta-box">
          <p>
            <LocalizedLink to="/">{t('common.startSearching')}</LocalizedLink> {t('common.orRead')}{' '}
            <LocalizedLink to="/faq">{t('common.readFaq')}</LocalizedLink>.
          </p>
        </div>
      </article>
    </ContentPageLayout>
  );
}
