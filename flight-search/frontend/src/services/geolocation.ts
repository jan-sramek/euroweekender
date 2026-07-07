export interface GeoPosition {
  latitude: number;
  longitude: number;
}

export function getCurrentPosition(): Promise<GeoPosition | null> {
  if (!navigator.geolocation) {
    return Promise.resolve(null);
  }

  return new Promise(resolve => {
    navigator.geolocation.getCurrentPosition(
      position =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  });
}
