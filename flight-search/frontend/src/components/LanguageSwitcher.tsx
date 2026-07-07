import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { LOCALES, type LocaleCode } from '../config/locales';
import './LanguageSwitcher.css';

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const current = LOCALES.find(locale => locale.code === i18n.language) ?? LOCALES[0];

  const selectLocale = (nextLocale: LocaleCode) => {
    const segments = location.pathname.split('/').filter(Boolean);
    const rest = isLocaleInPath(segments[0]) ? segments.slice(1) : segments;
    const nextPath = `/${nextLocale}${rest.length ? `/${rest.join('/')}` : ''}${location.search}${location.hash}`;
    void i18n.changeLanguage(nextLocale);
    navigate(nextPath);
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className="language-switcher" ref={rootRef}>
      <button
        type="button"
        className={`language-switcher-trigger${open ? ' language-switcher-trigger-open' : ''}`}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={t('common.language')}
        onClick={() => setOpen(prev => !prev)}
      >
        <span className="language-flag" aria-hidden="true">
          {current.flag}
        </span>
        <span className="language-trigger-label">{current.nativeLabel}</span>
        <span className="language-trigger-code">{current.code.toUpperCase()}</span>
        <span className="language-chevron" aria-hidden="true" />
      </button>

      {open ? (
        <ul className="language-menu" role="listbox" aria-label={t('common.language')}>
          {LOCALES.map(locale => {
            const active = locale.code === current.code;
            return (
              <li key={locale.code} role="presentation">
                <button
                  type="button"
                  className={`language-menu-item${active ? ' language-menu-item-active' : ''}`}
                  role="option"
                  aria-selected={active}
                  onClick={() => selectLocale(locale.code)}
                >
                  <span className="language-flag" aria-hidden="true">
                    {locale.flag}
                  </span>
                  <span className="language-menu-text">
                    <span className="language-menu-native">{locale.nativeLabel}</span>
                    {locale.nativeLabel !== locale.label ? (
                      <span className="language-menu-sub">{locale.label}</span>
                    ) : null}
                  </span>
                  {active ? <span className="language-menu-check" aria-hidden="true" /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function isLocaleInPath(value: string | undefined) {
  return LOCALES.some(locale => locale.code === value);
}
