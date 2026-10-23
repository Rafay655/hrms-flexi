'use client';

import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';
import { AppLoader } from '@/components/ui/app-loader';
import type { GpsLocation } from '@/types/web-punch';
import type { TodayAttendance } from '@/types/attendance-timeline';

export default function LocationMap({ location, zone, compact = false }: { location: GpsLocation; zone: TodayAttendance['geofence']; compact?: boolean }) {
  const container = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'tiles-error' | 'error'>('loading');
  const { lat, lng, accuracy_meters: accuracy } = location;
  const zoneLat = zone?.lat, zoneLng = zone?.lng, radius = zone?.radius_meters;

  useEffect(() => {
    let disposed = false;
    let map: import('leaflet').Map | undefined;
    let tilesFailed = false;
    void import('leaflet').then(L => {
      if (disposed || !container.current) return;
      map = L.map(container.current, { scrollWheelZoom: false }).setView([lat, lng], 16);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>', maxZoom: 19,
      }).on('tileerror', () => {
        if (!disposed && !tilesFailed) {
          tilesFailed = true; setState('tiles-error');
          toast.error('Map tiles are unavailable. Your captured GPS coordinates are unchanged.', { id: 'punch-map-tiles' });
        }
      }).addTo(map);
      if (zoneLat != null && zoneLng != null && radius != null && Number.isFinite(Number(zoneLat)) && Number.isFinite(Number(zoneLng)) && Math.abs(Number(zoneLat)) <= 90 && Math.abs(Number(zoneLng)) <= 180 && Number.isFinite(radius) && radius >= 0) {
        L.circle([Number(zoneLat), Number(zoneLng)], { radius, color: '#5c5490', weight: 1.5, dashArray: '5 5', fillColor: '#5c5490', fillOpacity: 0.07 }).addTo(map);
      }
      L.circle([lat, lng], { radius: accuracy, color: '#EEC293', weight: 1, fillColor: '#EEC293', fillOpacity: 0.16 }).addTo(map);
      L.circleMarker([lat, lng], { radius: 8, color: '#ffffff', weight: 3, fillColor: '#322E53', fillOpacity: 1 }).bindTooltip('Your captured GPS location').addTo(map);
      requestAnimationFrame(() => { if (!disposed) map?.invalidateSize(); });
      setState('ready');
    }).catch(() => {
      if (!disposed) {
        setState('error');
        toast.error('The map could not load. Your GPS coordinates are still available.', { id: 'punch-map-error' });
      }
    });
    return () => { disposed = true; map?.remove(); };
  }, [lat, lng, accuracy, zoneLat, zoneLng, radius]);

  return <div className="relative isolate overflow-hidden rounded-xl border border-brand-600/10">
    <div ref={container} aria-label="Map of your captured GPS location" className={compact ? 'z-0 h-44 w-full bg-brand-100' : 'z-0 h-56 w-full bg-brand-100 sm:h-64'} />
    {state === 'loading' && <div className="absolute inset-0 z-[500] bg-white/85"><AppLoader label="Loading map…" className="h-full" /></div>}
    {state === 'error' && <div className="absolute inset-0 z-[500] flex items-center justify-center bg-brand-100 p-6 text-center text-xs text-brand-700">Map preview unavailable</div>}
  </div>;
}
