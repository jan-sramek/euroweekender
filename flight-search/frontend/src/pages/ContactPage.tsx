import { useTranslation } from 'react-i18next';
import { CONTACT_EMAIL } from '../config/site';
import { IMAGES } from '../config/images';
import { usePageMeta } from '../hooks/usePageMeta';
import { ContentPageLayout } from '../layouts/ContentPageLayout';
import '../layouts/ContentPageLayout.css';

export function ContactPage() {
  const { t } = useTranslation();

  usePageMeta(t('meta.contact.title'), t('meta.contact.description'));

  return (
    <ContentPageLayout
      hero={{
        title: t('contact.heroTitle'),
        subtitle: t('contact.heroSubtitle'),
        image: IMAGES.heroContact,
        imageAlt: t('contact.heroImageAlt')
      }}
    >
      <article className="content-prose">
        <h1>{t('contact.heroTitle')}</h1>
        <p className="lead">{t('contact.lead')}</p>

        <div className="contact-card">
          <p>
            <strong>{t('contact.email')}</strong>
            <br />
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </p>
          <p>{t('contact.emailBody')}</p>
        </div>

        <h2>{t('contact.beforeTitle')}</h2>
        <ul>
          <li>{t('contact.before1')}</li>
          <li>{t('contact.before2')}</li>
          <li>{t('contact.before3')}</li>
        </ul>
      </article>
    </ContentPageLayout>
  );
}
