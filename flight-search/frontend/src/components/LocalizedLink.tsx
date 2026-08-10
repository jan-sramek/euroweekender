import {
  Link,
  NavLink,
  useLocation,
  type LinkProps,
  type NavLinkProps
} from 'react-router-dom';
import { useLocalizedPath } from '../hooks/useLocale';

/** nginx serves locale homes as `/en/` while client links use `/en`. */
function stripTrailingSlash(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

function pathIsActive(pathname: string, target: string, end?: boolean): boolean {
  const current = stripTrailingSlash(pathname);
  const dest = stripTrailingSlash(target);
  if (end) return current === dest;
  return current === dest || current.startsWith(`${dest}/`);
}

export function LocalizedLink({ to, ...props }: LinkProps & { to: string }) {
  const { path } = useLocalizedPath();
  return <Link to={path(to)} {...props} />;
}

export function LocalizedNavLink({
  to,
  end,
  className,
  ...props
}: NavLinkProps & { to: string }) {
  const { path } = useLocalizedPath();
  const location = useLocation();
  const target = path(to);
  const isActive = pathIsActive(location.pathname, target, end);

  return (
    <NavLink
      to={target}
      end={end}
      aria-current={isActive ? 'page' : undefined}
      className={({ isPending, isTransitioning }) => {
        if (typeof className === 'function') {
          return className({ isActive, isPending, isTransitioning });
        }
        return [className, isActive ? 'active' : null].filter(Boolean).join(' ') || undefined;
      }}
      {...props}
    />
  );
}
