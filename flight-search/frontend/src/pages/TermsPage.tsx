import { useTranslation } from 'react-i18next';
import { LocalizedLink } from '../components/LocalizedLink';
import { CONTACT_EMAIL } from '../config/site';
import { usePageMeta } from '../hooks/usePageMeta';
import { ContentPageLayout } from '../layouts/ContentPageLayout';
import '../layouts/ContentPageLayout.css';

export function TermsPage() {
  const { t } = useTranslation();

  usePageMeta(t('meta.terms.title'), t('meta.terms.description'), '/terms');

  return (
    <ContentPageLayout>
      <article className="content-prose">
        <h1>{t('terms.title')}</h1>
        <p className="lead">{t('terms.lead')}</p>

        <p>{t('terms.intro')}</p>

        <h2>{t('terms.serviceTitle')}</h2>
        <p>{t('terms.service')}</p>

        <h2>{t('terms.accuracyTitle')}</h2>
        <p>{t('terms.accuracy')}</p>

        <h2>{t('terms.affiliateTitle')}</h2>
        <p>{t('terms.affiliate')}</p>

        <h2>{t('terms.acceptableTitle')}</h2>
        <p>{t('terms.acceptableIntro')}</p>
        <ul>
          <li>{t('terms.acceptable1')}</li>
          <li>{t('terms.acceptable2')}</li>
          <li>{t('terms.acceptable3')}</li>
        </ul>

        <h2>{t('terms.liabilityTitle')}</h2>
        <p>{t('terms.liability')}</p>

        <h2>{t('terms.changesTitle')}</h2>
        <p>{t('terms.changes')}</p>

        <h2>{t('terms.lawTitle')}</h2>
        <p>{t('terms.law')}</p>

        <h2>{t('terms.contactTitle')}</h2>
        <p>{t('terms.contact', { email: CONTACT_EMAIL })}</p>

        <p>
          {t('terms.seeAlso')}{' '}
          <LocalizedLink to="/privacy">{t('common.seeAlsoPrivacy')}</LocalizedLink>.
        </p>
      </article>
    </ContentPageLayout>
  );
}
