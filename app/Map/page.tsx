'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const StationMap = dynamic(
  () => import('@/components/StationMap').then((m) => m.StationMap),
  { ssr: false, loading: () => <MapSkeleton /> },
);

function MapSkeleton() {
  return (
    <div className="flex min-h-[500px] items-center justify-center rounded-[var(--radius-lg)] bg-gradient-to-br from-slate-50 to-slate-100">
      <p className="text-sm font-medium text-[var(--muted)]">Loading map...</p>
    </div>
  );
}

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

export default function MapPage() {
  const [stations, setStations] = useState<StationPin[]>([]);
  const [selectedStation, setSelectedStation] = useState<StationPin | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stations')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load');
        return res.json();
      })
      .then((data) => {
        setStations(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const handleSelect = useCallback((station: StationPin) => {
    setSelectedStation(station);
  }, []);

  const filtered = searchQuery
    ? stations.filter(
        (s) =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.county.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.address.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : stations;

  const geoCount = filtered.filter((s) => s.lat && s.lng).length;

  const grouped = filtered.reduce<Record<string, StationPin[]>>((acc, station) => {
    if (!acc[station.county]) acc[station.county] = [];
    acc[station.county].push(station);
    return acc;
  }, {});

  const sortedCounties = Object.keys(grouped).sort();

  return (
    <>
      <section className="bg-[var(--navy)] py-10 sm:py-12">
        <div className="page-container !py-0">
          <nav className="mb-3 text-sm text-slate-400">
            <Link href="/" className="text-[var(--gold)] no-underline hover:text-[var(--gold-hover)]">Home</Link>
            <span className="mx-2">&rsaquo;</span>
            <span className="text-white">Station Map</span>
          </nav>
          <h1 className="text-h1 text-white">Interactive Station Map</h1>
          <p className="mt-3 max-w-2xl text-lg text-slate-300">
            Browse {stations.length > 0 ? stations.length : ''} police stations across England &amp; Wales.
            Click a pin to see details and find covering representatives.
          </p>
        </div>
      </section>

      <div className="page-container">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <input
              type="text"
              placeholder="Search stations by name, county, or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-white px-4 py-3.5 text-sm text-[var(--navy)] shadow-[var(--card-shadow)] placeholder:text-[var(--muted)] focus:border-[var(--gold)] focus:outline-none focus:ring-2 focus:ring-[var(--gold)]/20 sm:max-w-lg"
            />
            <p className="shrink-0 text-sm text-[var(--muted)]">
              {geoCount} mapped &middot; {filtered.length} total
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--card-border)] shadow-[var(--card-shadow)]" style={{ minHeight: 500 }}>
              <StationMap
                stations={filtered}
                selectedStation={selectedStation}
                onSelectStation={handleSelect}
              />
            </div>

            <div className="rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-white shadow-[var(--card-shadow)]">
              <div className="rounded-t-[var(--radius-lg)] border-b border-[var(--border)] bg-[var(--navy)] px-4 py-3">
                <h2 className="text-sm font-bold text-white">
                  Stations <span className="ml-1 text-[var(--gold)]">({filtered.length})</span>
                </h2>
              </div>
              <div className="max-h-[500px] overflow-y-auto">
                {loading ? (
                  <p className="p-4 text-sm text-[var(--muted)]">Loading stations...</p>
                ) : sortedCounties.length === 0 ? (
                  <p className="p-4 text-sm text-[var(--muted)]">No stations found.</p>
                ) : (
                  sortedCounties.map((county) => (
                    <div key={county}>
                      <h3 className="sticky top-0 border-b border-[var(--border)] bg-[var(--gold-pale)] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[var(--navy)]">
                        {county} ({grouped[county].length})
                      </h3>
                      {grouped[county].map((station) => (
                        <button
                          key={station.id}
                          onClick={() => handleSelect(station)}
                          className={`w-full border-b border-[var(--border)]/50 px-4 py-3 text-left text-sm transition-colors hover:bg-[var(--gold-pale)] ${
                            selectedStation?.id === station.id ? 'bg-[var(--gold-pale)]' : ''
                          }`}
                        >
                          <p className="font-semibold text-[var(--navy)]">
                            {station.name}
                            {station.lat && station.lng && (
                              <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-green-500" title="Has map pin" />
                            )}
                          </p>
                          <p className="mt-0.5 text-xs text-[var(--muted)]">{station.address}</p>
                        </button>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {selectedStation && (
            <div className="mt-6 rounded-[var(--radius-lg)] border border-[var(--card-border)] bg-white p-6 shadow-[var(--card-shadow)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-[var(--navy)]">
                    {selectedStation.name}
                  </h2>
                  <p className="mt-1 text-sm text-[var(--gold-hover)]">{selectedStation.county}</p>
                  <p className="mt-2 text-sm text-[var(--muted)]">{selectedStation.address}</p>
                  {selectedStation.phone && (
                    <p className="mt-2">
                      <a
                        href={`tel:${selectedStation.phone.replace(/\s/g, '')}`}
                        className="text-sm font-semibold text-[var(--gold-hover)] no-underline hover:text-[var(--gold)]"
                      >
                        📞 {selectedStation.phone}
                      </a>
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedStation(null)}
                  className="text-[var(--muted)] hover:text-[var(--navy)]"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href={`/police-station/${selectedStation.slug}`} className="btn-gold !text-sm">
                  View Station Details
                </Link>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedStation.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline !text-sm"
                >
                  Get Directions
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
