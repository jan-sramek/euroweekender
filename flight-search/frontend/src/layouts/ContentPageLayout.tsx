import { AppHeader } from '../components/AppHeader';
import { PageHero } from '../components/PageHero';
import { SiteFooter } from '../components/SiteFooter';
import './ContentPageLayout.css';

interface ContentPageLayoutProps {
  children: React.ReactNode;
  hero?: {
    title: string;
    subtitle?: string;
    image: string;
    imageAlt: string;
  };
  wide?: boolean;
}

export function ContentPageLayout({ children, hero, wide }: ContentPageLayoutProps) {
  return (
    <>
      <AppHeader />
      {hero ? <PageHero {...hero} /> : null}
      <main className={`content-page${hero ? ' content-page--with-hero' : ''}`}>
        <div className={`container content-page-inner${wide ? ' content-page-inner--wide' : ''}`}>
          {children}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
