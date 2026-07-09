import { useTranslation } from 'react-i18next';
import { LocalizedLink } from '../components/LocalizedLink';
import { CONTACT_EMAIL } from '../config/site';
import { usePageMeta } from '../hooks/usePageMeta';
import { ContentPageLayout } from '../layouts/ContentPageLayout';
import '../layouts/ContentPageLayout.css';

export function PrivacyPage() {
  const { t } = useTranslation();

  usePageMeta(t('meta.privacy.title'), t('meta.privacy.description'), '/privacy');

  return (
    <ContentPageLayout>
      <article className="content-prose">
        <h1>{t('privacy.title')}</h1>
        <p className="lead">{t('privacy.lead')}</p>

        <p>{t('privacy.intro')}</p>

        <h2>{t('privacy.infoCollect')}</h2>
        <ul>
          <li>
            <strong>{t('privacy.analyticsLabel')}</strong> {t('privacy.analytics')}
          </li>
          <li>
            <strong>{t('privacy.usageLabel')}</strong> {t('privacy.usage')}
          </li>
          <li>
            <strong>{t('privacy.locationLabel')}</strong> {t('privacy.location')}
          </li>
          <li>
            <strong>{t('privacy.searchPrefsLabel')}</strong> {t('privacy.searchPrefs')}
          </li>
        </ul>

        <h2>{t('privacy.thirdPartyTitle')}</h2>
        <p>{t('privacy.thirdParty')}</p>

        <h2>{t('privacy.cookiesTitle')}</h2>
        <p>{t('privacy.cookies')}</p>

        <h2>{t('privacy.rightsTitle')}</h2>
        <p>{t('privacy.rights')}</p>

        <h2>{t('privacy.contactTitle')}</h2>
        <p>{t('privacy.contact', { email: CONTACT_EMAIL })}</p>

        <p>
          {t('common.seeAlsoOur')}{' '}
          <LocalizedLink to="/terms">{t('common.seeAlsoTerms')}</LocalizedLink>.
        </p>
      </article>
    </ContentPageLayout>
  );
}
