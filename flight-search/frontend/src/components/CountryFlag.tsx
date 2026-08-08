import { countryFlagCode } from '../utils/countryFlag';

interface CountryFlagProps {
  country: string;
  className?: string;
}

export function CountryFlag({ country, className = 'country-flag' }: CountryFlagProps) {
  const code = countryFlagCode(country);
  if (!code) return null;

  return (
    <span className={className} aria-hidden="true">
      <img
        className={`${className}-img`}
        src={`https://flagcdn.com/w40/${code}.png`}
        srcSet={`https://flagcdn.com/w80/${code}.png 2x`}
        width={20}
        height={15}
        alt=""
        loading="lazy"
        decoding="async"
      />
    </span>
  );
}
