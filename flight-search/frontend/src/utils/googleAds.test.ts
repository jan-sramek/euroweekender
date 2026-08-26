import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  GOOGLE_ADS_PURCHASE_CURRENCY,
  GOOGLE_ADS_PURCHASE_SEND_TO,
  GOOGLE_ADS_PURCHASE_VALUE,
  trackGoogleAdsPurchase
} from './googleAds';

describe('trackGoogleAdsPurchase', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('no-ops when gtag is missing', () => {
    vi.stubGlobal('window', {});
    expect(() => trackGoogleAdsPurchase('tx-1')).not.toThrow();
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
});
