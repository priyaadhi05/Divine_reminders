import { moonTropicalLongitudeDeg, norm360, sunTropicalLongitudeDeg } from './astronomy';
import { lahiriAyanamsaDeg } from './ayanamsa';

function tithiFraction(date: Date): number {
  const sun = sunTropicalLongitudeDeg(date);
  const moon = moonTropicalLongitudeDeg(date);
  return norm360(moon - sun) / 12; // continuous 0-30
}

function nakshatraFraction(date: Date): number {
  const ayanamsa = lahiriAyanamsaDeg(date);
  const moon = moonTropicalLongitudeDeg(date);
  const sidereal = norm360(moon - ayanamsa);
  return sidereal / (360 / 27); // continuous 0-27
}

export interface PreciseWindow {
  startUTC: string;
  endUTC: string;
}

// Finds the precise start/end instants of the tithi/nakshatra span containing
// `approxCenter` (typically the event day's sunrise). Coarse-scans a window
// around the center at 2-hour resolution to bracket the entry/exit crossings,
// then bisects each bracket to sub-minute precision. Tithi/nakshatra values
// increase near-monotonically over a +/-searchDays window, so a single
// entry and single exit crossing is expected.
function findWindow(
  getFraction: (d: Date) => number,
  isInTarget: (fraction: number) => boolean,
  approxCenter: Date,
  searchDays: number
): PreciseWindow | null {
  const stepMs = 2 * 60 * 60 * 1000;
  const startScan = new Date(approxCenter.getTime() - searchDays * 86400000);
  const endScan = new Date(approxCenter.getTime() + searchDays * 86400000);

  let prevIn = isInTarget(getFraction(startScan));
  let prevT = startScan.getTime();
  let entryBracket: [number, number] | null = null;
  let exitBracket: [number, number] | null = null;

  for (let t = startScan.getTime() + stepMs; t <= endScan.getTime(); t += stepMs) {
    const curIn = isInTarget(getFraction(new Date(t)));
    if (!prevIn && curIn && !entryBracket) entryBracket = [prevT, t];
    if (prevIn && !curIn && entryBracket && !exitBracket) exitBracket = [prevT, t];
    prevIn = curIn;
    prevT = t;
  }
  if (!entryBracket || !exitBracket) return null;

  const bisect = ([lo, hi]: [number, number], wantIn: boolean): Date => {
    for (let i = 0; i < 25; i++) {
      const mid = (lo + hi) / 2;
      const curIn = isInTarget(getFraction(new Date(mid)));
      if (curIn === wantIn) hi = mid;
      else lo = mid;
    }
    return new Date(hi);
  };

  return {
    startUTC: bisect(entryBracket, true).toISOString(),
    endUTC: bisect(exitBracket, false).toISOString(),
  };
}

export function findTithiWindow(targetTithi: number, approxCenter: Date): PreciseWindow | null {
  return findWindow(tithiFraction, (f) => Math.floor(f) + 1 === targetTithi, approxCenter, 3);
}

export function findNakshatraWindow(targetNakshatraIndex: number, approxCenter: Date): PreciseWindow | null {
  return findWindow(nakshatraFraction, (f) => Math.floor(f) === targetNakshatraIndex, approxCenter, 3);
}
