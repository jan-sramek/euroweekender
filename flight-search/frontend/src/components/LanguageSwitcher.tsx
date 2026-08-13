import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { LOCALES, type LocaleCode } from '../config/locales';
import {
  beginLanguageSwitch,
  endLanguageSwitch,
  useCityNameLoading
} from '../hooks/useCityNameLoading';
import { useLocale } from '../hooks/useLocale';
import { LoadingIndicator } from './LoadingIndicator';
import './LanguageSwitcher.css';

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const urlLocale = useLocale();
  const { namesLoading, pendingLocale, busy } = useCityNameLoading();
  const [open, setOpen] = useState(false);
  const sawPriorityLoad = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const displayLocale = pendingLocale ?? urlLocale;
  const current = LOCALES.find(locale => locale.code === displayLocale) ?? LOCALES[0];

  useEffect(() => {
    if (namesLoading) sawPriorityLoad.current = true;
  }, [namesLoading]);

  useEffect(() => {
    if (!pendingLocale || urlLocale !== pendingLocale) return;
    if (namesLoading) return;
    const waitMs = sawPriorityLoad.current ? 150 : 600;
    const timer = window.setTimeout(() => {
      sawPriorityLoad.current = false;
      endLanguageSwitch();
    }, waitMs);
    return () => window.clearTimeout(timer);
  }, [namesLoading, pendingLocale, urlLocale]);

  const selectLocale = (nextLocale: LocaleCode) => {
    if (nextLocale === urlLocale) {
      setOpen(false);
      return;
    }

    const segments = location.pathname.split('/').filter(Boolean);
    const rest = isLocaleInPath(segments[0]) ? segments.slice(1) : segments;
    const nextPath = `/${nextLocale}${rest.length ? `/${rest.join('/')}` : ''}${location.search}${location.hash}`;
    sawPriorityLoad.current = false;
    beginLanguageSwitch(nextLocale);
    setOpen(false);
    void i18n.changeLanguage(nextLocale);
    navigate(nextPath);
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
        className={`language-switcher-trigger${open ? ' language-switcher-trigger-open' : ''}${busy ? ' language-switcher-trigger-busy' : ''}`}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-busy={busy}
        aria-label={busy ? t('common.changingLanguage') : t('common.language')}
        onClick={() => {
          if (busy) return;
          setOpen(prev => !prev);
        }}
      >
        <span className="language-flag" aria-hidden="true">
          <img
            className="language-flag-img"
            src={`https://flagcdn.com/w40/${current.flagCode}.png`}
            srcSet={`https://flagcdn.com/w80/${current.flagCode}.png 2x`}
            width={20}
            height={15}
            alt=""
            loading="lazy"
            decoding="async"
          />
        </span>
        <span className="language-trigger-label">{current.nativeLabel}</span>
        <span className="language-trigger-code">{current.code.toUpperCase()}</span>
        {busy ? (
          <LoadingIndicator size="sm" className="language-switcher-spinner" />
        ) : (
          <span className="language-chevron" aria-hidden="true" />
        )}
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
                    <img
                      className="language-flag-img"
                      src={`https://flagcdn.com/w40/${locale.flagCode}.png`}
                      srcSet={`https://flagcdn.com/w80/${locale.flagCode}.png 2x`}
                      width={20}
                      height={15}
                      alt=""
                      loading="lazy"
                      decoding="async"
                    />
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
