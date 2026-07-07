import './ImageCard.css';

interface ImageCardProps {
  title: string;
  image: string;
  imageAlt: string;
  children: React.ReactNode;
}

export function ImageCard({ title, image, imageAlt, children }: ImageCardProps) {
  return (
    <article className="image-card">
      <div className="image-card-media">
        <img src={image} alt={imageAlt} loading="lazy" />
      </div>
      <div className="image-card-body">
        <h2>{title}</h2>
        {children}
      </div>
    </article>
  );
}
