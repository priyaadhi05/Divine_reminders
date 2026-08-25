import { computeDayPanchangam, type DayPanchangam } from './panchangam';
import { NAKSHATRAS } from './constants';
import { findNakshatraWindow, findTithiWindow } from './precise-timing';

// Shared panchangam utilities used by every deity's event generator
// (data-engine/deities/*.ts). Kept deity-agnostic so adding a new deity
// means writing its festival rules only, not re-deriving these helpers.

export const NAKSHATRA_INDEX: Record<string, number> = Object.fromEntries(
  NAKSHATRAS.map((name, i) => [name, i])
);

export type WindowSpec = { kind: 'tithi' | 'nakshatra'; target: number } | null;

// Structural shape every data-engine/deities/*.ts DeityEvent satisfies -
// used where code (e.g. generate.ts) needs to handle events from any deity
// generically, without importing each deity's own narrower type.
export interface BaseDeityEvent {
  id: string;
  deity: string;
  name: string;
  tamilName: string;
  date: string;
  category: string;
  tamilMonth: string;
  basis: string;
  description: string;
  significance: string;
  periodStartUTC?: string;
  periodEndUTC?: string;
}

export function computeWindow(
  spec: WindowSpec,
  sunriseUTC: string
): { periodStartUTC?: string; periodEndUTC?: string } {
  if (!spec) return {};
  const center = new Date(sunriseUTC);
  const window = spec.kind === 'tithi' ? findTithiWindow(spec.target, center) : findNakshatraWindow(spec.target, center);
  return window ? { periodStartUTC: window.startUTC, periodEndUTC: window.endUTC } : {};
}

// Find the day (within `tamilMonth`) whose sunrise value of a cyclic panchangam
// quantity (tithi or nakshatra) equals `target`. If that value never touches a
// sunrise that month (a "kshaya" tithi/nakshatra - it both starts and ends
// between two consecutive sunrises), fall back to the earlier of the two
// bracketing days, since that value's entire span falls within that day's
// sunrise-to-sunrise civil period. This mirrors how printed panchangams
// resolve kshaya days.
export function findCyclicInMonth(
  days: DayPanchangam[],
  tamilMonth: string,
  getValue: (d: DayPanchangam) => number,
  modulus: number,
  target: number
): number {
  const monthDays = days
    .map((d, i) => ({ d, i }))
    .filter((x) => x.d.tamilMonthName === tamilMonth);

  for (const { d, i } of monthDays) {
    if (getValue(d) === target) return i;
  }

  for (let k = 1; k < monthDays.length; k++) {
    const prev = monthDays[k - 1];
    const curr = monthDays[k];
    if (curr.i !== prev.i + 1) continue; // only adjacent calendar days form a real skip window
    const prevVal = getValue(prev.d);
    const currVal = getValue(curr.d);
    const gap = (currVal - prevVal + modulus) % modulus;
    if (gap > 1) {
      const targetOffset = (target - prevVal + modulus) % modulus;
      if (targetOffset > 0 && targetOffset < gap) return prev.i;
    }
  }

  return -1;
}

export function nakshatraInMonth(days: DayPanchangam[], tamilMonth: string, nakshatraIndex: number): number {
  return findCyclicInMonth(days, tamilMonth, (d) => d.nakshatraIndex, 27, nakshatraIndex);
}

export function tithiInMonth(days: DayPanchangam[], tamilMonth: string, tithiNum: number): number {
  // tithiNum is 1-30; shift to 0-indexed for consistent modulus arithmetic.
  return findCyclicInMonth(days, tamilMonth, (d) => d.tithiNum - 1, 30, tithiNum - 1);
}

// Anchored search for a tithi near a known-correct day (e.g. Prathamai just
// before, or Navami just after, an already-located Ashtami/Sashti). A
// month-wide search for a low tithi number can wrongly match a leftover
// occurrence from the tail of the *previous* lunar cycle if that cycle's
// Shukla paksha spills a few days into the start of the solar month; anchoring
// to the day we already trust avoids that.
export function findTithiNear(days: DayPanchangam[], centerIndex: number, target: number, direction: -1 | 1, maxOffset: number): number {
  for (let offset = 1; offset <= maxOffset; offset++) {
    const idx = centerIndex + direction * offset;
    if (days[idx]?.tithiNum === target) return idx;
  }
  // Kshaya fallback: target tithi may not touch any sunrise in this window.
  // Start at offset 0 so the pair (center, center+direction) is checked too -
  // a tithi can be skipped immediately adjacent to the anchor day.
  for (let offset = 0; offset < maxOffset; offset++) {
    const idxA = centerIndex + direction * offset;
    const idxB = idxA + direction;
    if (!days[idxA] || !days[idxB]) break;
    const idxLo = Math.min(idxA, idxB);
    const idxHi = Math.max(idxA, idxB);
    const gap = (days[idxHi].tithiNum - days[idxLo].tithiNum + 30) % 30;
    if (gap > 1) {
      const targetOffset = (target - days[idxLo].tithiNum + 30) % 30;
      if (targetOffset > 0 && targetOffset < gap) return idxLo;
    }
  }
  return -1;
}

export function subtractDays(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() - n);
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Some rule-derived dates (e.g. N days before/after another event) fall
// outside the precomputed `days` range - before its start year. Fall back to
// computing that single day directly rather than approximating its Tamil month.
export function panchangamForDate(days: DayPanchangam[], dateStr: string): DayPanchangam {
  const found = days.find((d) => d.dateStr === dateStr);
  if (found) return found;
  const [y, m, d] = dateStr.split('-').map(Number);
  return computeDayPanchangam(y, m, d);
}

// Find every occurrence of a cyclic panchangam value (tithi or nakshatra)
// across the whole date range, once per lunar/sidereal cycle - e.g. every
// Shukla Ekadashi (~12x/year) or every Krittika nakshatra day (~13x/year).
// Consecutive-day matches (the value spans more than one sunrise) collapse
// to a single occurrence at the first day; kshaya gaps (the value never
// touches a sunrise) are filled in the same way as findCyclicInMonth, using
// the day whose sunrise-to-sunrise span fully contains it.
export function findAllCyclicOccurrences(
  days: DayPanchangam[],
  getValue: (d: DayPanchangam) => number,
  modulus: number,
  target: number
): number[] {
  const indices: number[] = [];
  const minSpacing = Math.floor(modulus * 0.6); // real cycles are >=~18-20 days apart; guards against false merges

  for (let i = 0; i < days.length; i++) {
    if (getValue(days[i]) === target) {
      if (indices.length === 0 || i - indices[indices.length - 1] > minSpacing) {
        indices.push(i);
      }
    }
  }

  for (let i = 1; i < days.length; i++) {
    const prevVal = getValue(days[i - 1]);
    const currVal = getValue(days[i]);
    const gap = (currVal - prevVal + modulus) % modulus;
    if (gap > 1) {
      const targetOffset = (target - prevVal + modulus) % modulus;
      if (targetOffset > 0 && targetOffset < gap) {
        const candidate = i - 1;
        if (!indices.some((idx) => Math.abs(idx - candidate) <= minSpacing)) {
          indices.push(candidate);
        }
      }
    }
  }

  indices.sort((a, b) => a - b);
  return indices;
}
