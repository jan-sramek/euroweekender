import './PageHero.css';

interface PageHeroProps {
  title: string;
  subtitle?: string;
  image: string;
  imageAlt: string;
}

export function PageHero({ title, subtitle, image, imageAlt }: PageHeroProps) {
  return (
    <section
      className="page-hero"
      style={{ backgroundImage: `url(${image})` }}
      aria-label={imageAlt}
    >
      <div className="page-hero-overlay">
        <div className="container page-hero-inner">
          <h1>{title}</h1>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
      </div>
    </section>
  );
}
