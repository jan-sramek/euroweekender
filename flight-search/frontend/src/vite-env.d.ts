/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_UMAMI_SCRIPT_URL?: string;
  readonly VITE_UMAMI_WEBSITE_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  umami?: {
    track: (
      event?: string | ((props: Record<string, string>) => Record<string, string>),
      data?: Record<string, string | number | boolean>
    ) => void;
  };
}
