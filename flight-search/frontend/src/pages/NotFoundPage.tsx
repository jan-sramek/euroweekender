import { useTranslation } from 'react-i18next';
import { LocalizedLink } from '../components/LocalizedLink';
import { usePageMeta } from '../hooks/usePageMeta';
import { ContentPageLayout } from '../layouts/ContentPageLayout';

export function NotFoundPage() {
  const { t } = useTranslation();

  usePageMeta(t('meta.notFound.title'), t('meta.notFound.description'), '/', {
    noindex: true
  });

  return (
    <ContentPageLayout>
      <article className="content-prose">
        <h1>{t('notFound.title')}</h1>
        <p className="lead">{t('notFound.lead')}</p>
        <p>
          <LocalizedLink to="/">{t('notFound.backHome')}</LocalizedLink>
        </p>
      </article>
    </ContentPageLayout>
  );
}
