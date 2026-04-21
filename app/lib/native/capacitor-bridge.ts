'use client';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isNative = (): boolean =>
  typeof window !== 'undefined' &&
  (window as any)?.Capacitor?.isNativePlatform?.() === true;

export async function getNativeGeolocation() {
  if (!isNative()) return null;
  const { Geolocation } = await import('@capacitor/geolocation');
  return Geolocation;
}

export async function getNativeHaptics() {
  if (!isNative()) return null;
  const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
  return { Haptics, ImpactStyle };
}

export async function getNativeNetwork() {
  if (!isNative()) return null;
  const { Network } = await import('@capacitor/network');
  return Network;
}
