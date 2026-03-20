'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface StationPin {
  id: string;
  name: string;
  slug: string;
  county: string;
  address: string;
  phone?: string;
  custodySuite?: boolean;
  lat?: number;
  lng?: number;
}

interface StationMapProps {
  stations: StationPin[];
  selectedStation: StationPin | null;
  onSelectStation: (station: StationPin) => void;
}

const GOLD = '#facc15';
const NAVY = '#2563eb';
const UK_CENTER: [number, number] = [52.5, -1.5];
const UK_ZOOM = 6;

function createIcon(selected: boolean) {
  const color = selected ? GOLD : NAVY;
  const size = selected ? 14 : 10;
  return L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.3);"></div>`,
  });
}

export function StationMap({ stations, selectedStation, onSelectStation }: StationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: UK_CENTER,
      zoom: UK_ZOOM,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current.clear();

    const geoStations = stations.filter((s) => s.lat && s.lng);

    geoStations.forEach((station) => {
      const marker = L.marker([station.lat!, station.lng!], {
        icon: createIcon(selectedStation?.id === station.id),
      });

      marker.bindTooltip(station.name, {
        direction: 'top',
        offset: [0, -8],
        className: 'station-tooltip',
      });

      marker.on('click', () => onSelectStation(station));
      marker.addTo(map);
      markersRef.current.set(station.id, marker);
    });
  }, [stations, selectedStation, onSelectStation]);

  useEffect(() => {
    if (!selectedStation?.lat || !selectedStation?.lng || !mapRef.current) return;
    mapRef.current.flyTo([selectedStation.lat, selectedStation.lng], 12, { duration: 0.8 });
  }, [selectedStation]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[var(--radius-lg)]">
      <div ref={containerRef} className="h-full w-full" style={{ minHeight: 500 }} />
      <style jsx global>{`
        .station-tooltip {
          background: ${NAVY};
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 4px 10px;
          font-size: 12px;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(0,0,0,.2);
        }
        .station-tooltip::before {
          border-top-color: ${NAVY} !important;
        }
      `}</style>
    </div>
  );
}
