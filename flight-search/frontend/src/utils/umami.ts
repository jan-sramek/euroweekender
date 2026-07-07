import { isUmamiEnabled } from '../config/analytics';

export function trackUmamiEvent(name: string, data?: Record<string, string | number | boolean>) {
  if (!isUmamiEnabled) return;
  window.umami?.track(name, data);
}
