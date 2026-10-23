import type { GpsLocation, PunchType } from '@/types/web-punch';

export const PUNCH_LABELS: Record<PunchType, string> = { in: 'Clock in', out: 'Clock out', break_start: 'Start break', break_end: 'End break' };
export function punchLabel(type: string) { return PUNCH_LABELS[type as PunchType] ?? type.replaceAll('_', ' '); }

export function acquireLocation(): Promise<GpsLocation> {
  return new Promise((resolve, reject) => {
    if (!window.isSecureContext) { reject(new Error('Location access requires HTTPS or localhost.')); return; }
    if (!navigator.geolocation) { reject(new Error('Your browser does not support location access.')); return; }
    navigator.geolocation.getCurrentPosition(position => {
      const { latitude: lat, longitude: lng, accuracy: accuracy_meters } = position.coords;
      if (![lat, lng, accuracy_meters].every(Number.isFinite) || Math.abs(lat) > 90 || Math.abs(lng) > 180 || accuracy_meters < 0 || accuracy_meters > 99999.99) {
        reject(new Error('The location reading is invalid or too imprecise. Please try again.')); return;
      }
      resolve({ lat, lng, accuracy_meters, capturedAt: position.timestamp });
    }, error => {
      reject(new Error(error.code === 1 ? 'Location permission was denied. Allow location access in your browser and try again.' : error.code === 2 ? 'Your location is unavailable. Check your device location settings and try again.' : 'Location capture timed out. Try again near a window or outdoors.'));
    }, { enableHighAccuracy: true, timeout: 20_000, maximumAge: 0 });
  });
}

export function companyDate(timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  return ['year', 'month', 'day'].map(type => parts.find(part => part.type === type)?.value).join('-');
}
