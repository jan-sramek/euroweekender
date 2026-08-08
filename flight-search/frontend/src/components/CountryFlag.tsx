import { countryFlagCode } from '../utils/countryFlag';

interface CountryFlagProps {
  country: string;
  className?: string;
  size?: 'sm' | 'lg';
}

export function CountryFlag({ country, className, size = 'sm' }: CountryFlagProps) {
  const code = countryFlagCode(country);
  if (!code) return null;

  const sizeClass = size === 'lg' ? 'country-flag-lg' : '';

  return (
    <span className={['country-flag', sizeClass, className].filter(Boolean).join(' ')} aria-hidden="true">
      <img
        className="country-flag-img"
        src={`https://flagcdn.com/w40/${code}.png`}
        srcSet={`https://flagcdn.com/w80/${code}.png 2x`}
        width={size === 'lg' ? 28 : 20}
        height={size === 'lg' ? 21 : 15}
        alt=""
        loading="lazy"
        decoding="async"
      />
    </span>
  );
}
