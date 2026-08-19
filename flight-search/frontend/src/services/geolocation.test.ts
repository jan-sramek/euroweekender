import { afterEach, describe, expect, it, vi } from 'vitest';
import { getCurrentPosition, getIpPosition, resolveUserPosition } from './geolocation';

function stubNavigator(geolocation: Geolocation | undefined, permissionState?: PermissionState) {
  const permissions = permissionState
    ? {
        query: vi.fn().mockResolvedValue({ state: permissionState })
      }
    : undefined;

  vi.stubGlobal('navigator', {
    geolocation,
    permissions
  });
}

describe('getCurrentPosition', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('returns coordinates from the browser Geolocation API', async () => {
    stubNavigator({
      getCurrentPosition: (success: PositionCallback) => {
        success({
          coords: { latitude: 49.8209, longitude: 18.2625 }
        } as GeolocationPosition);
      }
    } as Geolocation);

    await expect(getCurrentPosition()).resolves.toEqual({
      latitude: 49.8209,
      longitude: 18.2625
    });
  });

  it('returns null when permission is denied', async () => {
    const getCurrentPositionMock = vi.fn();
    stubNavigator(
      {
        getCurrentPosition: getCurrentPositionMock
      } as unknown as Geolocation,
      'denied'
    );

    await expect(getCurrentPosition()).resolves.toBeNull();
    expect(getCurrentPositionMock).not.toHaveBeenCalled();
  });

  it('returns null when geolocation is missing', async () => {
    stubNavigator(undefined);
    await expect(getCurrentPosition()).resolves.toBeNull();
  });

  it('returns null for a 0,0 fix', async () => {
    stubNavigator({
      getCurrentPosition: (success: PositionCallback) => {
        success({
          coords: { latitude: 0, longitude: 0 }
        } as GeolocationPosition);
      }
    } as Geolocation);

    await expect(getCurrentPosition()).resolves.toBeNull();
  });
});

describe('IP fallback', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('reads coordinates from /api/geo/ip', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ latitude: 49.8346, longitude: 18.2928 })
      })
    );

    await expect(getIpPosition()).resolves.toEqual({
      latitude: 49.8346,
      longitude: 18.2928
    });
  });

  it('prefers GPS over IP', async () => {
    stubNavigator({
      getCurrentPosition: (success: PositionCallback) => {
        success({
          coords: { latitude: 49.8209, longitude: 18.2625 }
        } as GeolocationPosition);
      }
    } as Geolocation);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ latitude: 50.0755, longitude: 14.4378 })
      })
    );

    await expect(resolveUserPosition()).resolves.toEqual({
      latitude: 49.8209,
      longitude: 18.2625
    });
  });

  it('uses IP when GPS is unavailable', async () => {
    stubNavigator(undefined);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ latitude: 49.8346, longitude: 18.2928 })
      })
    );

    await expect(resolveUserPosition()).resolves.toEqual({
      latitude: 49.8346,
      longitude: 18.2928
    });
  });

  it('returns null when GPS and IP both fail', async () => {
    stubNavigator(undefined);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 204 }));

    await expect(resolveUserPosition()).resolves.toBeNull();
  });
});
