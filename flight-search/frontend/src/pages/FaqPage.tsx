import { useTranslation } from 'react-i18next';
import { LocalizedLink } from '../components/LocalizedLink';
import { IMAGES } from '../config/images';
import { useJsonLd } from '../hooks/useJsonLd';
import { usePageMeta } from '../hooks/usePageMeta';
import { ContentPageLayout } from '../layouts/ContentPageLayout';
import { faqPageJsonLd } from '../utils/seoSchema';
import '../layouts/ContentPageLayout.css';

export function FaqPage() {
  const { t } = useTranslation();
  const items = t('faq.items', { returnObjects: true }) as Array<{ q: string; a: string }>;

  usePageMeta(t('meta.faq.title'), t('meta.faq.description'), '/faq');
  useJsonLd(Array.isArray(items) && items.length > 0 ? faqPageJsonLd(items) : null);

  return (
    <ContentPageLayout
      hero={{
        title: t('faq.heroTitle'),
        subtitle: t('faq.heroSubtitle'),
        image: IMAGES.heroFaq,
        imageAlt: t('faq.heroImageAlt')
      }}
    >
      <article className="content-prose">
        <h1>{t('faq.heroTitle')}</h1>
        <p className="lead">{t('faq.lead')}</p>

        <div className="faq-list">
          {items.map(item => (
            <section key={item.q} className="faq-item">
              <h2>{item.q}</h2>
              <p>{item.a}</p>
            </section>
          ))}
        </div>

        <div className="cta-box">
          <p>
            {t('faq.ctaStill')}{' '}
            <LocalizedLink to="/contact">{t('common.contactUs')}</LocalizedLink> {t('common.orStart')}{' '}
            <LocalizedLink to="/">{t('common.newSearch')}</LocalizedLink>.
          </p>
        </div>
      </article>
    </ContentPageLayout>
  );
}
