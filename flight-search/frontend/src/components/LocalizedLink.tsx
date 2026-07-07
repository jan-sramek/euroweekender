import { Link, NavLink, type LinkProps, type NavLinkProps } from 'react-router-dom';
import { useLocalizedPath } from '../hooks/useLocale';

export function LocalizedLink({ to, ...props }: LinkProps & { to: string }) {
  const { path } = useLocalizedPath();
  return <Link to={path(to)} {...props} />;
}

export function LocalizedNavLink({ to, ...props }: NavLinkProps & { to: string }) {
  const { path } = useLocalizedPath();
  return <NavLink to={path(to)} {...props} />;
}
