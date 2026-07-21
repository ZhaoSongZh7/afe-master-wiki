'use client';

import { useMemo, useState } from 'react';
import { HIKES, SEATTLE, type Difficulty, type Hike } from '@/lib/seattle-hikes-data';

/**
 * Seattle Hikes — interactive data table with:
 *  - sort + filter (difficulty, drive time, dog-friendly)
 *  - live SVG scatter chart (distance vs. elevation)
 *  - optional geolocation: "Use my location" estimates drive time/distance from
 *    the user and enables a "nearest to me" sort
 *  - per-hike map (OpenStreetMap embed) + directions link
 *
 * Dependency-free: chart is hand-rolled SVG, the map is an OSM <iframe>, and
 * directions open the user's native maps app via a URL — no npm packages, no
 * API keys, so nothing can break the Vercel install.
 */

const ORANGE = 'var(--relay-signal)';
const BLUE = 'var(--relay-brand-ink)';

// Difficulty maps to the Field Guide accent tokens (positive/highlight/signal).
const diffColor: Record<Difficulty, string> = {
  Easy: 'var(--relay-positive)',
  Moderate: 'var(--relay-highlight)',
  Hard: 'var(--relay-signal)',
};

/** Great-circle distance in miles (haversine). */
function haversineMiles(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 3958.8; // earth radius, miles
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

/**
 * Estimate driving minutes from straight-line miles. Roads aren't straight and
 * mountain approaches are slow, so we apply a winding factor (1.35x) and an
 * average effective speed of ~45 mph. This is a rough estimate, clearly labeled.
 */
function estimateDriveMinutes(straightMiles: number): number {
  const roadMiles = straightMiles * 1.35;
  const avgMph = 45;
  return Math.round((roadMiles / avgMph) * 60);
}

type SortKey = 'name' | 'distance' | 'gain' | 'difficulty' | 'drive';
type Origin = { lat: number; lon: number; label: string };

export function SeattleHikes() {
  const [difficulty, setDifficulty] = useState<'All' | Difficulty>('All');
  const [maxDrive, setMaxDrive] = useState(180);
  const [dogOnly, setDogOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('drive');
  const [asc, setAsc] = useState(true);
  const [mapHike, setMapHike] = useState<Hike | null>(null);

  // location: default to Seattle; user can opt in to their real location
  const [origin, setOrigin] = useState<Origin>({ ...SEATTLE, label: 'Seattle (default)' });
  const [locState, setLocState] = useState<'idle' | 'loading' | 'granted' | 'denied'>('idle');

  const requestLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocState('denied');
      return;
    }
    setLocState('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOrigin({ lat: pos.coords.latitude, lon: pos.coords.longitude, label: 'your location' });
        setLocState('granted');
      },
      () => setLocState('denied'),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  };

  // attach computed distance/drive to each hike based on the current origin
  const withDistance = useMemo(
    () =>
      HIKES.map((h) => {
        const straight = h.lat && h.lon ? haversineMiles(origin.lat, origin.lon, h.lat, h.lon) : null;
        return {
          hike: h,
          straightMiles: straight,
          driveMin: straight != null ? estimateDriveMinutes(straight) : null,
        };
      }),
    [origin],
  );

  const filtered = useMemo(() => {
    const diffRank: Record<Difficulty, number> = { Easy: 0, Moderate: 1, Hard: 2 };
    return withDistance
      .filter(
        ({ hike, driveMin }) =>
          (difficulty === 'All' || hike.difficulty === difficulty) &&
          (driveMin == null || driveMin <= maxDrive) &&
          (!dogOnly || hike.dog),
      )
      .sort((a, b) => {
        let cmp = 0;
        if (sortKey === 'name') cmp = a.hike.name.localeCompare(b.hike.name);
        else if (sortKey === 'difficulty') cmp = diffRank[a.hike.difficulty] - diffRank[b.hike.difficulty];
        else if (sortKey === 'drive') cmp = (a.driveMin ?? 1e9) - (b.driveMin ?? 1e9);
        else cmp = (a.hike[sortKey] as number) - (b.hike[sortKey] as number);
        return asc ? cmp : -cmp;
      });
  }, [withDistance, difficulty, maxDrive, dogOnly, sortKey, asc]);

  const stats = useMemo(() => {
    if (filtered.length === 0) return null;
    const n = filtered.length;
    const avgDist = filtered.reduce((s, f) => s + f.hike.distance, 0) / n;
    const avgGain = filtered.reduce((s, f) => s + f.hike.gain, 0) / n;
    const withDrive = filtered.filter((f) => f.driveMin != null);
    const closest = withDrive.length
      ? withDrive.reduce((m, f) => ((f.driveMin ?? 1e9) < (m.driveMin ?? 1e9) ? f : m))
      : null;
    return { n, avgDist, avgGain, closest };
  }, [filtered]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setAsc((v) => !v);
    else {
      setSortKey(key);
      setAsc(true);
    }
  };
  const arrow = (key: SortKey) => (sortKey === key ? (asc ? ' ▲' : ' ▼') : '');

  return (
    <div className="not-prose my-6">
      {/* Location bar */}
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-fd-border bg-fd-card p-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-fd-foreground">
            Drive times estimated from <span style={{ color: ORANGE }}>{origin.label}</span>
          </p>
          <p className="text-xs text-fd-muted-foreground">
            {locState === 'granted'
              ? 'Using your location. Estimates are approximate.'
              : locState === 'denied'
                ? 'Location unavailable — showing estimates from Seattle. You can still browse and open maps.'
                : 'Share your location to estimate drive time and find the closest trails.'}
          </p>
        </div>
        <button
          type="button"
          onClick={requestLocation}
          disabled={locState === 'loading'}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: ORANGE }}
        >
          {locState === 'loading' ? 'Locating…' : locState === 'granted' ? '✓ Using my location' : '📍 Use my location'}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-fd-border bg-fd-card p-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-fd-foreground">Difficulty</span>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as 'All' | Difficulty)}
            className="rounded-lg border border-fd-border bg-fd-background px-3 py-1.5 text-fd-foreground"
          >
            <option>All</option>
            <option>Easy</option>
            <option>Moderate</option>
            <option>Hard</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-fd-foreground">
            Max drive: <span style={{ color: ORANGE }}>{maxDrive} min</span>
          </span>
          <input
            type="range"
            min={15}
            max={240}
            step={15}
            value={maxDrive}
            onChange={(e) => setMaxDrive(Number(e.target.value))}
            className="w-44 accent-relay-signal"
          />
        </label>

        <label className="flex items-center gap-2 text-sm text-fd-foreground">
          <input
            type="checkbox"
            checked={dogOnly}
            onChange={(e) => setDogOnly(e.target.checked)}
            className="size-4 accent-relay-signal"
          />
          Dog-friendly only
        </label>

        <span className="ml-auto self-center text-sm text-fd-muted-foreground">
          {filtered.length} of {HIKES.length} trails
        </span>
      </div>

      {/* Stats + chart */}
      {stats && (
        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1.4fr]">
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Trails shown" value={String(stats.n)} />
            <Stat label="Avg distance" value={`${stats.avgDist.toFixed(1)} mi`} />
            <Stat label="Avg elev. gain" value={`${Math.round(stats.avgGain).toLocaleString()} ft`} />
            <Stat
              label="Closest"
              value={stats.closest?.driveMin != null ? `~${stats.closest.driveMin} min` : '—'}
              sub={stats.closest?.hike.name}
            />
          </div>
          <ScatterChart hikes={filtered.map((f) => f.hike)} />
        </div>
      )}

      {/* Table */}
      <div className="mt-4 overflow-x-auto rounded-xl border border-fd-border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-fd-muted text-left">
              <Th onClick={() => toggleSort('name')}>Trail{arrow('name')}</Th>
              <Th onClick={() => toggleSort('distance')} right>Distance{arrow('distance')}</Th>
              <Th onClick={() => toggleSort('gain')} right>Elev. gain{arrow('gain')}</Th>
              <Th onClick={() => toggleSort('difficulty')}>Difficulty{arrow('difficulty')}</Th>
              <Th onClick={() => toggleSort('drive')} right>~Drive{arrow('drive')}</Th>
              <th className="px-3 py-2 font-semibold text-fd-foreground">🐕</th>
              <th className="px-3 py-2 font-semibold text-fd-foreground">Map</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(({ hike: h, driveMin }) => (
              <tr key={h.name} className="border-t border-fd-border/60 hover:bg-fd-accent/40">
                <td className="px-3 py-2 font-medium">
                  <a
                    href={h.wtaUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-fd-foreground hover:underline"
                    style={{ textDecorationColor: ORANGE }}
                  >
                    {h.name}
                  </a>
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-fd-muted-foreground">{h.distance.toFixed(1)} mi</td>
                <td className="px-3 py-2 text-right tabular-nums text-fd-muted-foreground">{h.gain.toLocaleString()} ft</td>
                <td className="px-3 py-2">
                  <span
                    className="inline-block rounded-full px-2 py-0.5 text-xs font-medium text-white"
                    style={{ backgroundColor: diffColor[h.difficulty] }}
                  >
                    {h.difficulty}
                  </span>
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-fd-muted-foreground">
                  {driveMin != null ? `~${driveMin} min` : '—'}
                </td>
                <td className="px-3 py-2">{h.dog ? '✓' : '—'}</td>
                <td className="px-3 py-2">
                  {h.lat && h.lon ? (
                    <button
                      type="button"
                      onClick={() => setMapHike(h)}
                      className="rounded-md border border-fd-border px-2 py-1 text-xs font-medium hover:bg-fd-accent"
                      style={{ color: ORANGE }}
                    >
                      Map
                    </button>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-fd-muted-foreground">
                  {HIKES.length === 0
                    ? 'Hike data is loading — check back shortly.'
                    : 'No trails match these filters — try widening the drive time.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-fd-muted-foreground">
        Distances, elevation, and drive times are approximate and for planning only. Drive-time
        estimates are straight-line based and will differ from real routes. Verify current
        conditions, permits, and closures on{' '}
        <a href="https://www.wta.org" className="underline" style={{ color: ORANGE }} target="_blank" rel="noreferrer">
          WTA
        </a>{' '}
        before you go. Bring the 10 essentials.
      </p>

      {mapHike && <MapModal hike={mapHike} origin={origin} onClose={() => setMapHike(null)} />}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-fd-border bg-fd-card p-3">
      <p className="text-xs text-fd-muted-foreground">{label}</p>
      <p className="mt-0.5 text-lg font-bold" style={{ color: BLUE }}>
        <span className="dark:text-white">{value}</span>
      </p>
      {sub && <p className="truncate text-xs text-fd-muted-foreground">{sub}</p>}
    </div>
  );
}

function Th({ children, onClick, right }: { children: React.ReactNode; onClick: () => void; right?: boolean }) {
  return (
    <th className={`px-3 py-2 ${right ? 'text-right' : 'text-left'}`}>
      <button type="button" onClick={onClick} className="font-semibold text-fd-foreground hover:text-fd-primary">
        {children}
      </button>
    </th>
  );
}

/** Per-hike map: OpenStreetMap embed + directions link (native maps app). */
function MapModal({ hike, origin, onClose }: { hike: Hike; origin: Origin; onClose: () => void }) {
  const d = 0.04; // bbox half-size in degrees (~3mi)
  const bbox = `${hike.lon - d},${hike.lat - d},${hike.lon + d},${hike.lat + d}`;
  const osmSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${hike.lat},${hike.lon}`;
  const osmLink = `https://www.openstreetmap.org/?mlat=${hike.lat}&mlon=${hike.lon}#map=13/${hike.lat}/${hike.lon}`;
  // Directions from origin → trailhead (opens Google Maps; works on all platforms)
  const directions = `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lon}&destination=${hike.lat},${hike.lon}&travelmode=driving`;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-fd-border bg-fd-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-fd-border p-4">
          <div>
            <h3 className="font-semibold text-fd-foreground">{hike.name}</h3>
            <p className="text-xs text-fd-muted-foreground">
              {hike.region ? `${hike.region} · ` : ''}Trailhead {hike.lat.toFixed(4)}, {hike.lon.toFixed(4)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-sm text-fd-muted-foreground hover:bg-fd-accent"
          >
            Close ✕
          </button>
        </div>
        <iframe
          title={`Map of ${hike.name} trailhead`}
          src={osmSrc}
          className="h-72 w-full border-0"
          loading="lazy"
        />
        <div className="flex flex-wrap gap-2 p-4">
          <a
            href={directions}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            style={{ backgroundColor: ORANGE }}
          >
            Directions from {origin.label === 'your location' ? 'my location' : 'Seattle'} →
          </a>
          <a
            href={hike.wtaUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-fd-border px-4 py-2 text-sm font-medium text-fd-foreground hover:bg-fd-accent"
          >
            WTA trail page
          </a>
          <a
            href={osmLink}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-fd-border px-4 py-2 text-sm font-medium text-fd-foreground hover:bg-fd-accent"
          >
            Open in OpenStreetMap
          </a>
        </div>
      </div>
    </div>
  );
}

/** Hand-rolled SVG scatter: distance (x) vs. elevation gain (y), colored by difficulty. */
function ScatterChart({ hikes }: { hikes: Hike[] }) {
  const W = 360;
  const H = 200;
  const pad = { l: 44, r: 12, t: 12, b: 32 };
  const maxDist = Math.max(11, ...hikes.map((h) => h.distance));
  const maxGain = Math.max(4000, ...hikes.map((h) => h.gain));
  const x = (dist: number) => pad.l + (dist / maxDist) * (W - pad.l - pad.r);
  const y = (g: number) => H - pad.b - (g / maxGain) * (H - pad.t - pad.b);

  return (
    <div className="rounded-xl border border-fd-border bg-fd-card p-3">
      <p className="mb-1 text-sm font-medium text-fd-foreground">Distance vs. elevation gain</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Scatter plot of distance versus elevation gain">
        <line x1={pad.l} y1={H - pad.b} x2={W - pad.r} y2={H - pad.b} stroke="currentColor" className="text-fd-border" />
        <line x1={pad.l} y1={pad.t} x2={pad.l} y2={H - pad.b} stroke="currentColor" className="text-fd-border" />
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <g key={f}>
            <line x1={pad.l} y1={y(maxGain * f)} x2={W - pad.r} y2={y(maxGain * f)} stroke="currentColor" className="text-fd-border/40" />
            <text x={pad.l - 6} y={y(maxGain * f) + 3} textAnchor="end" className="fill-fd-muted-foreground text-[9px]">
              {Math.round((maxGain * f) / 100) / 10}k
            </text>
          </g>
        ))}
        {[0, 0.5, 1].map((f) => (
          <text key={f} x={x(maxDist * f)} y={H - pad.b + 14} textAnchor="middle" className="fill-fd-muted-foreground text-[9px]">
            {Math.round(maxDist * f)} mi
          </text>
        ))}
        {hikes.map((h) => (
          <circle key={h.name} cx={x(h.distance)} cy={y(h.gain)} r={5} fill={diffColor[h.difficulty]} fillOpacity={0.8}>
            <title>{`${h.name} — ${h.distance} mi, ${h.gain.toLocaleString()} ft`}</title>
          </circle>
        ))}
      </svg>
      <div className="mt-1 flex gap-3 text-xs text-fd-muted-foreground">
        {(['Easy', 'Moderate', 'Hard'] as Difficulty[]).map((d) => (
          <span key={d} className="inline-flex items-center gap-1">
            <span className="inline-block size-2.5 rounded-full" style={{ backgroundColor: diffColor[d] }} />
            {d}
          </span>
        ))}
      </div>
    </div>
  );
}
