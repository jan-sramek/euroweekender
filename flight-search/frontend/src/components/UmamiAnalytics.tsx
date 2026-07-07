import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { isUmamiEnabled, UMAMI_SCRIPT_URL, UMAMI_WEBSITE_ID } from '../config/analytics';

function trackPageView(path: string) {
  window.umami?.track(props => ({
    ...props,
    url: path
  }));
}

export function UmamiAnalytics() {
  const location = useLocation();
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    if (!isUmamiEnabled) return;

    if (document.querySelector('script[data-website-id]')) {
      setScriptReady(true);
      return;
    }

    const script = document.createElement('script');
    script.src = UMAMI_SCRIPT_URL;
    script.defer = true;
    script.setAttribute('data-website-id', UMAMI_WEBSITE_ID);
    script.setAttribute('data-auto-track', 'false');
    script.onload = () => setScriptReady(true);
    document.head.appendChild(script);

    return () => {
      script.remove();
      setScriptReady(false);
    };
  }, []);

  useEffect(() => {
    if (!isUmamiEnabled || !scriptReady) return;
    trackPageView(`${location.pathname}${location.search}`);
  }, [location, scriptReady]);

  return null;
}
