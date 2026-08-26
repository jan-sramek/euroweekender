import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  GOOGLE_ADS_BEGIN_CHECKOUT_SEND_TO,
  GOOGLE_ADS_PURCHASE_CURRENCY,
  GOOGLE_ADS_PURCHASE_SEND_TO,
  GOOGLE_ADS_PURCHASE_VALUE,
  trackGoogleAdsBeginCheckout,
  trackGoogleAdsBookingClick,
  trackGoogleAdsPurchase
} from './googleAds';

describe('Google Ads conversions', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('no-ops when gtag is missing', () => {
    vi.stubGlobal('window', {});
    expect(() => trackGoogleAdsBookingClick('tx-1')).not.toThrow();
  });

  it('sends the Begin checkout conversion', () => {
    const gtag = vi.fn();
    vi.stubGlobal('window', { gtag });

    trackGoogleAdsBeginCheckout();

    expect(gtag).toHaveBeenCalledWith('event', 'conversion', {
      send_to: GOOGLE_ADS_BEGIN_CHECKOUT_SEND_TO
    });
  });

  it('sends the Purchase conversion with the given transaction id', () => {
    const gtag = vi.fn();
    vi.stubGlobal('window', { gtag });

    trackGoogleAdsPurchase('tx-42');

    expect(gtag).toHaveBeenCalledWith('event', 'conversion', {
      send_to: GOOGLE_ADS_PURCHASE_SEND_TO,
      value: GOOGLE_ADS_PURCHASE_VALUE,
      currency: GOOGLE_ADS_PURCHASE_CURRENCY,
      transaction_id: 'tx-42'
    });
  });

  it('sends Begin checkout then Purchase on a Book click', () => {
    const gtag = vi.fn();
    vi.stubGlobal('window', { gtag });

    trackGoogleAdsBookingClick('tx-42');

    expect(gtag).toHaveBeenNthCalledWith(1, 'event', 'conversion', {
      send_to: GOOGLE_ADS_BEGIN_CHECKOUT_SEND_TO
    });
    expect(gtag).toHaveBeenNthCalledWith(2, 'event', 'conversion', {
      send_to: GOOGLE_ADS_PURCHASE_SEND_TO,
      value: GOOGLE_ADS_PURCHASE_VALUE,
      currency: GOOGLE_ADS_PURCHASE_CURRENCY,
      transaction_id: 'tx-42'
    });
  });
});
