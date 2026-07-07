import './MediaSection.css';

interface MediaSectionProps {
  title: string;
  image: string;
  imageAlt: string;
  reverse?: boolean;
  children: React.ReactNode;
}

export function MediaSection({ title, image, imageAlt, reverse, children }: MediaSectionProps) {
  return (
    <section className={`media-section${reverse ? ' media-section--reverse' : ''}`}>
      <div className="media-section-image">
        <img src={image} alt={imageAlt} loading="lazy" />
      </div>
      <div className="media-section-copy">
        <h2>{title}</h2>
        {children}
      </div>
    </section>
  );
}
