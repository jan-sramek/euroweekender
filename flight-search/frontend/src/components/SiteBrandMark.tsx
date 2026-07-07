import './SiteBrand.css';

interface SiteBrandMarkProps {
  className?: string;
  title?: string;
}

export function SiteBrandMark({ className, title = 'EuroWeekender' }: SiteBrandMarkProps) {
  return (
    <img
      className={['site-brand-mark', className].filter(Boolean).join(' ')}
      src="/logo-icon.png"
      width={40}
      height={40}
      alt={title}
      decoding="async"
    />
  );
}
