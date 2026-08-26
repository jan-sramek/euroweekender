/** Google Ads conversion action: Purchase (AW-1054133292). */
export const GOOGLE_ADS_PURCHASE_SEND_TO = 'AW-1054133292/eAHYCJLG_N4cEKyY0_YD';
export const GOOGLE_ADS_PURCHASE_VALUE = 1.0;
export const GOOGLE_ADS_PURCHASE_CURRENCY = 'CZK';

/**
 * Fire the Purchase conversion. Used on Book click-outs — this site has no
 * checkout thank-you page of its own.
 */
export function trackGoogleAdsPurchase(transactionId: string) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;

  window.gtag('event', 'conversion', {
    send_to: GOOGLE_ADS_PURCHASE_SEND_TO,
    value: GOOGLE_ADS_PURCHASE_VALUE,
    currency: GOOGLE_ADS_PURCHASE_CURRENCY,
    transaction_id: transactionId
  });
}
