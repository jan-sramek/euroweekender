/** Google Ads conversion action: Begin checkout (AW-1054133292). */
export const GOOGLE_ADS_BEGIN_CHECKOUT_SEND_TO = 'AW-1054133292/B6YxCJ74segcEKyY0_YD';
/** Google Ads conversion action: Purchase (AW-1054133292). */
export const GOOGLE_ADS_PURCHASE_SEND_TO = 'AW-1054133292/eAHYCJLG_N4cEKyY0_YD';
export const GOOGLE_ADS_PURCHASE_VALUE = 1.0;
export const GOOGLE_ADS_PURCHASE_CURRENCY = 'CZK';

function gtagEvent(params: Record<string, unknown>) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', 'conversion', params);
}

/**
 * Fire the Begin checkout conversion. Book opens Kiwi in a new tab, so there is
 * no same-page redirect callback — the ping is not lost on navigation.
 */
export function trackGoogleAdsBeginCheckout() {
  gtagEvent({ send_to: GOOGLE_ADS_BEGIN_CHECKOUT_SEND_TO });
}

/**
 * Fire the Purchase conversion. Used on Book click-outs — this site has no
 * checkout thank-you page of its own.
 */
export function trackGoogleAdsPurchase(transactionId: string) {
  gtagEvent({
    send_to: GOOGLE_ADS_PURCHASE_SEND_TO,
    value: GOOGLE_ADS_PURCHASE_VALUE,
    currency: GOOGLE_ADS_PURCHASE_CURRENCY,
    transaction_id: transactionId
  });
}

/** Both funnel conversions for a Book click-out. */
export function trackGoogleAdsBookingClick(transactionId: string) {
  trackGoogleAdsBeginCheckout();
  trackGoogleAdsPurchase(transactionId);
}
