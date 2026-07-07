export const UMAMI_SCRIPT_URL = import.meta.env.VITE_UMAMI_SCRIPT_URL?.trim() ?? '';
export const UMAMI_WEBSITE_ID = import.meta.env.VITE_UMAMI_WEBSITE_ID?.trim() ?? '';

export const isUmamiEnabled = UMAMI_SCRIPT_URL.length > 0 && UMAMI_WEBSITE_ID.length > 0;
